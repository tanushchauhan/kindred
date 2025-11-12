import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Configuration for the matching algorithm
const MATCH_CONFIG = {
  // Number of candidates to retrieve from vector search (Stage 1)
  CANDIDATES_PER_ROLE: 10,
  // Minimum similarity threshold for vector search (0-1 scale)
  SIMILARITY_THRESHOLD: 0.25,
  // NVIDIA Llama 3.1 Nemotron Ultra model for final ranking and reasoning
  LLM_MODEL: "nvidia/llama-3.1-nemotron-ultra-253b-v1",
};

/**
 * GET /api/me/match
 *
 * AI-powered matching endpoint that finds the best trainer and nutritionist
 * for the authenticated client based on their onboarding data.
 *
 * Two-stage process:
 * 1. Vector similarity search (fast retrieval of top N candidates)
 * 2. LLM-based ranking and reasoning (intelligent final selection)
 *
 * Security: Only accessible to authenticated users with role="client"
 *
 * Returns:
 * {
 *   matches: {
 *     trainer: { user_id, user_name, full_name, bio, specialties, reasoning },
 *     nutritionist: { user_id, user_name, full_name, bio, specialties, reasoning }
 *   },
 *   metadata: {
 *     query_timestamp, candidates_retrieved, processing_time_ms
 *   }
 * }
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Validate environment variables
    if (!NVIDIA_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured. Please contact support." },
        { status: 500 }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 }
      );
    }

    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user is a client
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    if (userData.role !== "client") {
      return NextResponse.json(
        { error: "This feature is only available to clients" },
        { status: 403 }
      );
    }

    // Fetch client's onboarding data
    const { data: clientProfile, error: profileError } = await supabase
      .from("client_profiles")
      .select("onboarding_data")
      .eq("user_id", user.id)
      .single();

    if (profileError || !clientProfile) {
      return NextResponse.json(
        {
          error: "Client profile not found. Please complete onboarding first.",
        },
        { status: 404 }
      );
    }

    if (!clientProfile.onboarding_data) {
      return NextResponse.json(
        {
          error:
            "No onboarding data found. Please complete your wellness profile.",
        },
        { status: 400 }
      );
    }

    // ========================================
    // STAGE 1: SEMANTIC RETRIEVAL
    // ========================================

    console.log("Stage 1: Generating query embedding from client profile...");

    // Construct query document from client's onboarding data
    const queryDocument = constructClientQueryDocument(
      clientProfile.onboarding_data
    );

    // Generate embedding for the client's needs
    const queryEmbedding = await generateEmbedding(queryDocument);

    // Create service role client for vector search (bypasses RLS)
    const adminSupabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log("Stage 1: Performing vector similarity search...");

    // Search for matching trainers
    const { data: trainerCandidates, error: trainerSearchError } =
      await adminSupabase.rpc("match_trainers", {
        query_embedding: queryEmbedding,
        match_threshold: MATCH_CONFIG.SIMILARITY_THRESHOLD,
        match_count: MATCH_CONFIG.CANDIDATES_PER_ROLE,
      });

    if (trainerSearchError) {
      console.error("Trainer search error:", trainerSearchError);
      return NextResponse.json(
        { error: "Failed to search for trainers. Please try again." },
        { status: 500 }
      );
    }

    // Search for matching nutritionists
    const { data: nutritionistCandidates, error: nutritionistSearchError } =
      await adminSupabase.rpc("match_nutritionists", {
        query_embedding: queryEmbedding,
        match_threshold: MATCH_CONFIG.SIMILARITY_THRESHOLD,
        match_count: MATCH_CONFIG.CANDIDATES_PER_ROLE,
      });

    if (nutritionistSearchError) {
      console.error("Nutritionist search error:", nutritionistSearchError);
      return NextResponse.json(
        { error: "Failed to search for nutritionists. Please try again." },
        { status: 500 }
      );
    }

    // Check if we have any candidates
    if (!trainerCandidates || trainerCandidates.length === 0) {
      return NextResponse.json(
        { error: "No matching trainers found. Please try again later." },
        { status: 404 }
      );
    }

    if (!nutritionistCandidates || nutritionistCandidates.length === 0) {
      return NextResponse.json(
        { error: "No matching nutritionists found. Please try again later." },
        { status: 404 }
      );
    }

    console.log(
      `Stage 1 complete: Found ${trainerCandidates.length} trainer candidates, ${nutritionistCandidates.length} nutritionist candidates`
    );

    // ========================================
    // STAGE 2: LLM RANKING & REASONING
    // ========================================

    console.log("Stage 2: Fetching full candidate profiles...");

    // Fetch full profiles for the candidates
    const trainerUserIds = trainerCandidates.map(
      (c: { user_id: string }) => c.user_id
    );
    const nutritionistUserIds = nutritionistCandidates.map(
      (c: { user_id: string }) => c.user_id
    );

    const { data: trainerProfiles, error: trainerProfileError } =
      await adminSupabase
        .from("users")
        .select(
          `
        id,
        user_name,
        full_name,
        trainer_profiles (bio, specialties)
      `
        )
        .in("id", trainerUserIds);

    const { data: nutritionistProfiles, error: nutritionistProfileError } =
      await adminSupabase
        .from("users")
        .select(
          `
        id,
        user_name,
        full_name,
        nutritionist_profiles (bio, specialties)
      `
        )
        .in("id", nutritionistUserIds);

    if (trainerProfileError || nutritionistProfileError) {
      console.error(
        "Profile fetch error:",
        trainerProfileError || nutritionistProfileError
      );
      return NextResponse.json(
        { error: "Failed to fetch candidate profiles" },
        { status: 500 }
      );
    }

    console.log("Stage 2: Calling NVIDIA Llama for intelligent matching...");

    // Call LLM to rank and reason about matches
    const matchResult = await performLLMMatching(
      clientProfile.onboarding_data,
      trainerProfiles || [],
      nutritionistProfiles || []
    );

    const processingTime = Date.now() - startTime;

    console.log(`Matching complete in ${processingTime}ms`);

    // Return the final matches with reasoning
    return NextResponse.json({
      matches: matchResult,
      metadata: {
        query_timestamp: new Date().toISOString(),
        candidates_retrieved: {
          trainers: trainerCandidates.length,
          nutritionists: nutritionistCandidates.length,
        },
        processing_time_ms: processingTime,
      },
    });
  } catch (error) {
    console.error("Error in /api/me/match:", error);
    return NextResponse.json(
      {
        error: "Failed to generate matches",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Construct a query document from client's onboarding data
 * This should create a rich text representation of their needs, goals, and preferences
 */
function constructClientQueryDocument(
  onboardingData: Record<string, unknown>
): string {
  const parts: string[] = [];

  // Extract common fields (adapt based on your actual onboarding structure)
  if (onboardingData.goals) {
    parts.push(`Goals: ${JSON.stringify(onboardingData.goals)}`);
  }

  if (onboardingData.preferences) {
    parts.push(`Preferences: ${JSON.stringify(onboardingData.preferences)}`);
  }

  if (onboardingData.fitnessLevel) {
    parts.push(`Fitness Level: ${onboardingData.fitnessLevel}`);
  }

  if (onboardingData.healthConditions) {
    parts.push(
      `Health Considerations: ${JSON.stringify(
        onboardingData.healthConditions
      )}`
    );
  }

  if (onboardingData.dietaryRestrictions) {
    parts.push(
      `Dietary Restrictions: ${JSON.stringify(
        onboardingData.dietaryRestrictions
      )}`
    );
  }

  // Fallback: If specific fields aren't present, stringify the entire object
  if (parts.length === 0) {
    parts.push(`Client Profile: ${JSON.stringify(onboardingData)}`);
  }

  return parts.join("\n\n");
}

/**
 * Generate embedding using NVIDIA NV-EmbedQA-E5-v5 API
 * Uses nv-embedqa-e5-v5 model with 1024-dimensional vectors
 * Note: Use input_type="query" for search queries, "passage" for storing content
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    "https://integrate.api.nvidia.com/v1/embeddings",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        input: [text],
        model: "nvidia/nv-embedqa-e5-v5",
        encoding_format: "float",
        input_type: "query", // Use "query" for search, "passage" for storage
        truncate: "NONE",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!data.data || !data.data[0] || !data.data[0].embedding) {
    throw new Error("Invalid response from NVIDIA API: missing embedding data");
  }

  return data.data[0].embedding;
}

/**
 * Use NVIDIA Llama 3.1 Nemotron Ultra to intelligently rank candidates and provide reasoning
 * This is Stage 2 of the matching process
 */
async function performLLMMatching(
  clientData: Record<string, unknown>,
  trainerProfiles: CandidateProfile[],
  nutritionistProfiles: CandidateProfile[]
): Promise<MatchResult> {
  // Construct the prompt for the LLM
  const prompt = `You are an expert wellness matchmaker. Your task is to analyze a client's profile and select the single best trainer and nutritionist from the provided candidates.

CLIENT PROFILE:
${JSON.stringify(clientData, null, 2)}

TRAINER CANDIDATES:
${JSON.stringify(trainerProfiles, null, 2)}

NUTRITIONIST CANDIDATES:
${JSON.stringify(nutritionistProfiles, null, 2)}

INSTRUCTIONS:
1. Carefully analyze the client's goals, preferences, health conditions, and fitness level
2. For TRAINERS: Select the ONE trainer whose specialties, bio, and approach best align with the client's fitness goals and needs
3. For NUTRITIONISTS: Select the ONE nutritionist whose specialties, bio, and approach best align with the client's dietary needs and health goals
4. For each match, provide a brief, personalized explanation (2-3 sentences) of why this professional is the best fit
5. In your reasoning response, refer to the client in 2nd person (e.g., "You would benefit from...")

Respond ONLY with valid JSON in this exact format:
{
  "trainer": {
    "user_id": "selected_trainer_user_id",
    "reasoning": "Brief explanation of why this trainer is the best match"
  },
  "nutritionist": {
    "user_id": "selected_nutritionist_user_id",
    "reasoning": "Brief explanation of why this nutritionist is the best match"
  }
}`;

  const response = await fetch(
    "https://integrate.api.nvidia.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: MATCH_CONFIG.LLM_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an expert wellness matchmaker. Provide detailed, thoughtful analysis.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.6,
        top_p: 0.95,
        max_tokens: 4096,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA LLM API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // Extract the generated text
  const generatedText = data.choices?.[0]?.message?.reasoning_content;

  if (!generatedText) {
    throw new Error("No response from LLM");
  }

  // Parse the JSON response
  let llmResult: LLMMatchResponse;
  try {
    // Remove markdown code blocks if present
    const cleanedText = generatedText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    llmResult = JSON.parse(cleanedText);
  } catch {
    console.error("Failed to parse LLM response:", generatedText);
    throw new Error("Invalid JSON response from AI matching service");
  }

  // Validate the response structure
  if (!llmResult.trainer?.user_id || !llmResult.nutritionist?.user_id) {
    throw new Error("LLM response missing required fields");
  }

  // Enrich with full profile data
  const selectedTrainer = trainerProfiles.find(
    (p) => p.id === llmResult.trainer.user_id
  );
  const selectedNutritionist = nutritionistProfiles.find(
    (p) => p.id === llmResult.nutritionist.user_id
  );

  if (!selectedTrainer || !selectedNutritionist) {
    throw new Error("LLM selected invalid candidate IDs");
  }

  return {
    trainer: {
      user_id: selectedTrainer.id,
      user_name: selectedTrainer.user_name,
      full_name: selectedTrainer.full_name,
      bio:
        selectedTrainer.trainer_profiles?.[0]?.bio ||
        selectedTrainer.nutritionist_profiles?.[0]?.bio ||
        "",
      specialties:
        selectedTrainer.trainer_profiles?.[0]?.specialties ||
        selectedTrainer.nutritionist_profiles?.[0]?.specialties ||
        [],
      reasoning: llmResult.trainer.reasoning,
    },
    nutritionist: {
      user_id: selectedNutritionist.id,
      user_name: selectedNutritionist.user_name,
      full_name: selectedNutritionist.full_name,
      bio:
        selectedNutritionist.trainer_profiles?.[0]?.bio ||
        selectedNutritionist.nutritionist_profiles?.[0]?.bio ||
        "",
      specialties:
        selectedNutritionist.trainer_profiles?.[0]?.specialties ||
        selectedNutritionist.nutritionist_profiles?.[0]?.specialties ||
        [],
      reasoning: llmResult.nutritionist.reasoning,
    },
  };
}

// Type definitions for internal use

interface CandidateProfile {
  id: string;
  user_name: string;
  full_name: string;
  trainer_profiles?: Array<{
    bio: string;
    specialties: string[];
  }>;
  nutritionist_profiles?: Array<{
    bio: string;
    specialties: string[];
  }>;
}

interface LLMMatchResponse {
  trainer: {
    user_id: string;
    reasoning: string;
  };
  nutritionist: {
    user_id: string;
    reasoning: string;
  };
}

interface MatchResult {
  trainer: {
    user_id: string;
    user_name: string;
    full_name: string;
    bio: string;
    specialties: string[];
    reasoning: string;
  };
  nutritionist: {
    user_id: string;
    user_name: string;
    full_name: string;
    bio: string;
    specialties: string[];
    reasoning: string;
  };
}

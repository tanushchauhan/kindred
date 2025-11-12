import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * POST /api/admin/generate-embeddings
 *
 * One-time bulk generation of embeddings for all existing professionals.
 * This route should be called after initial setup to backfill embeddings.
 *
 * Security: Requires authenticated admin user (role="admin")
 *
 * Query Parameters:
 * - type: "trainers" | "nutritionists" | "all" (default: "all")
 *
 * Example:
 * POST /api/admin/generate-embeddings?type=all
 */
export async function POST(request: NextRequest) {
  // STEP 1: Verify admin authorization
  const authCheck = await requireAdmin();
  if (authCheck instanceof NextResponse) {
    return authCheck; // Return 401, 403, or 500 error
  }

  try {
    // Validate environment variables
    if (!NVIDIA_API_KEY) {
      return NextResponse.json(
        { error: "NVIDIA_API_KEY not configured" },
        { status: 500 }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 }
      );
    }

    // Get the type parameter (which professionals to process)
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";

    if (!["trainers", "nutritionists", "all"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Use 'trainers', 'nutritionists', or 'all'" },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const results = {
      trainers: { processed: 0, success: 0, failed: 0, errors: [] as string[] },
      nutritionists: {
        processed: 0,
        success: 0,
        failed: 0,
        errors: [] as string[],
      },
    };

    // Process trainers
    if (type === "trainers" || type === "all") {
      console.log("Processing trainer embeddings...");
      const trainerResults = await processTrainers(supabase);
      results.trainers = trainerResults;
    }

    // Process nutritionists
    if (type === "nutritionists" || type === "all") {
      console.log("Processing nutritionist embeddings...");
      const nutritionistResults = await processNutritionists(supabase);
      results.nutritionists = nutritionistResults;
    }

    return NextResponse.json({
      message: "Embedding generation complete",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in generate-embeddings:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Process all trainers and generate embeddings
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processTrainers(supabase: any) {
  const results = {
    processed: 0,
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Fetch all verified trainers with bios
    const { data: trainers, error } = await supabase
      .from("trainer_profiles")
      .select("user_id, bio, specialties")
      .eq("is_verified", true)
      .not("bio", "is", null);

    if (error) {
      console.error("Error fetching trainers:", error);
      results.errors.push(`Fetch error: ${error.message}`);
      return results;
    }

    if (!trainers || trainers.length === 0) {
      console.log("No trainers to process");
      return results;
    }

    console.log(`Found ${trainers.length} trainers to process`);

    // Process each trainer
    for (const trainer of trainers) {
      results.processed++;

      try {
        // Construct profile document
        const documentText = constructProfileDocument({
          bio: trainer.bio,
          specialties: trainer.specialties || [],
        });

        // Generate embedding
        const embedding = await generateEmbedding(documentText);

        // Update database
        const { error: updateError } = await supabase
          .from("trainer_profiles")
          .update({ embedding: embedding })
          .eq("user_id", trainer.user_id);

        if (updateError) {
          throw updateError;
        }

        results.success++;
        console.log(`✓ Trainer ${trainer.user_id} - embedding generated`);
      } catch (err) {
        results.failed++;
        const errorMsg = `Trainer ${trainer.user_id}: ${
          err instanceof Error ? err.message : "Unknown error"
        }`;
        results.errors.push(errorMsg);
        console.error(`✗ ${errorMsg}`);
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    results.errors.push(`Process trainers error: ${errorMsg}`);
  }

  return results;
}

/**
 * Process all nutritionists and generate embeddings
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processNutritionists(supabase: any) {
  const results = {
    processed: 0,
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Fetch all verified nutritionists with bios
    const { data: nutritionists, error } = await supabase
      .from("nutritionist_profiles")
      .select("user_id, bio, specialties")
      .eq("is_verified", true)
      .not("bio", "is", null);

    if (error) {
      console.error("Error fetching nutritionists:", error);
      results.errors.push(`Fetch error: ${error.message}`);
      return results;
    }

    if (!nutritionists || nutritionists.length === 0) {
      console.log("No nutritionists to process");
      return results;
    }

    console.log(`Found ${nutritionists.length} nutritionists to process`);

    // Process each nutritionist
    for (const nutritionist of nutritionists) {
      results.processed++;

      try {
        // Construct profile document
        const documentText = constructProfileDocument({
          bio: nutritionist.bio,
          specialties: nutritionist.specialties || [],
        });

        // Generate embedding
        const embedding = await generateEmbedding(documentText);

        // Update database
        const { error: updateError } = await supabase
          .from("nutritionist_profiles")
          .update({ embedding: embedding })
          .eq("user_id", nutritionist.user_id);

        if (updateError) {
          throw updateError;
        }

        results.success++;
        console.log(
          `✓ Nutritionist ${nutritionist.user_id} - embedding generated`
        );
      } catch (err) {
        results.failed++;
        const errorMsg = `Nutritionist ${nutritionist.user_id}: ${
          err instanceof Error ? err.message : "Unknown error"
        }`;
        results.errors.push(errorMsg);
        console.error(`✗ ${errorMsg}`);
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    results.errors.push(`Process nutritionists error: ${errorMsg}`);
  }

  return results;
}

/**
 * Construct a rich text document from a professional's profile
 * This text will be embedded to capture semantic meaning
 */
function constructProfileDocument(profile: {
  bio: string;
  specialties: string[];
}): string {
  const parts = [
    `Professional Bio: ${profile.bio}`,
    `Areas of Expertise: ${profile.specialties.join(", ")}`,
  ];

  return parts.join("\n\n");
}

/**
 * Generate embedding using NVIDIA NV-EmbedQA-E5-v5 API
 * Uses nv-embedqa-e5-v5 model with 1024-dimensional vectors
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
        input_type: "passage",
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

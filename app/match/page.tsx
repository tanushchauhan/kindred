"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Professional {
  user_id: string;
  user_name: string;
  full_name: string;
  bio: string;
  specialties: string[];
  certifications?: string[];
  years_of_experience?: number;
}

interface CurrentMatchResponse {
  matches: {
    trainer: Professional | null;
    nutritionist: Professional | null;
  };
  metadata: {
    created_at: string;
    last_updated: string;
  };
}

interface AIMatchResponse {
  matches: {
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
  };
  metadata: {
    query_timestamp: string;
    candidates_retrieved: {
      trainers: number;
      nutritionists: number;
    };
    processing_time_ms: number;
  };
}

interface AvailableProfessional {
  id: string;
  full_name: string;
  user_name: string;
  trainer_profiles?: { bio: string; specialties: string[] };
  nutritionist_profiles?: { bio: string; specialties: string[] };
}

type ViewMode = "current" | "ai-matching" | "manual-select";

export default function MatchPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("current");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentMatches, setCurrentMatches] =
    useState<CurrentMatchResponse | null>(null);
  const [aiMatchResult, setAiMatchResult] = useState<AIMatchResponse | null>(
    null
  );
  const [availableTrainers, setAvailableTrainers] = useState<
    AvailableProfessional[]
  >([]);
  const [availableNutritionists, setAvailableNutritionists] = useState<
    AvailableProfessional[]
  >([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(
    null
  );
  const [selectedNutritionistId, setSelectedNutritionistId] = useState<
    string | null
  >(null);

  useEffect(() => {
    loadCurrentMatches();
    loadAvailableProfessionals();
  }, []);

  const loadCurrentMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/me/match/current");

      if (response.ok) {
        const data: CurrentMatchResponse = await response.json();
        setCurrentMatches(data);
        setViewMode("current");
      } else if (response.status === 404) {
        setViewMode("ai-matching");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to load matches");
      }
    } catch (err) {
      console.error("Error loading matches:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableProfessionals = async () => {
    try {
      const response = await fetch("/api/professionals");
      if (response.ok) {
        const data = await response.json();
        setAvailableTrainers(data.trainers || []);
        setAvailableNutritionists(data.nutritionists || []);
      }
    } catch (err) {
      console.error("Error loading professionals:", err);
    }
  };

  const runAIMatch = async () => {
    try {
      setLoading(true);
      setError("");
      setViewMode("ai-matching");

      const response = await fetch("/api/me/match");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to find matches");
      }

      const data: AIMatchResponse = await response.json();
      setAiMatchResult(data);
      // Don't auto-save or reload - let user decide
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setViewMode("current");
    } finally {
      setLoading(false);
    }
  };

  const updateMatch = async (
    trainerId?: string | null,
    nutritionistId?: string | null
  ) => {
    try {
      setLoading(true);
      setError("");

      const body: Record<string, string | null> = {};
      if (trainerId !== undefined) body.trainerId = trainerId;
      if (nutritionistId !== undefined) body.nutritionistId = nutritionistId;

      const response = await fetch("/api/me/match/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update match");
      }

      await loadCurrentMatches();
      setViewMode("current");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const saveManualSelections = async () => {
    if (selectedTrainerId === null || selectedNutritionistId === null) {
      setError("Please select both a trainer and a nutritionist");
      return;
    }
    await updateMatch(selectedTrainerId, selectedNutritionistId);
    setSelectedTrainerId(null);
    setSelectedNutritionistId(null);
  };

  const acceptAIMatches = async () => {
    if (!aiMatchResult) return;
    await updateMatch(
      aiMatchResult.matches.trainer.user_id,
      aiMatchResult.matches.nutritionist.user_id
    );
    setAiMatchResult(null);
  };

  if (loading && viewMode === "ai-matching") {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto relative">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-5xl animate-pulse">🤖</div>
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Finding Your Perfect Matches
          </h1>
          <div className="space-y-2 text-gray-600">
            <p className="animate-pulse">🧠 Analyzing your wellness goals...</p>
            <p className="animate-pulse">
              🔍 Searching verified professionals...
            </p>
            <p className="animate-pulse">
              ✨ AI is selecting the best matches for you...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (aiMatchResult && viewMode === "ai-matching") {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <div className="text-6xl animate-bounce">✨</div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Your Perfect Matches!
            </h1>
            <p className="text-lg text-gray-600">
              AI has analyzed your profile and found these amazing professionals
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-blue-200">
              <div className="bg-linear-to-r from-blue-500 to-blue-600 text-white p-6">
                <p className="text-blue-100 text-sm font-medium mb-1">
                  YOUR TRAINER MATCH
                </p>
                <Link
                  href={`/professionals/${aiMatchResult.matches.trainer.user_name}`}
                  className="text-2xl font-bold hover:underline"
                  target="_blank"
                >
                  {aiMatchResult.matches.trainer.full_name}
                </Link>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Specialties
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {aiMatchResult.matches.trainer.specialties.map(
                      (specialty, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {specialty}
                        </span>
                      )
                    )}
                  </div>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">🤖</div>
                    <div>
                      <h3 className="text-sm font-semibold text-blue-900 mb-1">
                        Why This Match?
                      </h3>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {aiMatchResult.matches.trainer.reasoning}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-green-200">
              <div className="bg-linear-to-r from-green-500 to-green-600 text-white p-6">
                <p className="text-green-100 text-sm font-medium mb-1">
                  YOUR NUTRITIONIST MATCH
                </p>
                <Link
                  href={`/professionals/${aiMatchResult.matches.nutritionist.user_name}`}
                  className="text-2xl font-bold hover:underline"
                  target="_blank"
                >
                  {aiMatchResult.matches.nutritionist.full_name}
                </Link>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Specialties
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {aiMatchResult.matches.nutritionist.specialties.map(
                      (specialty, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                        >
                          {specialty}
                        </span>
                      )
                    )}
                  </div>
                </div>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">🤖</div>
                    <div>
                      <h3 className="text-sm font-semibold text-green-900 mb-1">
                        Why This Match?
                      </h3>
                      <p className="text-sm text-green-800 leading-relaxed">
                        {aiMatchResult.matches.nutritionist.reasoning}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="flex justify-center gap-4">
              <button
                onClick={acceptAIMatches}
                disabled={loading}
                className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium text-lg disabled:opacity-50"
              >
                ✓ Accept These Matches
              </button>
              <button
                onClick={() => setViewMode("manual-select")}
                className="px-8 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition font-medium text-lg"
              >
                Choose Different Professionals
              </button>
            </div>
            <button
              onClick={() => {
                setAiMatchResult(null);
                setViewMode("current");
              }}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancel and go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Manual Selection Mode
  if (viewMode === "manual-select") {
    // Prefill with current selections if they exist
    if (
      currentMatches &&
      selectedTrainerId === null &&
      selectedNutritionistId === null
    ) {
      if (currentMatches.matches.trainer) {
        setSelectedTrainerId(currentMatches.matches.trainer.user_id);
      }
      if (currentMatches.matches.nutritionist) {
        setSelectedNutritionistId(currentMatches.matches.nutritionist.user_id);
      }
    }

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => setViewMode("current")}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold mb-8">Select Professionals</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">
                🏋️ Select Trainer{" "}
                <span className="text-red-500 text-sm">*required</span>
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableTrainers.map((trainer) => (
                  <div
                    key={trainer.id}
                    onClick={() => setSelectedTrainerId(trainer.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedTrainerId === trainer.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <h3 className="font-semibold">{trainer.full_name}</h3>
                    <p className="text-sm text-gray-500">
                      @{trainer.user_name}
                    </p>
                    {trainer.trainer_profiles && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {trainer.trainer_profiles.specialties
                          .slice(0, 3)
                          .map((specialty, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                            >
                              {specialty}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">
                🥗 Select Nutritionist{" "}
                <span className="text-red-500 text-sm">*required</span>
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableNutritionists.map((nutritionist) => (
                  <div
                    key={nutritionist.id}
                    onClick={() => setSelectedNutritionistId(nutritionist.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedNutritionistId === nutritionist.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <h3 className="font-semibold">{nutritionist.full_name}</h3>
                    <p className="text-sm text-gray-500">
                      @{nutritionist.user_name}
                    </p>
                    {nutritionist.nutritionist_profiles && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {nutritionist.nutritionist_profiles.specialties
                          .slice(0, 3)
                          .map((specialty, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs"
                            >
                              {specialty}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={saveManualSelections}
              disabled={
                loading ||
                selectedTrainerId === null ||
                selectedNutritionistId === null
              }
              className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Selections"}
            </button>
            {(selectedTrainerId === null ||
              selectedNutritionistId === null) && (
              <p className="mt-3 text-sm text-red-600">
                Please select both a trainer and a nutritionist to continue
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Current Matches View
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12">
          My Wellness Team
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : currentMatches ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-blue-200">
                <div className="bg-linear-to-r from-blue-500 to-blue-600 text-white p-6">
                  <p className="text-sm mb-1">MY TRAINER</p>
                  <p className="text-2xl font-bold">
                    {currentMatches.matches.trainer?.full_name ||
                      "Not Selected"}
                  </p>
                </div>
                <div className="p-6">
                  {currentMatches.matches.trainer ? (
                    <>
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {currentMatches.matches.trainer.specialties.map(
                            (s, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                              >
                                {s}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {currentMatches.matches.trainer.bio}
                      </p>
                      <button
                        onClick={() => setViewMode("manual-select")}
                        className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                      >
                        Change Trainer
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setViewMode("manual-select")}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Select Trainer
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-green-200">
                <div className="bg-linear-to-r from-green-500 to-green-600 text-white p-6">
                  <p className="text-sm mb-1">MY NUTRITIONIST</p>
                  <p className="text-2xl font-bold">
                    {currentMatches.matches.nutritionist?.full_name ||
                      "Not Selected"}
                  </p>
                </div>
                <div className="p-6">
                  {currentMatches.matches.nutritionist ? (
                    <>
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {currentMatches.matches.nutritionist.specialties.map(
                            (s, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                              >
                                {s}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {currentMatches.matches.nutritionist.bio}
                      </p>
                      <button
                        onClick={() => setViewMode("manual-select")}
                        className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                      >
                        Change Nutritionist
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setViewMode("manual-select")}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Select Nutritionist
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="flex justify-center gap-4">
                <button
                  onClick={runAIMatch}
                  disabled={loading}
                  className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium disabled:opacity-50"
                >
                  🤖{" "}
                  {currentMatches.matches.trainer ||
                  currentMatches.matches.nutritionist
                    ? "Get New AI Recommendations"
                    : "Get AI Matches"}
                </button>
                <button
                  onClick={() => setViewMode("manual-select")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  👤 Browse & Select Manually
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
                >
                  Dashboard
                </button>
              </div>
              <p className="text-sm text-gray-500">
                💡 Get personalized AI recommendations or browse all verified
                professionals
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold mb-4">
                Get Started with Your Wellness Team
              </h2>
              <p className="text-gray-600 mb-8">
                Choose how you&apos;d like to find your trainer and nutritionist
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={runAIMatch}
                  className="p-6 border-2 border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50"
                >
                  <div className="text-4xl mb-3">🤖</div>
                  <h3 className="text-lg font-bold mb-2">AI Matching</h3>
                  <p className="text-sm text-gray-600">
                    Let AI analyze your profile and find perfect matches
                  </p>
                </button>
                <button
                  onClick={() => setViewMode("manual-select")}
                  className="p-6 border-2 border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50"
                >
                  <div className="text-4xl mb-3">👤</div>
                  <h3 className="text-lg font-bold mb-2">Manual Selection</h3>
                  <p className="text-sm text-gray-600">
                    Browse and choose professionals yourself
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

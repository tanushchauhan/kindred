"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Match {
  user_id: string;
  user_name: string;
  full_name: string;
  bio: string;
  specialties: string[];
  reasoning: string;
}

interface MatchResult {
  trainer: Match;
  nutritionist: Match;
}

interface MatchResponse {
  matches: MatchResult;
  metadata: {
    query_timestamp: string;
    candidates_retrieved: {
      trainers: number;
      nutritionists: number;
    };
    processing_time_ms: number;
  };
}

export default function MatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [matches, setMatches] = useState<MatchResult | null>(null);
  const [metadata, setMetadata] = useState<MatchResponse["metadata"] | null>(
    null
  );

  useEffect(() => {
    findMatches();
  }, []);

  const findMatches = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/me/match");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to find matches");
      }

      const data: MatchResponse = await response.json();
      setMatches(data.matches);
      setMetadata(data.metadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          {/* AI Animation */}
          <div className="relative mb-8">
            {/* Outer rotating ring */}
            <div className="w-32 h-32 mx-auto relative">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-spin-slow"></div>
              <div className="absolute inset-2 border-4 border-purple-300 rounded-full animate-spin-reverse"></div>
              <div className="absolute inset-4 border-4 border-pink-200 rounded-full animate-spin-slow"></div>

              {/* Center AI icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-5xl animate-pulse">🤖</div>
              </div>
            </div>

            {/* Floating particles */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64">
              <div className="absolute top-4 left-4 w-3 h-3 bg-blue-400 rounded-full animate-float"></div>
              <div className="absolute top-8 right-8 w-2 h-2 bg-purple-400 rounded-full animate-float-delayed"></div>
              <div className="absolute bottom-12 left-12 w-2.5 h-2.5 bg-pink-400 rounded-full animate-float"></div>
              <div className="absolute bottom-4 right-4 w-3 h-3 bg-indigo-400 rounded-full animate-float-delayed"></div>
            </div>
          </div>

          {/* Loading text */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Finding Your Perfect Matches
          </h1>
          <div className="space-y-2 text-gray-600">
            <p className="animate-pulse">🧠 Analyzing your wellness goals...</p>
            <p className="animate-pulse animation-delay-200">
              🔍 Searching thousands of professionals...
            </p>
            <p className="animate-pulse animation-delay-400">
              ✨ AI is selecting the best matches for you...
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center space-x-2 mt-8">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce animation-delay-200"></div>
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce animation-delay-400"></div>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin-slow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes spin-reverse {
            from {
              transform: rotate(360deg);
            }
            to {
              transform: rotate(0deg);
            }
          }

          @keyframes float {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
          }

          @keyframes float-delayed {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-15px);
            }
          }

          .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
          }

          .animate-spin-reverse {
            animation: spin-reverse 4s linear infinite;
          }

          .animate-float {
            animation: float 3s ease-in-out infinite;
          }

          .animate-float-delayed {
            animation: float-delayed 4s ease-in-out infinite;
          }

          .animation-delay-200 {
            animation-delay: 0.2s;
          }

          .animation-delay-400 {
            animation-delay: 0.4s;
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Unable to Find Matches
              </h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={findMatches}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!matches) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="text-6xl animate-bounce">✨</div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Perfect Matches!
          </h1>
          <p className="text-lg text-gray-600">
            AI has analyzed your profile and found these amazing professionals
            for you
          </p>
          {metadata && (
            <p className="text-sm text-gray-500 mt-2">
              Analyzed {metadata.candidates_retrieved.trainers} trainers and{" "}
              {metadata.candidates_retrieved.nutritionists} nutritionists in{" "}
              {(metadata.processing_time_ms / 1000).toFixed(2)} seconds
            </p>
          )}
        </div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Trainer Match */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-blue-200 hover:border-blue-400 transition">
            <div className="bg-linear-to-r from-blue-500 to-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">
                    YOUR TRAINER MATCH
                  </p>
                  <Link
                    href={`/professionals/${matches.trainer.user_name}`}
                    className="text-2xl font-bold hover:underline cursor-pointer inline-block"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {matches.trainer.full_name}
                  </Link>
                </div>
                <div className="text-5xl">🏋️</div>
              </div>
            </div>

            <div className="p-6">
              {/* Specialties */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Specialties
                </h3>
                <div className="flex flex-wrap gap-2">
                  {matches.trainer.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  About
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {matches.trainer.bio}
                </p>
              </div>

              {/* AI Reasoning */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-start">
                  <div className="text-2xl mr-3">🤖</div>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">
                      Why This Match?
                    </h3>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      {matches.trainer.reasoning}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nutritionist Match */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-green-200 hover:border-green-400 transition">
            <div className="bg-linear-to-r from-green-500 to-green-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">
                    YOUR NUTRITIONIST MATCH
                  </p>
                  <Link
                    href={`/professionals/${matches.nutritionist.user_name}`}
                    className="text-2xl font-bold hover:underline cursor-pointer inline-block"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {matches.nutritionist.full_name}
                  </Link>
                </div>
                <div className="text-5xl">🥗</div>
              </div>
            </div>

            <div className="p-6">
              {/* Specialties */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Specialties
                </h3>
                <div className="flex flex-wrap gap-2">
                  {matches.nutritionist.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  About
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {matches.nutritionist.bio}
                </p>
              </div>

              {/* AI Reasoning */}
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <div className="flex items-start">
                  <div className="text-2xl mr-3">🤖</div>
                  <div>
                    <h3 className="text-sm font-semibold text-green-900 mb-1">
                      Why This Match?
                    </h3>
                    <p className="text-sm text-green-800 leading-relaxed">
                      {matches.nutritionist.reasoning}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center space-y-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition font-medium"
            >
              Back to Dashboard
            </button>
            <button
              onClick={findMatches}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
            >
              Find New Matches
            </button>
          </div>
          <p className="text-sm text-gray-500">
            💡 Tip: Update your onboarding preferences to get different matches
          </p>
        </div>
      </div>
    </div>
  );
}

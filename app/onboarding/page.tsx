"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    goals: [] as string[],
    fitness_level: "",
    dietary_preferences: [] as string[],
    medical_conditions: [] as string[],
    preferred_workout_times: [] as string[],
    additional_notes: "",
  });

  const handleCheckbox = (field: keyof typeof formData, value: string) => {
    const currentValues = formData[field] as string[];
    if (currentValues.includes(value)) {
      setFormData({
        ...formData,
        [field]: currentValues.filter((v) => v !== value),
      });
    } else {
      setFormData({
        ...formData,
        [field]: [...currentValues, value],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/me/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save onboarding data");
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome! Let&apos;s Get Started
          </h1>
          <p className="mt-2 text-gray-600">
            Tell us about your wellness goals and preferences
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What are your wellness goals? (Select all that apply)
              </label>
              <div className="space-y-2">
                {[
                  "weight_loss",
                  "muscle_gain",
                  "general_fitness",
                  "stress_management",
                  "better_sleep",
                  "nutrition_improvement",
                ].map((goal) => (
                  <label key={goal} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.goals.includes(goal)}
                      onChange={() => handleCheckbox("goals", goal)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {goal.replace(/_/g, " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Fitness Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Current Fitness Level
              </label>
              <select
                value={formData.fitness_level}
                onChange={(e) =>
                  setFormData({ ...formData, fitness_level: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Dietary Preferences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Dietary Preferences (Select all that apply)
              </label>
              <div className="space-y-2">
                {[
                  "vegetarian",
                  "vegan",
                  "gluten_free",
                  "dairy_free",
                  "keto",
                  "paleo",
                  "no_restrictions",
                ].map((pref) => (
                  <label key={pref} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.dietary_preferences.includes(pref)}
                      onChange={() =>
                        handleCheckbox("dietary_preferences", pref)
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {pref.replace(/_/g, " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Medical Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Any Medical Conditions or Injuries? (Optional)
              </label>
              <div className="space-y-2">
                {[
                  "heart_condition",
                  "diabetes",
                  "asthma",
                  "joint_issues",
                  "back_pain",
                  "other",
                  "none",
                ].map((condition) => (
                  <label key={condition} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.medical_conditions.includes(condition)}
                      onChange={() =>
                        handleCheckbox("medical_conditions", condition)
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {condition.replace(/_/g, " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preferred Workout Times */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Preferred Workout Times (Select all that apply)
              </label>
              <div className="space-y-2">
                {["morning", "afternoon", "evening", "flexible"].map((time) => (
                  <label key={time} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.preferred_workout_times.includes(time)}
                      onChange={() =>
                        handleCheckbox("preferred_workout_times", time)
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {time}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label
                htmlFor="additional_notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Additional Notes (Optional)
              </label>
              <textarea
                id="additional_notes"
                value={formData.additional_notes}
                onChange={(e) =>
                  setFormData({ ...formData, additional_notes: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional information you'd like to share..."
              />
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 transition font-medium"
              >
                Skip for Now
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
              >
                {loading ? "Saving..." : "Complete Onboarding"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

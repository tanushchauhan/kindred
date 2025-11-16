"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HealthKitDataPoint {
  id: string;
  data_type: string;
  value: number;
  unit: string;
  recorded_at: string;
}

interface ExerciseCompletion {
  id: string;
  exercise_id: string;
  completion_date: string;
  completed: boolean;
  exercises?: {
    name: string;
  };
}

export default function ProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [healthKitData, setHealthKitData] = useState<HealthKitDataPoint[]>([]);
  const [completions, setCompletions] = useState<ExerciseCompletion[]>([]);
  const [error, setError] = useState("");
  const [syncingHealth, setSyncingHealth] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Check authentication
      const authRes = await fetch("/api/me", { credentials: "include" });
      if (!authRes.ok) {
        if (authRes.status === 401) {
          router.push("/auth/signin");
          return;
        }
        throw new Error("Failed to authenticate");
      }

      const userData = await authRes.json();
      if (userData.role !== "client") {
        router.push("/dashboard");
        return;
      }

      // Fetch HealthKit data (last 30 days)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const healthRes = await fetch(
        `/api/me/healthkit?start_date=${startDate.toISOString()}&limit=200`,
        { credentials: "include" }
      );
      if (healthRes.ok) {
        const data = await healthRes.json();
        setHealthKitData(data.data || []);
      }

      // Fetch exercise completions (last 30 days)
      const completionsRes = await fetch(
        `/api/me/exercise-completions?start_date=${startDate.toISOString()}`,
        { credentials: "include" }
      );
      if (completionsRes.ok) {
        const data = await completionsRes.json();
        setCompletions(data.completions || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncHealthKit = async () => {
    setSyncingHealth(true);
    try {
      // This is a placeholder - in a real app, this would trigger
      // the mobile app to sync HealthKit data
      alert(
        "HealthKit sync would be triggered on your mobile device. This is a placeholder for demo purposes."
      );

      // Reload data after sync
      await loadData();
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncingHealth(false);
    }
  };

  const getDataByType = (type: string) => {
    return healthKitData.filter((d) => d.data_type === type);
  };

  const getAverageValue = (type: string) => {
    const data = getDataByType(type);
    if (data.length === 0) return 0;
    return data.reduce((sum, d) => sum + d.value, 0) / data.length;
  };

  const getCompletionRate = () => {
    if (completions.length === 0) return 0;
    // Simple calculation: number of days with at least one completion
    const uniqueDays = new Set(completions.map((c) => c.completion_date));
    return Math.round((uniqueDays.size / 30) * 100);
  };

  const getRecentCompletions = () => {
    return completions.slice(0, 10);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-blue-600 hover:text-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const avgCalories = getAverageValue("calories");
  const avgSteps = getAverageValue("steps");
  const avgWater = getAverageValue("water");
  const completionRate = getCompletionRate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Kindred</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              My Progress
            </h2>
            <p className="text-gray-600">
              Track your wellness journey (Last 30 days)
            </p>
          </div>
          <button
            onClick={handleSyncHealthKit}
            disabled={syncingHealth}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50"
          >
            {syncingHealth ? "Syncing..." : "💚 Sync HealthKit"}
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">
                Workout Completion
              </h3>
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {completionRate}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Based on past 30 days</p>
            <p className="text-xs text-gray-500 mt-1">
              {completions.length} exercises completed
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">
                Avg Daily Steps
              </h3>
              <span className="text-2xl">👟</span>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {Math.round(avgSteps).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">steps per day</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">
                Avg Calories
              </h3>
              <span className="text-2xl">🔥</span>
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {Math.round(avgCalories)}
            </div>
            <p className="text-xs text-gray-500 mt-1">kcal consumed</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">
                Water Intake
              </h3>
              <span className="text-2xl">💧</span>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {Math.round(avgWater)}
            </div>
            <p className="text-xs text-gray-500 mt-1">ml consumed</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Exercise Completions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Exercise Completions
            </h3>
            {getRecentCompletions().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p>No exercise completions yet</p>
                <Link
                  href="/plans"
                  className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                >
                  View your plans →
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {getRecentCompletions().map((completion) => (
                  <div
                    key={completion.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <span className="text-green-500 mr-3 text-xl">✓</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {completion.exercises?.name || "Exercise"}
                        </p>
                        <div className="text-sm text-gray-500">
                          {new Date(
                            completion.completion_date
                          ).toLocaleDateString()}{" "}
                          at {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HealthKit Data Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              HealthKit Data Summary
            </h3>
            {healthKitData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💚</div>
                <p className="mb-2">No HealthKit data synced yet</p>
                <button
                  onClick={handleSyncHealthKit}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Sync from mobile app →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600">Total Records</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {healthKitData.length}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600">Data Types</div>
                    <div className="text-2xl font-bold text-green-600">
                      {new Set(healthKitData.map((d) => d.data_type)).size}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Data Types Tracked
                  </h4>
                  <div className="space-y-2">
                    {Array.from(
                      new Set(healthKitData.map((d) => d.data_type))
                    ).map((type) => (
                      <div
                        key={type}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-700 capitalize">
                          {type.split(".")[1]?.replace(/_/g, " ") || type}
                        </span>
                        <span className="text-gray-500">
                          {getDataByType(type).length} records
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">💡</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                About HealthKit Integration
              </h3>
              <p className="text-sm text-blue-700">
                HealthKit data is synced from your mobile device. The mobile app
                automatically tracks your nutrition intake, exercise activity,
                steps, and other health metrics. Your matched professionals can
                view this data to better support your wellness journey.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

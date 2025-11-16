"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MacroGoal {
  id: string;
  goal_type: string;
  target_amount: number;
  unit: string;
  notes: string | null;
}

interface NutritionPlan {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  macro_goals: MacroGoal[];
}

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  sets: number | null;
  reps: number | null;
  duration_minutes: number | null;
  scheduled_days: number[];
  notes: string | null;
}

interface ExercisePlan {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  exercises: Exercise[];
}

interface ExerciseCompletion {
  id: string;
  exercise_id: string;
  completion_date: string;
  completed: boolean;
  notes: string | null;
}

export default function PlansPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [exercisePlans, setExercisePlans] = useState<ExercisePlan[]>([]);
  const [completions, setCompletions] = useState<ExerciseCompletion[]>([]);
  const [activeTab, setActiveTab] = useState<"nutrition" | "exercise">(
    "nutrition"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPlans = async () => {
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

      // Fetch nutrition plans
      const nutritionRes = await fetch("/api/me/nutrition-plans", {
        credentials: "include",
      });
      if (nutritionRes.ok) {
        const data = await nutritionRes.json();
        setNutritionPlans(data.plans || []);
      }

      // Fetch exercise plans
      const exerciseRes = await fetch("/api/me/exercise-plans", {
        credentials: "include",
      });
      if (exerciseRes.ok) {
        const data = await exerciseRes.json();
        setExercisePlans(data.plans || []);
      }

      // Fetch exercise completions (last 30 days)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const completionsRes = await fetch(
        `/api/me/exercise-completions?start_date=${startDate.toISOString()}`,
        { credentials: "include" }
      );
      if (completionsRes.ok) {
        const data = await completionsRes.json();
        setCompletions(data.completions || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const toggleExerciseCompletion = async (exerciseId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const existingCompletion = completions.find(
      (c) => c.exercise_id === exerciseId && c.completion_date === today
    );

    try {
      if (existingCompletion) {
        // Remove completion
        const res = await fetch(
          `/api/me/exercise-completions?id=${existingCompletion.id}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );
        if (res.ok) {
          setCompletions(
            completions.filter((c) => c.id !== existingCompletion.id)
          );
        }
      } else {
        // Add completion
        const res = await fetch("/api/me/exercise-completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ exercise_id: exerciseId }),
        });
        if (res.ok) {
          const data = await res.json();
          setCompletions([...completions, data.completion]);
        }
      }
    } catch (err) {
      console.error("Failed to toggle completion:", err);
    }
  };

  const isExerciseCompletedToday = (exerciseId: string) => {
    const today = new Date().toISOString().split("T")[0];
    return completions.some(
      (c) => c.exercise_id === exerciseId && c.completion_date === today
    );
  };

  const getDayName = (dayNum: number) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[dayNum];
  };

  const getTodayExercises = () => {
    const todayNum = new Date().getDay();
    return exercisePlans
      .filter((plan) => plan.is_active)
      .flatMap((plan) =>
        plan.exercises
          .filter((ex) => ex.scheduled_days.includes(todayNum))
          .map((ex) => ({ ...ex, planTitle: plan.title }))
      );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your plans...</p>
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

  const todayExercises = getTodayExercises();

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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Plans</h2>
          <p className="text-gray-600">
            View and track your nutrition and exercise plans
          </p>
        </div>

        {/* Today's Exercises Quick View */}
        {todayExercises.length > 0 && (
          <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold mb-4 text-white">
              Today&apos;s Workout
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="bg-white rounded-lg p-4 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {exercise.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {exercise.planTitle}
                      </p>
                      {exercise.sets && exercise.reps && (
                        <p className="text-sm mt-1 text-gray-700">
                          {exercise.sets} sets × {exercise.reps} reps
                        </p>
                      )}
                      {exercise.duration_minutes && (
                        <p className="text-sm mt-1 text-gray-700">
                          {exercise.duration_minutes} minutes
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleExerciseCompletion(exercise.id)}
                      className={`ml-4 w-10 h-10 rounded-full flex items-center justify-center transition shrink-0 ${
                        isExerciseCompletedToday(exercise.id)
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      {isExerciseCompletedToday(exercise.id) ? "✓" : ""}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("nutrition")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "nutrition"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🥗 Nutrition Plans
            </button>
            <button
              onClick={() => setActiveTab("exercise")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "exercise"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              🏋️ Exercise Plans
            </button>
          </div>
        </div>

        {/* Nutrition Plans Tab */}
        {activeTab === "nutrition" && (
          <div className="space-y-6">
            {nutritionPlans.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">🥗</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Nutrition Plans Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Your nutritionist will create a personalized plan for you once
                  you&apos;re matched
                </p>
                <Link
                  href="/match"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  Find a Nutritionist
                </Link>
              </div>
            ) : (
              nutritionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-lg shadow-md p-6 ${
                    plan.is_active ? "border-2 border-green-500" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {plan.title}
                      </h3>
                      {plan.description && (
                        <p className="text-gray-600 mt-1">{plan.description}</p>
                      )}
                    </div>
                    {plan.is_active && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Start Date:</span>
                      <p className="font-medium">
                        {new Date(plan.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    {plan.end_date && (
                      <div>
                        <span className="text-gray-500">End Date:</span>
                        <p className="font-medium">
                          {new Date(plan.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Daily Goals
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {plan.macro_goals.map((goal) => (
                        <div
                          key={goal.id}
                          className="bg-blue-50 rounded-lg p-3"
                        >
                          <div className="text-sm text-gray-600 capitalize">
                            {goal.goal_type}
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {goal.target_amount}
                          </div>
                          <div className="text-xs text-gray-500">
                            {goal.unit}
                          </div>
                          {goal.notes && (
                            <div className="text-xs text-gray-600 mt-1">
                              {goal.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Exercise Plans Tab */}
        {activeTab === "exercise" && (
          <div className="space-y-6">
            {exercisePlans.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">🏋️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Exercise Plans Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Your trainer will create a personalized workout plan for you
                  once you&apos;re matched
                </p>
                <Link
                  href="/match"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  Find a Trainer
                </Link>
              </div>
            ) : (
              exercisePlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-lg shadow-md p-6 ${
                    plan.is_active ? "border-2 border-green-500" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {plan.title}
                      </h3>
                      {plan.description && (
                        <p className="text-gray-600 mt-1">{plan.description}</p>
                      )}
                    </div>
                    {plan.is_active && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Start Date:</span>
                      <p className="font-medium">
                        {new Date(plan.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    {plan.end_date && (
                      <div>
                        <span className="text-gray-500">End Date:</span>
                        <p className="font-medium">
                          {new Date(plan.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Exercises
                    </h4>
                    <div className="space-y-3">
                      {plan.exercises.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="bg-gray-50 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900">
                                {exercise.name}
                              </h5>
                              {exercise.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {exercise.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-700">
                                {exercise.sets && exercise.reps && (
                                  <span>
                                    {exercise.sets} sets × {exercise.reps} reps
                                  </span>
                                )}
                                {exercise.duration_minutes && (
                                  <span>{exercise.duration_minutes} min</span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {exercise.scheduled_days.map((day) => (
                                  <span
                                    key={day}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {getDayName(day)}
                                  </span>
                                ))}
                              </div>
                              {exercise.notes && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Note: {exercise.notes}
                                </p>
                              )}
                            </div>
                            {plan.is_active && (
                              <button
                                onClick={() =>
                                  toggleExerciseCompletion(exercise.id)
                                }
                                className={`ml-4 w-10 h-10 rounded-full flex items-center justify-center transition ${
                                  isExerciseCompletedToday(exercise.id)
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                }`}
                                title={
                                  isExerciseCompletedToday(exercise.id)
                                    ? "Mark as incomplete"
                                    : "Mark as complete"
                                }
                              >
                                {isExerciseCompletedToday(exercise.id)
                                  ? "✓"
                                  : ""}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

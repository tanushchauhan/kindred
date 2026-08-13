"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import NutritionPlanForm from "@/app/components/NutritionPlanForm";

interface NutritionPlan {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  macro_goals: Array<{
    id: string;
    goal_type: string;
    target_amount: number;
    unit: string;
    notes: string | null;
  }>;
}

interface ExercisePlan {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  exercises: Array<{
    id: string;
    name: string;
    description: string | null;
    sets: number | null;
    reps: number | null;
    duration_minutes: number | null;
    scheduled_days: number[];
    notes: string | null;
  }>;
}

interface HealthKitDataPoint {
  id: string;
  data_type: string;
  value: number;
  unit: string;
  recorded_at: string;
  metadata: Record<string, unknown> | null;
}

interface ExerciseCompletion {
  id: string;
  exercise_id: string;
  completion_date: string;
  completed: boolean;
  notes: string | null;
  exercises?: {
    id: string;
    name: string;
  };
}

interface UserProfile {
  role: string;
  full_name: string;
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.clientId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [clientInfo, setClientInfo] = useState<{
    full_name: string;
    user_name: string | null;
  } | null>(null);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [exercisePlans, setExercisePlans] = useState<ExercisePlan[]>([]);
  const [healthKitData, setHealthKitData] = useState<HealthKitDataPoint[]>([]);
  const [exerciseCompletions, setExerciseCompletions] = useState<
    ExerciseCompletion[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"plans" | "progress" | "health">(
    "plans"
  );
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [editingNutritionPlan, setEditingNutritionPlan] =
    useState<NutritionPlan | null>(null);

  useEffect(() => {
    if (clientId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Check if user is authenticated and is a professional
      const profileRes = await fetch("/api/me", {
        credentials: "include",
      });

      if (!profileRes.ok) {
        if (profileRes.status === 401) {
          router.push("/auth/signin");
          return;
        }
        throw new Error("Failed to fetch profile");
      }

      const profileData = await profileRes.json();

      if (
        profileData.role !== "trainer" &&
        profileData.role !== "nutritionist"
      ) {
        router.push("/dashboard");
        return;
      }

      setProfile(profileData);

      // Fetch client info first
      await fetchClientInfo();

      // Fetch plans based on role
      if (profileData.role === "nutritionist") {
        await fetchNutritionPlans();
      } else if (profileData.role === "trainer") {
        await fetchExercisePlans();
        await fetchExerciseCompletions();
      }

      // Fetch HealthKit data for both roles
      await fetchHealthKitData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchClientInfo = async () => {
    try {
      // Fetch client info from the clients endpoint
      const response = await fetch("/api/professionals/clients", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const client = data.clients?.find(
          (c: { client_id: string }) => c.client_id === clientId
        );
        if (client) {
          setClientInfo({
            full_name: client.full_name,
            user_name: client.user_name,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching client info:", err);
    }
  };

  const fetchNutritionPlans = async () => {
    try {
      const response = await fetch(
        `/api/professionals/nutrition-plans?client_id=${clientId}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNutritionPlans(data.plans || []);
      }
    } catch (err) {
      console.error("Error fetching nutrition plans:", err);
    }
  };

  const fetchExercisePlans = async () => {
    try {
      const response = await fetch(
        `/api/professionals/exercise-plans?client_id=${clientId}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setExercisePlans(data.plans || []);
      }
    } catch (err) {
      console.error("Error fetching exercise plans:", err);
    }
  };

  const fetchExerciseCompletions = async () => {
    try {
      // Fetch completions for the last 30 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const response = await fetch(
        `/api/professionals/clients/${clientId}/exercise-completions?start_date=${
          startDate.toISOString().split("T")[0]
        }`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setExerciseCompletions(data.completions || []);
      }
    } catch (err) {
      console.error("Error fetching exercise completions:", err);
    }
  };

  const fetchHealthKitData = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      const response = await fetch(
        `/api/me/healthkit?client_id=${clientId}&start_date=${startDate.toISOString()}&limit=100`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const result = await response.json();
        setHealthKitData(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching HealthKit data:", err);
    }
  };

  const getDayName = (dayNum: number) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[dayNum];
  };

  const handleDeleteNutritionPlan = async (planId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this nutrition plan? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingPlanId(planId);
    try {
      const response = await fetch(
        `/api/professionals/nutrition-plans/${planId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        setNutritionPlans(nutritionPlans.filter((plan) => plan.id !== planId));
      } else {
        const data = await response.json();
        alert(`Failed to delete plan: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error deleting nutrition plan:", err);
      alert("Failed to delete plan. Please try again.");
    } finally {
      setDeletingPlanId(null);
    }
  };

  const handleDeleteExercisePlan = async (planId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this exercise plan? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingPlanId(planId);
    try {
      const response = await fetch(
        `/api/professionals/exercise-plans/${planId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        setExercisePlans(exercisePlans.filter((plan) => plan.id !== planId));
      } else {
        const data = await response.json();
        alert(`Failed to delete plan: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error deleting exercise plan:", err);
      alert("Failed to delete plan. Please try again.");
    } finally {
      setDeletingPlanId(null);
    }
  };

  const handleToggleNutritionPlanActive = async (planId: string) => {
    try {
      const response = await fetch(
        `/api/professionals/nutrition-plans/${planId}/toggle-active`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setNutritionPlans(
          nutritionPlans.map(
            (plan) =>
              plan.id === planId
                ? { ...plan, is_active: data.plan.is_active }
                : { ...plan, is_active: false } // Deactivate others
          )
        );
      } else {
        const data = await response.json();
        alert(`Failed to update plan: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error toggling nutrition plan:", err);
      alert("Failed to update plan. Please try again.");
    }
  };

  const handleToggleExercisePlanActive = async (planId: string) => {
    try {
      const response = await fetch(
        `/api/professionals/exercise-plans/${planId}/toggle-active`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setExercisePlans(
          exercisePlans.map(
            (plan) =>
              plan.id === planId
                ? { ...plan, is_active: data.plan.is_active }
                : { ...plan, is_active: false } // Deactivate others
          )
        );
      } else {
        const data = await response.json();
        alert(`Failed to update plan: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error toggling exercise plan:", err);
      alert("Failed to update plan. Please try again.");
    }
  };

  const getCompletionRate = () => {
    if (exerciseCompletions.length === 0) return 0;
    const uniqueDays = new Set(
      exerciseCompletions.map((c) => c.completion_date)
    );
    return Math.round((uniqueDays.size / 30) * 100);
  };

  const getTotalExercisesAssigned = () => {
    return exercisePlans.reduce(
      (total, plan) => total + plan.exercises.length,
      0
    );
  };

  const getRecentCompletions = () => {
    return exerciseCompletions.slice(0, 10);
  };

  const getWeeklyCompletionData = () => {
    const weekData: { [key: string]: number } = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      weekData[dateStr] = 0;
    }

    exerciseCompletions.forEach((completion) => {
      if (weekData.hasOwnProperty(completion.completion_date)) {
        weekData[completion.completion_date]++;
      }
    });

    return Object.entries(weekData).map(([date, count]) => ({
      date,
      count,
      dayName: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
    }));
  };

  // Nutritionist-specific helper functions
  const getActiveMacroGoals = () => {
    const activePlan = nutritionPlans.find((plan) => plan.is_active);
    return activePlan?.macro_goals || [];
  };

  const getAverageNutritionValue = (dataType: string) => {
    const relevantData = healthKitData.filter((d) => d.data_type === dataType);
    if (relevantData.length === 0) return 0;
    const sum = relevantData.reduce((acc, d) => acc + d.value, 0);
    return Math.round(sum / relevantData.length);
  };

  const getMacroAdherence = (goalType: string, targetAmount: number) => {
    const avgValue = getAverageNutritionValue(goalType);
    if (avgValue === 0 || targetAmount === 0) return 0;
    const adherence = (avgValue / targetAmount) * 100;
    return Math.min(Math.round(adherence), 100);
  };

  const getWeeklyNutritionData = (dataType: string) => {
    const weekData: { [key: string]: number } = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      weekData[dateStr] = 0;
    }

    healthKitData
      .filter((d) => d.data_type === dataType)
      .forEach((dataPoint) => {
        const dateStr = new Date(dataPoint.recorded_at)
          .toISOString()
          .split("T")[0];
        if (weekData.hasOwnProperty(dateStr)) {
          weekData[dateStr] = dataPoint.value;
        }
      });

    return Object.entries(weekData).map(([date, value]) => ({
      date,
      value,
      dayName: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
    }));
  };

  const getNutritionDataCount = () => {
    const nutritionTypes = [
      "protein",
      "carbohydrates",
      "fat",
      "calories",
      "fiber",
      "water",
      "sugar",
    ];
    return healthKitData.filter((d) => nutritionTypes.includes(d.data_type))
      .length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-teal)] mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Failed to load data"}</p>
          <button
            onClick={() => router.push("/professionals/clients")}
            className="text-[var(--color-teal)] hover:underline"
          >
            ← Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Link
              href="/professionals/clients"
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[var(--color-teal)] shadow-sm hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
                {clientInfo?.full_name || "Client"}
              </h1>
              {clientInfo?.user_name && (
                <p className="text-[var(--color-subtext)]">
                  @{clientInfo.user_name}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-[var(--color-teal)] hover:underline"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Dashboard
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 bg-white p-1.5 rounded-2xl w-fit shadow-sm border border-gray-100">
          <button
            onClick={() => setActiveTab("plans")}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "plans"
                ? "bg-[var(--color-teal)] text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Plans
          </button>
          <button
            onClick={() => setActiveTab("progress")}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "progress"
                ? "bg-[var(--color-teal)] text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Progress
          </button>
          <button
            onClick={() => setActiveTab("health")}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "health"
                ? "bg-[var(--color-teal)] text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Health Data
          </button>
        </div>

        {/* Plans Tab */}
        {activeTab === "plans" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-[var(--color-foreground)]">
                {profile.role === "nutritionist"
                  ? "Nutrition Plans"
                  : "Exercise Plans"}
              </h2>
              <button
                onClick={() => {
                  if (profile.role === "trainer") {
                    router.push(
                      `/professionals/clients/${clientId}/exercise-plans/create`
                    );
                  } else {
                    setShowCreatePlanModal(true);
                  }
                }}
                className="bg-[var(--color-teal)] text-white px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-sm"
              >
                + Create New Plan
              </button>
            </div>

            {profile.role === "nutritionist" && nutritionPlans.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                <div className="w-20 h-20 bg-[var(--color-background)] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📋</span>
                </div>
                <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                  No Nutrition Plans Yet
                </h3>
                <p className="text-[var(--color-subtext)] mb-6 max-w-md mx-auto">
                  Create a nutrition plan to help your client reach their
                  wellness goals
                </p>
                <button
                  onClick={() => setShowCreatePlanModal(true)}
                  className="bg-[var(--color-teal)] text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  Create First Plan
                </button>
              </div>
            )}

            {profile.role === "nutritionist" &&
              nutritionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[var(--color-foreground)]">
                        {plan.title}
                      </h3>
                      {plan.description && (
                        <p className="text-sm text-[var(--color-subtext)] mt-1">
                          {plan.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleNutritionPlanActive(plan.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                          plan.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {plan.is_active ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => setEditingNutritionPlan(plan)}
                        className="p-2 text-[var(--color-teal)] hover:bg-[var(--color-background)] rounded-lg transition"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteNutritionPlan(plan.id)}
                        disabled={deletingPlanId === plan.id}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div className="bg-[var(--color-background)] p-3 rounded-xl">
                      <span className="text-[var(--color-subtext)] block text-xs mb-1">
                        Start Date
                      </span>
                      <span className="font-medium text-[var(--color-foreground)]">
                        {new Date(plan.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    {plan.end_date && (
                      <div className="bg-[var(--color-background)] p-3 rounded-xl">
                        <span className="text-[var(--color-subtext)] block text-xs mb-1">
                          End Date
                        </span>
                        <span className="font-medium text-[var(--color-foreground)]">
                          {new Date(plan.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-bold text-[var(--color-foreground)] mb-3">
                      Macro Goals
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {plan.macro_goals.map((goal) => (
                        <div
                          key={goal.id}
                          className="bg-[var(--color-background)] rounded-xl p-3"
                        >
                          <div className="text-xs text-[var(--color-subtext)] capitalize mb-1">
                            {goal.goal_type}
                          </div>
                          <div className="text-lg font-bold text-[var(--color-teal)]">
                            {goal.target_amount}
                            <span className="text-sm ml-1 text-[var(--color-subtext)] font-normal">
                              {goal.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

            {profile.role === "trainer" && exercisePlans.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                <div className="w-20 h-20 bg-[var(--color-background)] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🏋️</span>
                </div>
                <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                  No Exercise Plans Yet
                </h3>
                <p className="text-[var(--color-subtext)] mb-6 max-w-md mx-auto">
                  Create an exercise plan to guide your client&apos;s fitness
                  journey
                </p>
                <button
                  onClick={() =>
                    router.push(
                      `/professionals/clients/${clientId}/exercise-plans/create`
                    )
                  }
                  className="bg-[var(--color-teal)] text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  Create First Plan
                </button>
              </div>
            )}

            {profile.role === "trainer" &&
              exercisePlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[var(--color-foreground)]">
                        {plan.title}
                      </h3>
                      {plan.description && (
                        <p className="text-sm text-[var(--color-subtext)] mt-1">
                          {plan.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleExercisePlanActive(plan.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                          plan.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {plan.is_active ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() =>
                          router.push(
                            `/professionals/clients/${clientId}/exercise-plans/${plan.id}/edit`
                          )
                        }
                        className="p-2 text-[var(--color-teal)] hover:bg-[var(--color-background)] rounded-lg transition"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteExercisePlan(plan.id)}
                        disabled={deletingPlanId === plan.id}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div className="bg-[var(--color-background)] p-3 rounded-xl">
                      <span className="text-[var(--color-subtext)] block text-xs mb-1">
                        Start Date
                      </span>
                      <span className="font-medium text-[var(--color-foreground)]">
                        {new Date(plan.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    {plan.end_date && (
                      <div className="bg-[var(--color-background)] p-3 rounded-xl">
                        <span className="text-[var(--color-subtext)] block text-xs mb-1">
                          End Date
                        </span>
                        <span className="font-medium text-[var(--color-foreground)]">
                          {new Date(plan.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-bold text-[var(--color-foreground)] mb-3">
                      Exercises ({plan.exercises.length})
                    </h4>
                    <div className="space-y-3">
                      {plan.exercises.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="bg-[var(--color-background)] rounded-xl p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-semibold text-[var(--color-foreground)]">
                              {exercise.name}
                            </h5>
                            <div className="flex gap-1">
                              {exercise.scheduled_days.map((day) => (
                                <span
                                  key={day}
                                  className="px-2 py-1 bg-white text-[var(--color-teal)] rounded-lg text-xs font-medium shadow-sm"
                                >
                                  {getDayName(day)}
                                </span>
                              ))}
                            </div>
                          </div>
                          {exercise.description && (
                            <p className="text-sm text-[var(--color-subtext)] mb-3">
                              {exercise.description}
                            </p>
                          )}
                          <div className="flex gap-4 text-sm text-[var(--color-subtext)]">
                            {exercise.sets && (
                              <span className="bg-white px-2 py-1 rounded-lg">
                                Sets: {exercise.sets}
                              </span>
                            )}
                            {exercise.reps && (
                              <span className="bg-white px-2 py-1 rounded-lg">
                                Reps: {exercise.reps}
                              </span>
                            )}
                            {exercise.duration_minutes && (
                              <span className="bg-white px-2 py-1 rounded-lg">
                                Duration: {exercise.duration_minutes}min
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === "progress" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-[var(--color-foreground)] mb-6">
              Client Progress
            </h2>

            {profile.role === "trainer" ? (
              <>
                {/* Trainer Progress View - Exercise Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Completion Rate */}
                  <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-[var(--color-subtext)]">
                        Workout Completion
                      </h3>
                      <span className="text-2xl">📊</span>
                    </div>
                    <div className="text-3xl font-bold text-[var(--color-teal)]">
                      {getCompletionRate()}%
                    </div>
                    <p className="text-xs text-[var(--color-subtext)] mt-1">
                      Last 30 days
                    </p>
                  </div>

                  {/* Total Completions */}
                  <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-[var(--color-subtext)]">
                        Total Workouts
                      </h3>
                      <span className="text-2xl">✅</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      {exerciseCompletions.length}
                    </div>
                    <p className="text-xs text-[var(--color-subtext)] mt-1">
                      Completed
                    </p>
                  </div>

                  {/* Exercises Assigned */}
                  <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-[var(--color-subtext)]">
                        Exercises Assigned
                      </h3>
                      <span className="text-2xl">🏋️</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-600">
                      {getTotalExercisesAssigned()}
                    </div>
                    <p className="text-xs text-[var(--color-subtext)] mt-1">
                      Active exercises
                    </p>
                  </div>
                </div>

                {/* Weekly Activity Chart */}
                {exerciseCompletions.length > 0 && (
                  <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-[var(--color-foreground)] mb-4">
                      This Week&apos;s Activity
                    </h3>
                    <div className="grid grid-cols-7 gap-2">
                      {getWeeklyCompletionData().map((day) => (
                        <div key={day.date} className="text-center">
                          <div className="text-xs text-[var(--color-subtext)] mb-2">
                            {day.dayName}
                          </div>
                          <div
                            className={`h-20 rounded-xl flex items-end justify-center pb-2 text-white font-bold transition-all ${
                              day.count === 0
                                ? "bg-gray-100 text-gray-400"
                                : day.count <= 2
                                ? "bg-[var(--color-teal)] opacity-60"
                                : day.count <= 4
                                ? "bg-[var(--color-teal)] opacity-80"
                                : "bg-[var(--color-teal)]"
                            }`}
                          >
                            {day.count > 0 && day.count}
                          </div>
                          <div className="text-xs text-[var(--color-subtext)] mt-1">
                            {new Date(day.date).getDate()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Exercise Completions */}
                {exerciseCompletions.length > 0 ? (
                  <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-[var(--color-foreground)] mb-4">
                      Recent Exercise Completions
                    </h3>
                    <div className="space-y-3">
                      {getRecentCompletions().map((completion) => (
                        <div
                          key={completion.id}
                          className="flex items-start space-x-3 p-4 bg-[var(--color-background)] rounded-xl"
                        >
                          <div className="shrink-0">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                              <span className="text-green-600 text-lg">✓</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[var(--color-foreground)]">
                              {completion.exercises?.name || "Exercise"}
                            </p>
                            <div className="text-sm text-[var(--color-subtext)]">
                              {new Date(
                                completion.completion_date
                              ).toLocaleDateString()}
                            </div>
                            {completion.notes && (
                              <p className="text-xs text-[var(--color-subtext)] mt-1 bg-white p-2 rounded-lg inline-block">
                                Note: {completion.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl shadow-sm p-12 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-[var(--color-background)] rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-4xl">📊</span>
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                      No Progress Data Yet
                    </h3>
                    <p className="text-[var(--color-subtext)]">
                      Exercise completions will appear here once your client
                      starts tracking their workouts
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Nutritionist Progress View - Nutrition Stats */}
                {getActiveMacroGoals().length > 0 ? (
                  <>
                    {/* Macro Goals Adherence */}
                    <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
                      <h3 className="text-lg font-bold text-[var(--color-foreground)] mb-4">
                        Macro Goals Adherence (Last 30 Days)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {getActiveMacroGoals().map((goal) => {
                          const adherence = getMacroAdherence(
                            goal.goal_type,
                            goal.target_amount
                          );
                          const avgValue = getAverageNutritionValue(
                            goal.goal_type
                          );
                          return (
                            <div
                              key={goal.id}
                              className="bg-[var(--color-background)] rounded-xl p-4"
                            >
                              <div className="text-xs text-[var(--color-subtext)] capitalize mb-1">
                                {goal.goal_type}
                              </div>
                              <div className="text-2xl font-bold text-[var(--color-teal)] mb-2">
                                {avgValue}
                                <span className="text-sm ml-1 text-[var(--color-subtext)] font-normal">
                                  {goal.unit}
                                </span>
                              </div>
                              <div className="text-xs text-[var(--color-subtext)] mb-2">
                                Target: {goal.target_amount} {goal.unit}
                              </div>
                              <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-[var(--color-teal)] h-2 rounded-full"
                                  style={{ width: `${adherence}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-[var(--color-subtext)] mt-1 text-right">
                                {adherence}% adherence
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Weekly Nutrition Trends */}
                    <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100 mt-6">
                      <h3 className="text-lg font-bold text-[var(--color-foreground)] mb-4">
                        This Week&apos;s Nutrition Tracking
                      </h3>
                      <div className="space-y-6">
                        {getActiveMacroGoals()
                          .slice(0, 3)
                          .map((goal) => {
                            const weekData = getWeeklyNutritionData(
                              goal.goal_type
                            );
                            const maxValue = Math.max(
                              ...weekData.map((d) => d.value),
                              goal.target_amount
                            );
                            return (
                              <div key={goal.id}>
                                <div className="text-sm font-medium text-[var(--color-foreground)] mb-2 capitalize">
                                  {goal.goal_type} (Target: {goal.target_amount}{" "}
                                  {goal.unit})
                                </div>
                                <div className="grid grid-cols-7 gap-2 h-24 items-end">
                                  {weekData.map((day) => {
                                    const heightPercent =
                                      maxValue > 0
                                        ? (day.value / maxValue) * 100
                                        : 0;
                                    return (
                                      <div
                                        key={day.date}
                                        className="flex flex-col items-center justify-end h-full"
                                      >
                                        <div
                                          className="w-full bg-[var(--color-teal)] rounded-t-lg opacity-80 hover:opacity-100 transition-opacity"
                                          style={{
                                            height: `${Math.max(
                                              heightPercent,
                                              5
                                            )}%`,
                                          }}
                                        ></div>
                                        <div className="text-xs text-[var(--color-subtext)] mt-1">
                                          {day.dayName}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-3xl shadow-sm p-12 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-[var(--color-background)] rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-4xl">📊</span>
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                      No Active Nutrition Plan
                    </h3>
                    <p className="text-[var(--color-subtext)] mb-6">
                      Create a nutrition plan to start tracking your
                      client&apos;s progress
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab("plans");
                        setShowCreatePlanModal(true);
                      }}
                      className="bg-[var(--color-teal)] text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
                    >
                      Create Nutrition Plan
                    </button>
                  </div>
                )}

                {/* Nutrition Data Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-[var(--color-subtext)]">
                        Data Points Logged
                      </h3>
                      <span className="text-2xl">📝</span>
                    </div>
                    <div className="text-3xl font-bold text-[var(--color-teal)]">
                      {getNutritionDataCount()}
                    </div>
                    <p className="text-xs text-[var(--color-subtext)] mt-1">
                      Last 30 days
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-[var(--color-subtext)]">
                        Avg Daily Calories
                      </h3>
                      <span className="text-2xl">🔥</span>
                    </div>
                    <div className="text-3xl font-bold text-[var(--color-orange)]">
                      {getAverageNutritionValue("calories")}
                    </div>
                    <p className="text-xs text-[var(--color-subtext)] mt-1">
                      kcal
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-[var(--color-subtext)]">
                        Avg Daily Protein
                      </h3>
                      <span className="text-2xl">🥩</span>
                    </div>
                    <div className="text-3xl font-bold text-red-500">
                      {getAverageNutritionValue("protein")}
                    </div>
                    <p className="text-xs text-[var(--color-subtext)] mt-1">
                      grams
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Health Data Tab */}
        {activeTab === "health" && (
          <div>
            <h2 className="text-xl font-bold text-[var(--color-foreground)] mb-6">
              HealthKit Data (Last 30 Days)
            </h2>
            {healthKitData.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm p-12 text-center border border-gray-100">
                <div className="w-20 h-20 bg-[var(--color-background)] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">💚</span>
                </div>
                <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                  No Health Data Yet
                </h3>
                <p className="text-[var(--color-subtext)]">
                  Health data will appear here once the client syncs their
                  HealthKit data
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {["nutrition", "fitness"].map((category) => {
                  const categoryData =
                    category === "nutrition"
                      ? healthKitData.filter((d) =>
                          [
                            "protein",
                            "carbohydrates",
                            "fat",
                            "calories",
                            "fiber",
                            "water",
                            "sugar",
                          ].includes(d.data_type)
                        )
                      : healthKitData.filter((d) =>
                          [
                            "steps",
                            "active_energy",
                            "workout",
                            "heart_rate",
                          ].includes(d.data_type)
                        );

                  if (categoryData.length === 0) return null;

                  return (
                    <div
                      key={category}
                      className="bg-white rounded-3xl shadow-sm p-6 border border-gray-100"
                    >
                      <h3 className="text-lg font-bold text-[var(--color-foreground)] mb-4 capitalize">
                        {category === "nutrition"
                          ? "🥗 Nutrition"
                          : "🏃 Fitness"}
                      </h3>
                      <div className="space-y-3">
                        {categoryData.slice(0, 5).map((dataPoint) => (
                          <div
                            key={dataPoint.id}
                            className="flex justify-between items-center text-sm p-3 bg-[var(--color-background)] rounded-xl"
                          >
                            <span className="text-[var(--color-foreground)] capitalize font-medium">
                              {dataPoint.data_type.replace("_", " ")}
                            </span>
                            <div className="text-right">
                              <div className="font-bold text-[var(--color-teal)]">
                                {dataPoint.value} {dataPoint.unit}
                              </div>
                              <div className="text-xs text-[var(--color-subtext)]">
                                {new Date(
                                  dataPoint.recorded_at
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Plan Modal */}
      {(showCreatePlanModal || editingNutritionPlan) &&
        profile && (
          <>
            {profile.role === "nutritionist" &&
              (showCreatePlanModal || editingNutritionPlan) && (
                <NutritionPlanForm
                  clientId={clientId}
                  existingPlan={editingNutritionPlan}
                  onSuccess={() => {
                    setShowCreatePlanModal(false);
                    setEditingNutritionPlan(null);
                    fetchNutritionPlans();
                  }}
                  onCancel={() => {
                    setShowCreatePlanModal(false);
                    setEditingNutritionPlan(null);
                  }}
                />
              )}
          </>
        )}
    </div>
  );
}

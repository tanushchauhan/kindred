"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import NutritionPlanForm from "@/app/components/NutritionPlanForm";
import ExercisePlanForm from "@/app/components/ExercisePlanForm";

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
  const [editingExercisePlan, setEditingExercisePlan] =
    useState<ExercisePlan | null>(null);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client data...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Failed to load data"}</p>
          <button
            onClick={() => router.push("/professionals/clients")}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to Clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/professionals/clients"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Clients
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {clientInfo?.full_name || "Client"}
                </h1>
                {clientInfo?.user_name && (
                  <p className="text-sm text-gray-500">
                    @{clientInfo.user_name}
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("plans")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "plans"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📋 Plans
            </button>
            <button
              onClick={() => setActiveTab("progress")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "progress"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📊 Progress
            </button>
            <button
              onClick={() => setActiveTab("health")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "health"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              💚 Health Data
            </button>
          </div>
        </div>

        {/* Plans Tab */}
        {activeTab === "plans" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {profile.role === "nutritionist"
                  ? "Nutrition Plans"
                  : "Exercise Plans"}
              </h2>
              <button
                onClick={() => setShowCreatePlanModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                + Create New Plan
              </button>
            </div>

            {profile.role === "nutritionist" && nutritionPlans.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Nutrition Plans Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create a nutrition plan to help your client reach their
                  wellness goals
                </p>
                <button
                  onClick={() => setShowCreatePlanModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  Create First Plan
                </button>
              </div>
            )}

            {profile.role === "nutritionist" &&
              nutritionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {plan.title}
                      </h3>
                      {plan.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {plan.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleNutritionPlanActive(plan.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer hover:opacity-80 ${
                          plan.is_active
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                        title={
                          plan.is_active
                            ? "Click to deactivate"
                            : "Click to activate"
                        }
                      >
                        {plan.is_active ? "✓ Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => setEditingNutritionPlan(plan)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition"
                        title="Edit plan"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteNutritionPlan(plan.id)}
                        disabled={deletingPlanId === plan.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-50"
                        title="Delete plan"
                      >
                        {deletingPlanId === plan.id ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Start Date:</span>
                      <span className="ml-2 font-medium">
                        {new Date(plan.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    {plan.end_date && (
                      <div>
                        <span className="text-gray-500">End Date:</span>
                        <span className="ml-2 font-medium">
                          {new Date(plan.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Macro Goals
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {plan.macro_goals.map((goal) => (
                        <div
                          key={goal.id}
                          className="bg-blue-50 rounded-lg p-3"
                        >
                          <div className="text-xs text-gray-600 capitalize">
                            {goal.goal_type}
                          </div>
                          <div className="text-lg font-bold text-blue-600">
                            {goal.target_amount}
                            <span className="text-sm ml-1">{goal.unit}</span>
                          </div>
                          {goal.notes && (
                            <div className="text-xs text-gray-500 mt-1">
                              {goal.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

            {profile.role === "trainer" && exercisePlans.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">🏋️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Exercise Plans Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create an exercise plan to guide your client&apos;s fitness
                  journey
                </p>
                <button
                  onClick={() => setShowCreatePlanModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  Create First Plan
                </button>
              </div>
            )}

            {profile.role === "trainer" &&
              exercisePlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {plan.title}
                      </h3>
                      {plan.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {plan.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleExercisePlanActive(plan.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer hover:opacity-80 ${
                          plan.is_active
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                        title={
                          plan.is_active
                            ? "Click to deactivate"
                            : "Click to activate"
                        }
                      >
                        {plan.is_active ? "✓ Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => setEditingExercisePlan(plan)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition"
                        title="Edit plan"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteExercisePlan(plan.id)}
                        disabled={deletingPlanId === plan.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition disabled:opacity-50"
                        title="Delete plan"
                      >
                        {deletingPlanId === plan.id ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Start Date:</span>
                      <span className="ml-2 font-medium">
                        {new Date(plan.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    {plan.end_date && (
                      <div>
                        <span className="text-gray-500">End Date:</span>
                        <span className="ml-2 font-medium">
                          {new Date(plan.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Exercises ({plan.exercises.length})
                    </h4>
                    <div className="space-y-3">
                      {plan.exercises.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="bg-gray-50 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-semibold text-gray-900">
                              {exercise.name}
                            </h5>
                            <div className="flex gap-1">
                              {exercise.scheduled_days.map((day) => (
                                <span
                                  key={day}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                                >
                                  {getDayName(day)}
                                </span>
                              ))}
                            </div>
                          </div>
                          {exercise.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {exercise.description}
                            </p>
                          )}
                          <div className="flex gap-4 text-sm text-gray-600">
                            {exercise.sets && (
                              <span>Sets: {exercise.sets}</span>
                            )}
                            {exercise.reps && (
                              <span>Reps: {exercise.reps}</span>
                            )}
                            {exercise.duration_minutes && (
                              <span>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Client Progress
            </h2>

            {profile.role === "trainer" ? (
              <>
                {/* Trainer Progress View - Exercise Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Completion Rate */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">
                        Workout Completion
                      </h3>
                      <span className="text-2xl">📊</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {getCompletionRate()}%
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                  </div>

                  {/* Total Completions */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">
                        Total Workouts
                      </h3>
                      <span className="text-2xl">✅</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      {exerciseCompletions.length}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Completed</p>
                  </div>

                  {/* Exercises Assigned */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">
                        Exercises Assigned
                      </h3>
                      <span className="text-2xl">🏋️</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-600">
                      {getTotalExercisesAssigned()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Active exercises
                    </p>
                  </div>
                </div>

                {/* Weekly Activity Chart */}
                {exerciseCompletions.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      This Week&apos;s Activity
                    </h3>
                    <div className="grid grid-cols-7 gap-2">
                      {getWeeklyCompletionData().map((day) => (
                        <div key={day.date} className="text-center">
                          <div className="text-xs text-gray-600 mb-2">
                            {day.dayName}
                          </div>
                          <div
                            className={`h-20 rounded-lg flex items-end justify-center pb-2 text-white font-bold ${
                              day.count === 0
                                ? "bg-gray-200 text-gray-400"
                                : day.count <= 2
                                ? "bg-blue-300"
                                : day.count <= 4
                                ? "bg-blue-500"
                                : "bg-blue-700"
                            }`}
                          >
                            {day.count > 0 && day.count}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(day.date).getDate()}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-4 text-center">
                      Number of exercises completed per day
                    </p>
                  </div>
                )}

                {/* Recent Exercise Completions */}
                {exerciseCompletions.length > 0 ? (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Recent Exercise Completions
                    </h3>
                    <div className="space-y-3">
                      {getRecentCompletions().map((completion) => (
                        <div
                          key={completion.id}
                          className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="shrink-0">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 text-lg">✓</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {completion.exercises?.name || "Exercise"}
                            </p>
                            <div className="text-sm text-gray-500">
                              {new Date(
                                completion.completion_date
                              ).toLocaleDateString()}
                            </div>
                            {completion.notes && (
                              <p className="text-xs text-gray-600 mt-1">
                                Note: {completion.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Progress Data Yet
                    </h3>
                    <p className="text-gray-600">
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
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                              className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-4"
                            >
                              <div className="text-xs text-gray-600 capitalize mb-1">
                                {goal.goal_type}
                              </div>
                              <div className="text-2xl font-bold text-blue-600 mb-2">
                                {avgValue}
                                <span className="text-sm ml-1">
                                  {goal.unit}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mb-2">
                                Target: {goal.target_amount} {goal.unit}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    adherence >= 90
                                      ? "bg-green-500"
                                      : adherence >= 70
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${adherence}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-600 mt-1 text-right">
                                {adherence}% adherence
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Weekly Nutrition Trends */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                                <div className="text-sm font-medium text-gray-700 mb-2 capitalize">
                                  {goal.goal_type} (Target: {goal.target_amount}{" "}
                                  {goal.unit})
                                </div>
                                <div className="grid grid-cols-7 gap-2">
                                  {weekData.map((day) => (
                                    <div key={day.date} className="text-center">
                                      <div className="text-xs text-gray-600 mb-2">
                                        {day.dayName}
                                      </div>
                                      <div
                                        className={`h-20 rounded-lg flex items-end justify-center pb-1 text-xs font-bold ${
                                          day.value === 0
                                            ? "bg-gray-200 text-gray-400"
                                            : day.value >= goal.target_amount
                                            ? "bg-green-500 text-white"
                                            : day.value >=
                                              goal.target_amount * 0.7
                                            ? "bg-yellow-400 text-gray-800"
                                            : "bg-red-400 text-white"
                                        }`}
                                        style={{
                                          height: `${
                                            80 * (day.value / maxValue) + 40
                                          }px`,
                                        }}
                                      >
                                        {day.value > 0 && day.value}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {new Date(day.date).getDate()}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Active Nutrition Plan
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Create a nutrition plan to start tracking your
                      client&apos;s progress
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab("plans");
                        setShowCreatePlanModal(true);
                      }}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                    >
                      Create Nutrition Plan
                    </button>
                  </div>
                )}

                {/* Nutrition Data Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">
                        Data Points Logged
                      </h3>
                      <span className="text-2xl">📝</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {getNutritionDataCount()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">
                        Avg Daily Calories
                      </h3>
                      <span className="text-2xl">🔥</span>
                    </div>
                    <div className="text-3xl font-bold text-orange-600">
                      {getAverageNutritionValue("calories")}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">kcal</p>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">
                        Avg Daily Protein
                      </h3>
                      <span className="text-2xl">🥩</span>
                    </div>
                    <div className="text-3xl font-bold text-red-600">
                      {getAverageNutritionValue("protein")}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">grams</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Health Data Tab */}
        {activeTab === "health" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              HealthKit Data (Last 30 Days)
            </h2>
            {healthKitData.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">💚</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Health Data Yet
                </h3>
                <p className="text-gray-600">
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
                      className="bg-white rounded-lg shadow p-6"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                        {category === "nutrition"
                          ? "🥗 Nutrition"
                          : "🏃 Fitness"}
                      </h3>
                      <div className="space-y-3">
                        {categoryData.slice(0, 5).map((dataPoint) => (
                          <div
                            key={dataPoint.id}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="text-gray-600 capitalize">
                              {dataPoint.data_type.replace("_", " ")}
                            </span>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">
                                {dataPoint.value} {dataPoint.unit}
                              </div>
                              <div className="text-xs text-gray-500">
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
      </main>

      {/* Create/Edit Plan Modal */}
      {(showCreatePlanModal || editingNutritionPlan || editingExercisePlan) &&
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
            {profile.role === "trainer" &&
              (showCreatePlanModal || editingExercisePlan) && (
                <ExercisePlanForm
                  clientId={clientId}
                  existingPlan={editingExercisePlan}
                  onSuccess={() => {
                    setShowCreatePlanModal(false);
                    setEditingExercisePlan(null);
                    fetchExercisePlans();
                  }}
                  onCancel={() => {
                    setShowCreatePlanModal(false);
                    setEditingExercisePlan(null);
                  }}
                />
              )}
          </>
        )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AddHealthDataForm from "@/app/components/AddHealthDataForm";

interface HealthKitDataPoint {
  id: string;
  data_type: string;
  value: number;
  unit: string;
  recorded_at: string;
  metadata: Record<string, unknown> | null;
}

export default function HealthDataPage() {
  const router = useRouter();
  const [healthData, setHealthData] = useState<HealthKitDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "nutrition" | "fitness">("all");

  useEffect(() => {
    fetchHealthData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHealthData = async () => {
    try {
      const response = await fetch("/api/me/healthkit?limit=100", {
        credentials: "include",
      });

      if (response.status === 401) {
        router.push("/auth/signin");
        return;
      }

      if (response.ok) {
        const result = await response.json();
        setHealthData(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching health data:", err);
    } finally {
      setLoading(false);
    }
  };

  const nutritionTypes = [
    "protein",
    "carbohydrates",
    "fat",
    "calories",
    "fiber",
    "water",
    "sugar",
  ];
  const fitnessTypes = ["steps", "active_energy", "workout", "heart_rate"];

  const filteredData = healthData.filter((item) => {
    if (filter === "nutrition") return nutritionTypes.includes(item.data_type);
    if (filter === "fitness") return fitnessTypes.includes(item.data_type);
    return true;
  });

  const groupedData = filteredData.reduce((acc, item) => {
    const date = new Date(item.recorded_at).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, HealthKitDataPoint[]>);

  const sortedDates = Object.keys(groupedData).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                💚 My Health Data
              </h1>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              + Add Data
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Add Health Data
              </h2>
              <AddHealthDataForm
                onSuccess={() => {
                  setShowAddForm(false);
                  fetchHealthData();
                }}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md font-medium transition ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            All Data
          </button>
          <button
            onClick={() => setFilter("nutrition")}
            className={`px-4 py-2 rounded-md font-medium transition ${
              filter === "nutrition"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            🥗 Nutrition
          </button>
          <button
            onClick={() => setFilter("fitness")}
            className={`px-4 py-2 rounded-md font-medium transition ${
              filter === "fitness"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            🏃 Fitness
          </button>
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">💚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Health Data Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start tracking your health and fitness journey by adding your
              first data entry
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Add First Entry
            </button>
          </div>
        )}

        {/* Data List */}
        {sortedDates.map((date) => (
          <div key={date} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{date}</h3>
            <div className="bg-white rounded-lg shadow divide-y">
              {groupedData[date].map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            nutritionTypes.includes(item.data_type)
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.data_type.replace(/_/g, " ").toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(item.recorded_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {item.value}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {item.unit}
                        </span>
                      </div>
                      {item.metadata &&
                        (item.metadata as { notes?: string }).notes && (
                          <p className="text-sm text-gray-600 mt-2">
                            {(item.metadata as { notes: string }).notes}
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

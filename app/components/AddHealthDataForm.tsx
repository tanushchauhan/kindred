"use client";

import { useState } from "react";
import { HealthKitDataType } from "@/lib/types";

interface AddHealthDataFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddHealthDataForm({
  onSuccess,
  onCancel,
}: AddHealthDataFormProps) {
  const [dataType, setDataType] = useState<HealthKitDataType>("calories");
  const [value, setValue] = useState("");
  const [recordedAt, setRecordedAt] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [recordedTime, setRecordedTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const dataTypeConfig: Record<
    HealthKitDataType,
    { label: string; unit: string; placeholder: string; category: string }
  > = {
    // Nutrition
    protein: {
      label: "Protein",
      unit: "g",
      placeholder: "e.g., 150",
      category: "Nutrition",
    },
    carbohydrates: {
      label: "Carbohydrates",
      unit: "g",
      placeholder: "e.g., 250",
      category: "Nutrition",
    },
    fat: {
      label: "Fat",
      unit: "g",
      placeholder: "e.g., 70",
      category: "Nutrition",
    },
    calories: {
      label: "Calories",
      unit: "kcal",
      placeholder: "e.g., 2000",
      category: "Nutrition",
    },
    fiber: {
      label: "Fiber",
      unit: "g",
      placeholder: "e.g., 25",
      category: "Nutrition",
    },
    water: {
      label: "Water",
      unit: "ml",
      placeholder: "e.g., 2000",
      category: "Nutrition",
    },
    sugar: {
      label: "Sugar",
      unit: "g",
      placeholder: "e.g., 50",
      category: "Nutrition",
    },
    // Fitness
    steps: {
      label: "Steps",
      unit: "steps",
      placeholder: "e.g., 10000",
      category: "Fitness",
    },
    active_energy: {
      label: "Active Energy",
      unit: "kcal",
      placeholder: "e.g., 500",
      category: "Fitness",
    },
    workout: {
      label: "Workout Duration",
      unit: "minutes",
      placeholder: "e.g., 45",
      category: "Fitness",
    },
    heart_rate: {
      label: "Heart Rate",
      unit: "bpm",
      placeholder: "e.g., 72",
      category: "Fitness",
    },
  };

  const nutritionTypes: HealthKitDataType[] = [
    "calories",
    "protein",
    "carbohydrates",
    "fat",
    "fiber",
    "water",
    "sugar",
  ];

  const fitnessTypes: HealthKitDataType[] = [
    "steps",
    "active_energy",
    "workout",
    "heart_rate",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!value || parseFloat(value) <= 0) {
      setError("Please enter a valid value");
      return;
    }

    setSubmitting(true);

    try {
      const recordedDateTime = `${recordedAt}T${recordedTime}:00.000Z`;

      const response = await fetch("/api/me/healthkit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          data: [
            {
              data_type: dataType,
              value: parseFloat(value),
              unit: dataTypeConfig[dataType].unit,
              recorded_at: recordedDateTime,
              metadata: notes ? { notes } : null,
            },
          ],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add health data");
      }

      // Reset form
      setValue("");
      setNotes("");
      setRecordedAt(new Date().toISOString().split("T")[0]);
      setRecordedTime(new Date().toTimeString().slice(0, 5));

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Data Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Data Type
        </label>
        <div className="space-y-3">
          {/* Nutrition Section */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Nutrition
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {nutritionTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDataType(type)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    dataType === type
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {dataTypeConfig[type].label}
                </button>
              ))}
            </div>
          </div>

          {/* Fitness Section */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Fitness
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {fitnessTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDataType(type)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    dataType === type
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {dataTypeConfig[type].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Value Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {dataTypeConfig[dataType].label} ({dataTypeConfig[dataType].unit})
        </label>
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={dataTypeConfig[dataType].placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time
          </label>
          <input
            type="time"
            value={recordedTime}
            onChange={(e) => setRecordedTime(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
            disabled={submitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add Data"}
        </button>
      </div>
    </form>
  );
}

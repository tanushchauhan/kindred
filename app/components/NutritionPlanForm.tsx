"use client";

import { useState, useEffect } from "react";
import type { MacroGoalType, MacroUnit } from "@/lib/types";

interface NutritionPlanFormProps {
  clientId: string;
  onSuccess: () => void;
  onCancel: () => void;
  existingPlan?: {
    id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
    macro_goals: Array<{
      id: string;
      goal_type: string;
      target_amount: number;
      unit: string;
      notes: string | null;
    }>;
  } | null;
}

interface MacroGoalInput {
  goal_type: MacroGoalType;
  target_amount: string;
  unit: MacroUnit;
  notes: string;
}

const MACRO_TYPES: MacroGoalType[] = [
  "protein",
  "carbohydrates",
  "fat",
  "calories",
  "fiber",
  "water",
  "sugar",
];

const UNIT_OPTIONS: Record<MacroGoalType, MacroUnit[]> = {
  protein: ["grams"],
  carbohydrates: ["grams"],
  fat: ["grams"],
  calories: ["calories"],
  fiber: ["grams"],
  water: ["ml", "oz"],
  sugar: ["grams"],
};

export default function NutritionPlanForm({
  clientId,
  onSuccess,
  onCancel,
  existingPlan = null,
}: NutritionPlanFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");
  const [macroGoals, setMacroGoals] = useState<MacroGoalInput[]>([
    { goal_type: "calories", target_amount: "", unit: "calories", notes: "" },
    { goal_type: "protein", target_amount: "", unit: "grams", notes: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load existing plan data when editing
  useEffect(() => {
    if (existingPlan) {
      setTitle(existingPlan.title);
      setDescription(existingPlan.description || "");
      setStartDate(existingPlan.start_date);
      setEndDate(existingPlan.end_date || "");
      setMacroGoals(
        existingPlan.macro_goals.map((goal) => ({
          goal_type: goal.goal_type as MacroGoalType,
          target_amount: goal.target_amount.toString(),
          unit: goal.unit as MacroUnit,
          notes: goal.notes || "",
        }))
      );
    }
  }, [existingPlan]);

  const addMacroGoal = () => {
    setMacroGoals([
      ...macroGoals,
      {
        goal_type: "carbohydrates",
        target_amount: "",
        unit: "grams",
        notes: "",
      },
    ]);
  };

  const removeMacroGoal = (index: number) => {
    setMacroGoals(macroGoals.filter((_, i) => i !== index));
  };

  const updateMacroGoal = (
    index: number,
    field: keyof MacroGoalInput,
    value: string
  ) => {
    const updated = [...macroGoals];
    if (field === "goal_type") {
      updated[index][field] = value as MacroGoalType;
      // Update unit to first valid option for the new type
      updated[index].unit = UNIT_OPTIONS[value as MacroGoalType][0];
    } else if (field === "unit") {
      updated[index][field] = value as MacroUnit;
    } else {
      updated[index][field] = value;
    }
    setMacroGoals(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!title.trim()) {
      setError("Please enter a plan title");
      return;
    }

    const validGoals = macroGoals.filter(
      (goal) => goal.target_amount && parseFloat(goal.target_amount) > 0
    );

    if (validGoals.length === 0) {
      setError("Please add at least one macro goal with a valid amount");
      return;
    }

    setLoading(true);

    try {
      const url = existingPlan
        ? `/api/professionals/nutrition-plans/${existingPlan.id}`
        : "/api/professionals/nutrition-plans";
      const method = existingPlan ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          client_id: clientId,
          title: title.trim(),
          description: description.trim() || undefined,
          start_date: startDate,
          end_date: endDate || undefined,
          macro_goals: validGoals.map((goal) => ({
            goal_type: goal.goal_type,
            target_amount: parseFloat(goal.target_amount),
            unit: goal.unit,
            notes: goal.notes.trim() || undefined,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create nutrition plan");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {existingPlan ? "Edit" : "Create"} Nutrition Plan
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Set macronutrient goals aligned with HealthKit tracking
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Muscle Building Plan, Weight Loss Plan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional: Add details about this nutrition plan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Macro Goals */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Macro Goals <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addMacroGoal}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Goal
              </button>
            </div>

            <div className="space-y-3">
              {macroGoals.map((goal, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Type
                      </label>
                      <select
                        value={goal.goal_type}
                        onChange={(e) =>
                          updateMacroGoal(index, "goal_type", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {MACRO_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Target
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={goal.target_amount}
                        onChange={(e) =>
                          updateMacroGoal(
                            index,
                            "target_amount",
                            e.target.value
                          )
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Unit
                      </label>
                      <select
                        value={goal.unit}
                        onChange={(e) =>
                          updateMacroGoal(index, "unit", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {UNIT_OPTIONS[goal.goal_type].map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        &nbsp;
                      </label>
                      <button
                        type="button"
                        onClick={() => removeMacroGoal(index)}
                        disabled={macroGoals.length === 1}
                        className="w-full px-2 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="col-span-12">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={goal.notes}
                        onChange={(e) =>
                          updateMacroGoal(index, "notes", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Focus on lean proteins"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

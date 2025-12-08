"use client";

import { useState, useEffect } from "react";

interface ExercisePlanFormProps {
  clientId: string;
  onSuccess: () => void;
  onCancel: () => void;
  existingPlan?: {
    id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
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
  } | null;
}

interface ExerciseInput {
  name: string;
  description: string;
  sets: string;
  reps: string;
  duration_minutes: string;
  scheduled_days: number[];
  notes: string;
}

const DAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export default function ExercisePlanForm({
  clientId,
  onSuccess,
  onCancel,
  existingPlan = null,
}: ExercisePlanFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");
  const [exercises, setExercises] = useState<ExerciseInput[]>([
    {
      name: "",
      description: "",
      sets: "",
      reps: "",
      duration_minutes: "",
      scheduled_days: [],
      notes: "",
    },
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
      setExercises(
        existingPlan.exercises.map((ex) => ({
          name: ex.name,
          description: ex.description || "",
          sets: ex.sets?.toString() || "",
          reps: ex.reps?.toString() || "",
          duration_minutes: ex.duration_minutes?.toString() || "",
          scheduled_days: ex.scheduled_days,
          notes: ex.notes || "",
        }))
      );
    }
  }, [existingPlan]);

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        name: "",
        description: "",
        sets: "",
        reps: "",
        duration_minutes: "",
        scheduled_days: [],
        notes: "",
      },
    ]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (
    index: number,
    field: keyof ExerciseInput,
    value: string | number[]
  ) => {
    const updated = [...exercises];
    if (field === "scheduled_days") {
      updated[index][field] = value as number[];
    } else {
      updated[index][field] = value as string;
    }
    setExercises(updated);
  };

  const toggleDay = (exerciseIndex: number, day: number) => {
    const updated = [...exercises];
    const days = updated[exerciseIndex].scheduled_days;
    if (days.includes(day)) {
      updated[exerciseIndex].scheduled_days = days.filter((d) => d !== day);
    } else {
      updated[exerciseIndex].scheduled_days = [...days, day].sort(
        (a, b) => a - b
      );
    }
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!title.trim()) {
      setError("Please enter a plan title");
      return;
    }

    const validExercises = exercises.filter(
      (ex) => ex.name.trim() && ex.scheduled_days.length > 0
    );

    if (validExercises.length === 0) {
      setError(
        "Please add at least one exercise with a name and scheduled days"
      );
      return;
    }

    setLoading(true);

    try {
      const url = existingPlan
        ? `/api/professionals/exercise-plans/${existingPlan.id}`
        : "/api/professionals/exercise-plans";
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
          exercises: validExercises.map((ex) => ({
            name: ex.name.trim(),
            description: ex.description.trim() || undefined,
            sets: ex.sets ? parseInt(ex.sets) : undefined,
            reps: ex.reps ? parseInt(ex.reps) : undefined,
            duration_minutes: ex.duration_minutes
              ? parseInt(ex.duration_minutes)
              : undefined,
            scheduled_days: ex.scheduled_days,
            notes: ex.notes.trim() || undefined,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create exercise plan");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {existingPlan ? "Edit" : "Create"} Exercise Plan
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Design a custom workout plan with scheduled exercises
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
              placeholder="e.g., 12-Week Strength Program, Beginner Cardio Plan"
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
              placeholder="Optional: Add details about this exercise plan"
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

          {/* Exercises */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Exercises <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addExercise}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Exercise
              </button>
            </div>

            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-900">
                      Exercise #{index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeExercise(index)}
                      disabled={exercises.length === 1}
                      className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Exercise Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) =>
                            updateExercise(index, "name", e.target.value)
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Squats, Running"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={exercise.description}
                          onChange={(e) =>
                            updateExercise(index, "description", e.target.value)
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Barbell back squats"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Sets
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={exercise.sets}
                          onChange={(e) =>
                            updateExercise(index, "sets", e.target.value)
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Reps
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={exercise.reps}
                          onChange={(e) =>
                            updateExercise(index, "reps", e.target.value)
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Duration (min)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={exercise.duration_minutes}
                          onChange={(e) =>
                            updateExercise(
                              index,
                              "duration_minutes",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Scheduled Days <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        {DAY_OPTIONS.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleDay(index, day.value)}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded transition ${
                              exercise.scheduled_days.includes(day.value)
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={exercise.notes}
                        onChange={(e) =>
                          updateExercise(index, "notes", e.target.value)
                        }
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Focus on form, increase weight weekly"
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

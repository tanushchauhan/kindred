"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface ExerciseInput {
  name: string;
  description: string;
  sets: string;
  reps: string;
  duration_minutes: string;
  scheduled_days: number[];
  notes: string;
}

interface ExerciseRecord {
  name: string;
  description: string | null;
  sets: number | null;
  reps: number | null;
  duration_minutes: number | null;
  scheduled_days: number[];
  notes: string | null;
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

export default function EditExercisePlanPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params?.clientId as string;
  const planId = params?.planId as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exercises, setExercises] = useState<ExerciseInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (planId) {
      fetchPlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const fetchPlan = async () => {
    try {
      const response = await fetch(
        `/api/professionals/exercise-plans/${planId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch plan");
      }

      const data = await response.json();
      const plan = data.plan;

      setTitle(plan.title);
      setDescription(plan.description || "");
      setStartDate(plan.start_date.split("T")[0]);
      setEndDate(plan.end_date ? plan.end_date.split("T")[0] : "");
      setExercises(
        plan.exercises.map((ex: ExerciseRecord) => ({
          name: ex.name,
          description: ex.description || "",
          sets: ex.sets?.toString() || "",
          reps: ex.reps?.toString() || "",
          duration_minutes: ex.duration_minutes?.toString() || "",
          scheduled_days: ex.scheduled_days,
          notes: ex.notes || "",
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plan");
    } finally {
      setLoading(false);
    }
  };

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

    setSaving(true);

    try {
      const response = await fetch(
        `/api/professionals/exercise-plans/${planId}`,
        {
          method: "PUT",
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update exercise plan");
      }

      router.push(`/professionals/clients/${clientId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-teal)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/professionals/clients/${clientId}`}
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
              Edit Exercise Plan
            </h1>
            <p className="text-[var(--color-subtext)]">
              Update your client&apos;s workout plan
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Basic Info Card */}
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-[var(--color-foreground)] mb-6">
              Plan Details
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                  Plan Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--color-background)] border-none rounded-xl focus:ring-2 focus:ring-[var(--color-teal)] transition-all"
                  placeholder="e.g., 12-Week Strength Program"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-[var(--color-background)] border-none rounded-xl focus:ring-2 focus:ring-[var(--color-teal)] transition-all"
                  placeholder="Optional: Add details about this exercise plan"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--color-background)] border-none rounded-xl focus:ring-2 focus:ring-[var(--color-teal)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-4 py-3 bg-[var(--color-background)] border-none rounded-xl focus:ring-2 focus:ring-[var(--color-teal)] transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Exercises Card */}
          <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[var(--color-foreground)]">
                Exercises
              </h2>
              <button
                type="button"
                onClick={addExercise}
                className="text-[var(--color-teal)] font-medium hover:underline flex items-center gap-1"
              >
                <span className="text-xl">+</span> Add Exercise
              </button>
            </div>

            <div className="space-y-6">
              {exercises.map((exercise, index) => (
                <div
                  key={index}
                  className="bg-[var(--color-background)] rounded-2xl p-6 relative group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-[var(--color-foreground)]">
                      Exercise #{index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeExercise(index)}
                      disabled={exercises.length === 1}
                      className="text-red-400 hover:text-red-600 disabled:opacity-30 transition-colors"
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

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-subtext)] mb-1">
                          Exercise Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) =>
                            updateExercise(index, "name", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-white border-none rounded-xl focus:ring-2 focus:ring-[var(--color-teal)] transition-all text-sm"
                          placeholder="e.g., Squats"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--color-subtext)] mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={exercise.description}
                          onChange={(e) =>
                            updateExercise(index, "description", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-white border-none rounded-xl focus:ring-2 focus:ring-[var(--color-teal)] transition-all text-sm"
                          placeholder="e.g., Barbell back squats"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-subtext)] mb-1">
                          Sets
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={exercise.sets}
                          onChange={(e) =>
                            updateExercise(index, "sets", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-white border-none rounded-xl focus:ring-2 focus:ring-[var(--color-teal)] transition-all text-sm"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--color-subtext)] mb-1">
                          Reps
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={exercise.reps}
                          onChange={(e) =>
                            updateExercise(index, "reps", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-white border-none rounded-xl focus:ring-2 focus:ring-[var(--color-teal)] transition-all text-sm"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--color-subtext)] mb-1">
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
                          className="w-full px-3 py-2 bg-white border-none rounded-xl focus:ring-2 focus:ring-[var(--color-teal)] transition-all text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--color-subtext)] mb-2">
                        Scheduled Days <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DAY_OPTIONS.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleDay(index, day.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                              exercise.scheduled_days.includes(day.value)
                                ? "bg-[var(--color-teal)] text-white shadow-sm"
                                : "bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--color-subtext)] mb-1">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={exercise.notes}
                        onChange={(e) =>
                          updateExercise(index, "notes", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white border-none rounded-xl focus:ring-2 focus:ring-[var(--color-teal)] transition-all text-sm"
                        placeholder="e.g., Focus on form"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={saving}
              className="flex-1 px-6 py-4 bg-white text-[var(--color-foreground)] font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-4 bg-[var(--color-teal)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

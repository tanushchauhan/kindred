"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TRAINER_SPECIALTIES,
  NUTRITIONIST_SPECIALTIES,
} from "@/lib/specialties";

interface ProfessionalProfile {
  user_id: string;
  bio: string | null;
  specialties: string[];
  is_verified: boolean;
}

interface OnboardingStatus {
  role: "trainer" | "nutritionist";
  profile: ProfessionalProfile;
  isVerified: boolean;
  hasCompletedOnboarding: boolean;
}

export default function ProfessionalOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<OnboardingStatus | null>(null);

  // Form state
  const [bio, setBio] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [otherSpecialty, setOtherSpecialty] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);

  useEffect(() => {
    fetchOnboardingStatus();
  }, []);

  const fetchOnboardingStatus = async () => {
    try {
      const response = await fetch("/api/professionals/onboarding", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/signin");
          return;
        }
        if (response.status === 403) {
          router.push("/dashboard");
          return;
        }
        throw new Error("Failed to fetch onboarding status");
      }

      const data: OnboardingStatus = await response.json();
      setStatus(data);

      if (data.profile.bio) {
        setBio(data.profile.bio);
      }
      if (data.profile.specialties && data.profile.specialties.length > 0) {
        setSelectedSpecialties(data.profile.specialties);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  const handleAddOtherSpecialty = () => {
    const trimmed = otherSpecialty.trim();
    if (trimmed && !selectedSpecialties.includes(trimmed)) {
      setSelectedSpecialties((prev) => [...prev, trimmed]);
      setOtherSpecialty("");
      setShowOtherInput(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (bio.trim().length === 0) {
      setError("Please enter a bio");
      return;
    }

    if (selectedSpecialties.length === 0) {
      setError("Please select at least one specialty");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/professionals/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bio: bio.trim(),
          specialties: selectedSpecialties,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete onboarding");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSubmitting(false);
    }
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

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load onboarding status</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-[var(--color-teal)] hover:underline"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!status.isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-4">
            Verification Pending
          </h2>
          <p className="text-[var(--color-subtext)] mb-6">
            Your account is currently under review. You&apos;ll be able to
            complete your professional onboarding once your account has been
            verified by our team.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-[var(--color-teal)] text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const specialtyList =
    status.role === "trainer" ? TRAINER_SPECIALTIES : NUTRITIONIST_SPECIALTIES;
  const roleTitle = status.role === "trainer" ? "Trainer" : "Nutritionist";

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      {/* Header */}
      <div className="pt-8 px-6 pb-6 flex items-center bg-white shadow-sm z-10">
        <button
          onClick={() => router.back()}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          Professional Onboarding
        </h1>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-[var(--color-foreground)] mb-2">
                {roleTitle} Details
              </h2>
              <p className="text-[var(--color-subtext)]">
                Complete your professional profile to start connecting with
                clients
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
                <span className="mr-2">⚠️</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Bio Section */}
              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-[var(--color-subtext)] mb-2"
                >
                  Professional Bio <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-[var(--color-background)] border-none rounded-xl focus:ring-2 focus:ring-[var(--color-teal)] outline-none transition-all resize-none"
                  placeholder={`Tell clients about your experience, qualifications, and approach as a ${status.role}...`}
                  disabled={submitting}
                />
                <p className="mt-2 text-xs text-[var(--color-subtext)] text-right">
                  {bio.length} characters
                </p>
              </div>

              {/* Specialties Section */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-subtext)] mb-3">
                  Specialties <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-[var(--color-subtext)] mb-4">
                  Select all areas you specialize in (
                  {selectedSpecialties.length} selected)
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {specialtyList.map((specialty) => (
                    <label
                      key={specialty}
                      className={`flex items-center space-x-3 p-3 border rounded-xl cursor-pointer transition-all ${
                        selectedSpecialties.includes(specialty)
                          ? "border-[var(--color-teal)] bg-[#daefe7]"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          selectedSpecialties.includes(specialty)
                            ? "border-[var(--color-teal)] bg-[var(--color-teal)]"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {selectedSpecialties.includes(specialty) && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedSpecialties.includes(specialty)}
                        onChange={() => handleSpecialtyToggle(specialty)}
                        disabled={submitting}
                        className="hidden"
                      />
                      <span
                        className={`text-sm font-medium ${
                          selectedSpecialties.includes(specialty)
                            ? "text-[var(--color-teal)]"
                            : "text-[var(--color-foreground)]"
                        }`}
                      >
                        {specialty}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Other Specialty Option */}
                <div className="border-t border-gray-100 pt-4">
                  {!showOtherInput ? (
                    <button
                      type="button"
                      onClick={() => setShowOtherInput(true)}
                      className="text-sm text-[var(--color-teal)] font-bold hover:underline flex items-center"
                      disabled={submitting}
                    >
                      <span className="text-lg mr-1">+</span> Add Custom
                      Specialty
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={otherSpecialty}
                        onChange={(e) => setOtherSpecialty(e.target.value)}
                        placeholder="Enter custom specialty"
                        className="flex-1 px-4 py-2 bg-[var(--color-background)] border-none rounded-xl focus:ring-2 focus:ring-[var(--color-teal)] outline-none text-sm"
                        disabled={submitting}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddOtherSpecialty();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddOtherSpecialty}
                        className="px-4 py-2 bg-[var(--color-teal)] text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-bold"
                        disabled={submitting}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowOtherInput(false);
                          setOtherSpecialty("");
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[var(--color-teal)] text-white py-3.5 rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {submitting ? "Saving..." : "Complete Onboarding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

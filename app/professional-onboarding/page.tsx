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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Pre-fill form if already has data
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

      // Success - redirect to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSubmitting(false);
    }
  };

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

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load onboarding status</p>
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

  if (!status.isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Verification Pending
          </h2>
          <p className="text-gray-600 mb-6">
            Your account is currently under review. You&apos;ll be able to
            complete your professional onboarding once your account has been
            verified by our team.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {roleTitle} Professional Onboarding
            </h1>
            <p className="text-gray-600">
              Complete your professional profile to start connecting with
              clients
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Bio Section */}
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Professional Bio <span className="text-red-500">*</span>
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Tell clients about your experience, qualifications, and approach as a ${status.role}...`}
                disabled={submitting}
              />
              <p className="mt-1 text-sm text-gray-500">
                {bio.length} characters
              </p>
            </div>

            {/* Specialties Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Specialties <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Select all areas you specialize in ({selectedSpecialties.length}{" "}
                selected)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {specialtyList.map((specialty) => (
                  <label
                    key={specialty}
                    className="flex items-center space-x-2 p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSpecialties.includes(specialty)}
                      onChange={() => handleSpecialtyToggle(specialty)}
                      disabled={submitting}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{specialty}</span>
                  </label>
                ))}
              </div>

              {/* Other Specialty Option */}
              <div className="border-t pt-4">
                {!showOtherInput ? (
                  <button
                    type="button"
                    onClick={() => setShowOtherInput(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    disabled={submitting}
                  >
                    + Add Custom Specialty
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otherSpecialty}
                      onChange={(e) => setOtherSpecialty(e.target.value)}
                      placeholder="Enter custom specialty"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
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
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition text-sm"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Display custom specialties */}
              {selectedSpecialties.some(
                (s) => !specialtyList.includes(s as never)
              ) && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Custom Specialties:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSpecialties
                      .filter((s) => !specialtyList.includes(s as never))
                      .map((specialty) => (
                        <span
                          key={specialty}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {specialty}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSpecialties((prev) =>
                                prev.filter((s) => s !== specialty)
                              )
                            }
                            className="hover:text-blue-900"
                            disabled={submitting}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  bio.trim().length === 0 ||
                  selectedSpecialties.length === 0
                }
                className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Saving..."
                  : status.hasCompletedOnboarding
                  ? "Update Profile"
                  : "Complete Onboarding"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

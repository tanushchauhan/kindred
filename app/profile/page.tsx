"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AvatarUpload from "@/app/components/AvatarUpload";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{
    full_name: string;
    phone_number: string | null;
    gender: string | null;
    location: string | null;
    birth_date: string | null;
    profile_image_url: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Form state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [birthDate, setBirthDate] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/me", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/signin");
          return;
        }
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setProfile({
        full_name: data.full_name,
        phone_number: data.phone_number,
        gender: data.gender,
        location: data.location,
        birth_date: data.birth_date,
        profile_image_url: data.profile_image_url,
      });

      setFullName(data.full_name || "");
      setPhoneNumber(data.phone_number || "");
      setGender(data.gender || "");
      setLocation(data.location || "");
      setBirthDate(data.birth_date || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          full_name: fullName,
          phone_number: phoneNumber,
          gender: gender,
          location: location,
          birth_date: birthDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccessMessage("Profile updated successfully!");
      setProfile({
        full_name: data.profile.full_name,
        phone_number: data.profile.phone_number,
        gender: data.profile.gender,
        location: data.profile.location,
        birth_date: data.profile.birth_date,
        profile_image_url: profile?.profile_image_url || null,
      });

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
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

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error || "Failed to load profile"}
          </p>
          <button
            onClick={() => router.push("/auth/signin")}
            className="text-[var(--color-tint)] hover:underline"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

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
          Edit Profile
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {successMessage && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center">
                <span className="mr-2">✓</span> {successMessage}
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
                <span className="mr-2">⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center mb-8">
                <AvatarUpload
                  currentAvatarUrl={profile.profile_image_url}
                  onUploadComplete={(url) => {
                    setProfile((prev) =>
                      prev ? { ...prev, profile_image_url: url } : null
                    );
                    setSuccessMessage("Profile picture updated!");
                    setTimeout(() => setSuccessMessage(""), 3000);
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-[var(--color-subtext)] mb-2"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--color-background)] border-none rounded-xl focus:ring-2 focus:ring-[var(--color-teal)] outline-none transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-[var(--color-subtext)] mb-2"
                >
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--color-background)] border-none rounded-xl focus:ring-2 focus:ring-[var(--color-teal)] outline-none transition-all"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium text-[var(--color-subtext)] mb-2"
                >
                  Gender
                </label>
                <div className="relative">
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--color-background)] border-none rounded-xl focus:ring-2 focus:ring-[var(--color-teal)] outline-none appearance-none transition-all"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-400"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-[var(--color-subtext)] mb-2"
                >
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--color-background)] border-none rounded-xl focus:ring-2 focus:ring-[var(--color-teal)] outline-none transition-all"
                  placeholder="City, State"
                />
              </div>

              <div>
                <label
                  htmlFor="birthDate"
                  className="block text-sm font-medium text-[var(--color-subtext)] mb-2"
                >
                  Birth Date
                </label>
                <input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 bg-[var(--color-background)] border-none rounded-xl focus:ring-2 focus:ring-[var(--color-teal)] outline-none transition-all"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <Link
                  href="/dashboard"
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[var(--color-teal)] text-white py-3 px-4 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

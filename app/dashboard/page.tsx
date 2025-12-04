"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

interface UserProfile {
  id: string;
  email?: string;
  user_name: string | null;
  role: string;
  full_name: string;
  phone_number: string | null;
  gender: string | null;
  location: string | null;
  birth_date: string | null;
  profile_image_url: string | null;
  client_profiles?:
    | Array<{
        user_id: string;
        onboarding_data: Record<string, unknown> | null;
      }>
    | {
        user_id: string;
        onboarding_data: Record<string, unknown> | null;
      };
  trainer_profiles?: {
    user_id: string;
    bio: string | null;
    specialties: string[];
    is_verified: boolean;
  };
  nutritionist_profiles?: {
    user_id: string;
    bio: string | null;
    specialties: string[];
    is_verified: boolean;
  };
}

interface ClientMatch {
  match_id: string;
  client_id: string;
  full_name: string | null;
  user_name: string | null;
  location: string | null;
  gender: string | null;
  created_at: string;
  last_updated: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [clients, setClients] = useState<ClientMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await supabase.auth.signOut();
      router.push("/auth/signin");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

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
        if (response.status === 404) {
          router.push("/auth/complete-profile");
          return;
        }
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();

      if (data.role === "admin") {
        router.push("/admin");
        return;
      }

      setProfile(data);

      // Fetch clients if user is a professional
      if (data.role === "trainer" || data.role === "nutritionist") {
        fetchClients();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/professionals/clients", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const list: ClientMatch[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.clients)
          ? data.clients
          : [];
        setClients(list);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
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

  const isProfessional =
    profile.role === "trainer" || profile.role === "nutritionist";
  const professionalData =
    profile.role === "trainer"
      ? profile.trainer_profiles
      : profile.nutritionist_profiles;
  const isVerified = professionalData?.is_verified;

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      {/* Header */}
      <div className="pt-8 px-6 pb-6 flex justify-between items-center bg-white shadow-sm z-10">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            {isProfessional ? "Professional Dashboard" : "Client Dashboard"}
          </h1>
          <p className="text-[var(--color-subtext)] mt-1">
            Welcome back, {profile.full_name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-background)] rounded-full">
            <div
              className={`w-2 h-2 rounded-full ${
                isVerified ? "bg-green-500" : "bg-yellow-500"
              }`}
            ></div>
            <span className="text-sm font-medium text-[var(--color-foreground)]">
              {isVerified ? "Verified Pro" : "Verification Pending"}
            </span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:opacity-80 transition-opacity overflow-hidden border border-gray-200"
            >
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg">👤</span>
              )}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <button
                  onClick={() => router.push("/profile")}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Verification Banner */}
          {!isVerified && isProfessional && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <h3 className="font-bold text-yellow-900">
                  Verification Pending
                </h3>
                <p className="text-yellow-800 text-sm mt-1">
                  Your account is currently under review. Once verified, you
                  will be able to accept clients and create plans.
                </p>
              </div>
            </div>
          )}

          {/* Stats Grid
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <span className="text-2xl">👥</span>
                </div>
                <span className="text-3xl font-bold text-[var(--color-foreground)]">
                  {clients.length}
                </span>
              </div>
              <p className="text-[var(--color-subtext)] font-medium">
                Active Clients
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-green-50 rounded-lg">
                  <span className="text-2xl">📋</span>
                </div>
                <span className="text-3xl font-bold text-[var(--color-foreground)]">
                  0
                </span>
              </div>
              <p className="text-[var(--color-subtext)] font-medium">
                Active Plans
              </p>
            </div>
          </div> */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Quick Actions & Clients */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-4">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Link
                    href="/professionals/clients"
                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-[var(--color-background)] hover:bg-gray-100 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                      <span className="text-xl">👥</span>
                    </div>
                    <span className="text-sm font-medium text-center">
                      My Clients
                    </span>
                  </Link>

                  <Link
                    href="/chat"
                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-[var(--color-background)] hover:bg-gray-100 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                      <span className="text-xl">💬</span>
                    </div>
                    <span className="text-sm font-medium text-center">
                      Chat
                    </span>
                  </Link>

                  <Link
                    href="/professional-onboarding"
                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-[var(--color-background)] hover:bg-gray-100 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                      <span className="text-xl">📋</span>
                    </div>
                    <span className="text-sm font-medium text-center">
                      Onboarding Answers
                    </span>
                  </Link>
                </div>
              </div>

              {/* Recent Clients List */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-[var(--color-foreground)]">
                    Recent Clients
                  </h2>
                  <Link
                    href="/professionals/clients"
                    className="text-[var(--color-teal)] text-sm font-medium hover:underline"
                  >
                    View All
                  </Link>
                </div>

                {clients.length > 0 ? (
                  <div className="space-y-4">
                    {clients.slice(0, 3).map((client) => (
                      <div
                        key={client.match_id}
                        className="flex items-center justify-between p-3 bg-[var(--color-background)] rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[var(--color-teal)] font-bold shadow-sm">
                            {client.full_name
                              ? client.full_name.charAt(0).toUpperCase()
                              : "C"}
                          </div>
                          <div>
                            <h3 className="font-medium text-[var(--color-foreground)]">
                              {client.full_name || "Unknown Client"}
                            </h3>
                            <p className="text-xs text-[var(--color-subtext)]">
                              Matched{" "}
                              {new Date(client.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/professionals/clients/${client.client_id}`}
                          className="px-3 py-1.5 bg-white text-[var(--color-teal)] text-sm font-medium rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                      <span className="text-3xl text-gray-300">👥</span>
                    </div>
                    <p className="text-[var(--color-foreground)] font-medium">
                      No clients yet
                    </p>
                    <p className="text-[var(--color-subtext)] text-sm mt-1 max-w-xs">
                      Start by inviting clients to join your network and manage
                      their wellness journey.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Profile Card */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 overflow-hidden border-4 border-white shadow-sm">
                    {profile.profile_image_url ? (
                      <img
                        src={profile.profile_image_url}
                        alt={profile.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--color-teal)] text-white text-3xl font-bold">
                        {profile.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-foreground)]">
                    {profile.full_name}
                  </h2>
                  <p className="text-[var(--color-teal)] font-medium capitalize">
                    {profile.role}
                  </p>

                  <div className="mt-4 w-full">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-[var(--color-subtext)] text-sm">
                        Status
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          isVerified ? "text-green-600" : "text-yellow-600"
                        }`}
                      >
                        {isVerified ? "Verified" : "Pending"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-[var(--color-subtext)] text-sm">
                        Member Since
                      </span>
                      <span className="text-sm font-medium text-[var(--color-foreground)]">
                        {new Date().getFullYear()}
                      </span>
                    </div>
                  </div>

                  {/* Edit Profile button removed as per request */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

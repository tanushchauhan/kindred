"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Stats {
  timestamp: string;
  users: {
    total: number;
    clients: number;
    trainers: number;
    nutritionists: number;
    admins: number;
  };
  clients: {
    total: number;
    completedOnboarding: number;
    pendingOnboarding: number;
  };
  professionals: {
    trainers: {
      total: number;
      verified: number;
      withEmbeddings: number;
      needingEmbeddings: number;
    };
    nutritionists: {
      total: number;
      verified: number;
      withEmbeddings: number;
      needingEmbeddings: number;
    };
    embeddingCoverage: {
      trainers: number;
      nutritionists: number;
    };
  };
  aiMatching: {
    readyForMatching: number;
    availableTrainers: number;
    availableNutritionists: number;
    potentialMatches: number;
  };
}

interface EmbeddingResult {
  processed: number;
  success: number;
  failed: number;
  errors: string[];
}

interface EmbeddingResponse {
  message: string;
  results: {
    trainers: EmbeddingResult;
    nutritionists: EmbeddingResult;
  };
  timestamp: string;
}

interface PendingProfessional {
  user_id: string;
  role: "trainer" | "nutritionist";
  full_name: string;
  user_name: string;
  email: string;
  phone_number: string;
  location: string;
  bio: string | null;
  specialties: string[];
  reason_for_joining: string;
  created_at: string;
  is_verified: boolean;
}

interface PendingProfessionalsResponse {
  trainers: PendingProfessional[];
  nutritionists: PendingProfessional[];
  total: number;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [generatingEmbeddings, setGeneratingEmbeddings] = useState(false);
  const [embeddingResult, setEmbeddingResult] =
    useState<EmbeddingResponse | null>(null);
  const [embeddingError, setEmbeddingError] = useState("");
  const [adminName, setAdminName] = useState("Admin");
  const [pendingProfessionals, setPendingProfessionals] =
    useState<PendingProfessionalsResponse | null>(null);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [selectedProfessional, setSelectedProfessional] =
    useState<PendingProfessional | null>(null);

  useEffect(() => {
    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) {
      fetchStats();
      fetchPendingProfessionals();
    }
  }, [authorized, fetchStats]);

  const fetchPendingProfessionals = async () => {
    setPendingLoading(true);
    try {
      const response = await fetch("/api/admin/pending-professionals");
      if (response.ok) {
        const data = await response.json();
        setPendingProfessionals(data);
      }
    } catch (error) {
      console.error("Error fetching pending professionals:", error);
    } finally {
      setPendingLoading(false);
    }
  };

  const checkAdminAccess = async () => {
    try {
      // Use the server-side admin verification endpoint
      // This ensures the role check happens on the server, not just the client
      const response = await fetch("/api/admin/verify");

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth/signin");
          return;
        }
        if (response.status === 403) {
          // Not an admin, redirect to regular dashboard
          router.push("/dashboard");
          return;
        }
        throw new Error("Failed to verify admin access");
      }

      const data = await response.json();

      if (!data.authorized) {
        router.push("/dashboard");
        return;
      }

      setAuthorized(true);

      // Fetch admin user info
      try {
        const meResponse = await fetch("/api/me");
        if (meResponse.ok) {
          const userData = await meResponse.json();
          setAdminName(userData.full_name || userData.user_name || "Admin");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      router.push("/auth/signin");
    } finally {
      setLoading(false);
    }
  };

  const generateEmbeddings = async (
    type: "trainers" | "nutritionists" | "all"
  ) => {
    setGeneratingEmbeddings(true);
    setEmbeddingError("");
    setEmbeddingResult(null);

    try {
      const response = await fetch(
        `/api/admin/generate-embeddings?type=${type}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate embeddings");
      }

      setEmbeddingResult(data);
      // Refresh stats after generating embeddings
      fetchStats();
    } catch (error) {
      setEmbeddingError(
        error instanceof Error ? error.message : "An error occurred"
      );
    } finally {
      setGeneratingEmbeddings(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        router.push("/auth/signin");
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⚙️</div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <nav className="bg-white shadow rounded-lg mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-4">
                <div className="text-3xl">👑</div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Admin Dashboard
                  </h1>
                  <p className="text-sm text-gray-500">
                    Platform Management & Analytics
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end text-right mr-4">
                  <span className="text-sm font-medium text-gray-900">
                    {adminName}
                  </span>
                  <span className="text-xs text-gray-500">Administrator</span>
                </div>

                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Stats Grid */}
        {statsLoading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 animate-spin">📊</div>
            <p className="text-gray-600">Loading statistics...</p>
          </div>
        ) : stats ? (
          <>
            {/* User Stats */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                👥 User Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                  title="Total Users"
                  value={stats.users.total}
                  icon="👤"
                  color="bg-blue-500"
                />
                <StatCard
                  title="Clients"
                  value={stats.users.clients}
                  icon="🧑‍💼"
                  color="bg-green-500"
                />
                <StatCard
                  title="Trainers"
                  value={stats.users.trainers}
                  icon="🏋️"
                  color="bg-purple-500"
                />
                <StatCard
                  title="Nutritionists"
                  value={stats.users.nutritionists}
                  icon="🥗"
                  color="bg-orange-500"
                />
                <StatCard
                  title="Admins"
                  value={stats.users.admins}
                  icon="👑"
                  color="bg-red-500"
                />
              </div>
            </div>

            {/* Client Onboarding Stats */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📝 Client Onboarding
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Total Clients"
                  value={stats.clients.total}
                  icon="📋"
                  color="bg-blue-500"
                />
                <StatCard
                  title="Completed"
                  value={stats.clients.completedOnboarding}
                  icon="✅"
                  color="bg-green-500"
                  subtitle={`${
                    stats.clients.total > 0
                      ? Math.round(
                          (stats.clients.completedOnboarding /
                            stats.clients.total) *
                            100
                        )
                      : 0
                  }% completion rate`}
                />
                <StatCard
                  title="Pending"
                  value={stats.clients.pendingOnboarding}
                  icon="⏳"
                  color="bg-yellow-500"
                />
              </div>
            </div>

            {/* Professional Stats */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                💼 Professional Statistics
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trainers */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🏋️</span>
                    Trainers
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold">
                        {stats.professionals.trainers.total}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Verified:</span>
                      <span className="font-semibold text-green-600">
                        {stats.professionals.trainers.verified}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">With Embeddings:</span>
                      <span className="font-semibold text-blue-600">
                        {stats.professionals.trainers.withEmbeddings}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Needing Embeddings:</span>
                      <span className="font-semibold text-orange-600">
                        {stats.professionals.trainers.needingEmbeddings}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Coverage:</span>
                        <span className="font-bold text-lg">
                          {stats.professionals.embeddingCoverage.trainers}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nutritionists */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🥗</span>
                    Nutritionists
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold">
                        {stats.professionals.nutritionists.total}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Verified:</span>
                      <span className="font-semibold text-green-600">
                        {stats.professionals.nutritionists.verified}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">With Embeddings:</span>
                      <span className="font-semibold text-blue-600">
                        {stats.professionals.nutritionists.withEmbeddings}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Needing Embeddings:</span>
                      <span className="font-semibold text-orange-600">
                        {stats.professionals.nutritionists.needingEmbeddings}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Coverage:</span>
                        <span className="font-bold text-lg">
                          {stats.professionals.embeddingCoverage.nutritionists}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Matching Stats */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ✨ AI Matching System
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Clients Ready"
                  value={stats.aiMatching.readyForMatching}
                  icon="👥"
                  color="bg-green-500"
                  subtitle="Completed onboarding"
                />
                <StatCard
                  title="Available Trainers"
                  value={stats.aiMatching.availableTrainers}
                  icon="🏋️"
                  color="bg-blue-500"
                  subtitle="With embeddings"
                />
                <StatCard
                  title="Available Nutritionists"
                  value={stats.aiMatching.availableNutritionists}
                  icon="🥗"
                  color="bg-purple-500"
                  subtitle="With embeddings"
                />
                <StatCard
                  title="Potential Matches"
                  value={stats.aiMatching.potentialMatches}
                  icon="🎯"
                  color="bg-pink-500"
                  subtitle="Possible combinations"
                />
              </div>
            </div>

            {/* Embedding Generation */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🤖 Embedding Generation
              </h2>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-600 mb-6">
                  Generate AI embeddings for professional profiles to enable
                  semantic matching. This process analyzes bios and specialties
                  to create vector representations.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <button
                    onClick={() => generateEmbeddings("trainers")}
                    disabled={
                      generatingEmbeddings ||
                      stats.professionals.trainers.needingEmbeddings === 0
                    }
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {generatingEmbeddings
                      ? "Processing..."
                      : `Generate for Trainers (${stats.professionals.trainers.needingEmbeddings})`}
                  </button>
                  <button
                    onClick={() => generateEmbeddings("nutritionists")}
                    disabled={
                      generatingEmbeddings ||
                      stats.professionals.nutritionists.needingEmbeddings === 0
                    }
                    className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {generatingEmbeddings
                      ? "Processing..."
                      : `Generate for Nutritionists (${stats.professionals.nutritionists.needingEmbeddings})`}
                  </button>
                  <button
                    onClick={() => generateEmbeddings("all")}
                    disabled={
                      generatingEmbeddings ||
                      (stats.professionals.trainers.needingEmbeddings === 0 &&
                        stats.professionals.nutritionists.needingEmbeddings ===
                          0)
                    }
                    className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {generatingEmbeddings ? "Processing..." : "Generate All"}
                  </button>
                </div>

                {/* Embedding Result */}
                {embeddingResult && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                    <h4 className="font-semibold text-green-900 mb-2">
                      ✅ Embedding Generation Complete
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-green-800">Trainers:</p>
                        <p className="text-green-700">
                          Processed:{" "}
                          {embeddingResult.results.trainers.processed}
                        </p>
                        <p className="text-green-700">
                          Success: {embeddingResult.results.trainers.success}
                        </p>
                        <p className="text-green-700">
                          Failed: {embeddingResult.results.trainers.failed}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-green-800">
                          Nutritionists:
                        </p>
                        <p className="text-green-700">
                          Processed:{" "}
                          {embeddingResult.results.nutritionists.processed}
                        </p>
                        <p className="text-green-700">
                          Success:{" "}
                          {embeddingResult.results.nutritionists.success}
                        </p>
                        <p className="text-green-700">
                          Failed: {embeddingResult.results.nutritionists.failed}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Embedding Error */}
                {embeddingError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h4 className="font-semibold text-red-900 mb-2">
                      ❌ Error
                    </h4>
                    <p className="text-red-700 text-sm">{embeddingError}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pending Professionals Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ⏳ Pending Professional Applications
              </h2>
              {pendingLoading ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <div className="text-4xl mb-4 animate-spin">⏳</div>
                  <p className="text-gray-600">
                    Loading pending applications...
                  </p>
                </div>
              ) : pendingProfessionals && pendingProfessionals.total > 0 ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <p className="text-gray-600 mb-6">
                    Review and approve professional applications.{" "}
                    {pendingProfessionals.total} pending application(s).
                  </p>

                  <div className="space-y-4">
                    {/* Pending Trainers */}
                    {pendingProfessionals.trainers.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span>🏋️</span>
                          <span>
                            Trainers ({pendingProfessionals.trainers.length})
                          </span>
                        </h3>
                        <div className="space-y-3">
                          {pendingProfessionals.trainers.map((professional) => (
                            <ProfessionalCard
                              key={professional.user_id}
                              professional={professional}
                              onView={() =>
                                setSelectedProfessional(professional)
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending Nutritionists */}
                    {pendingProfessionals.nutritionists.length > 0 && (
                      <div
                        className={
                          pendingProfessionals.trainers.length > 0 ? "mt-6" : ""
                        }
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span>🥗</span>
                          <span>
                            Nutritionists (
                            {pendingProfessionals.nutritionists.length})
                          </span>
                        </h3>
                        <div className="space-y-3">
                          {pendingProfessionals.nutritionists.map(
                            (professional) => (
                              <ProfessionalCard
                                key={professional.user_id}
                                professional={professional}
                                onView={() =>
                                  setSelectedProfessional(professional)
                                }
                              />
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    All Caught Up!
                  </h3>
                  <p className="text-gray-600">
                    No pending professional applications at the moment.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No statistics available</p>
          </div>
        )}
      </div>

      {/* Professional Details Modal */}
      {selectedProfessional && (
        <ProfessionalModal
          professional={selectedProfessional}
          onClose={() => setSelectedProfessional(null)}
          onActionComplete={() => {
            setSelectedProfessional(null);
            fetchPendingProfessionals();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}

// Reusable StatCard component
function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${color.replace("bg-", "text-")}`}>
        {value}
      </div>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// Professional Card Component
function ProfessionalCard({
  professional,
  onView,
}: {
  professional: PendingProfessional;
  onView: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900">
              {professional.full_name}
            </h4>
            <span className="text-sm text-gray-500">
              @{professional.user_name}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{professional.email}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {professional.location && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                📍 {professional.location}
              </span>
            )}
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {professional.role === "trainer"
                ? "🏋️ Trainer"
                : "🥗 Nutritionist"}
            </span>
          </div>
          <p className="text-sm text-gray-700 line-clamp-2">
            {professional.reason_for_joining}
          </p>
        </div>
        <button
          onClick={onView}
          className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition whitespace-nowrap"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

// Professional Modal Component
function ProfessionalModal({
  professional,
  onClose,
  onActionComplete,
}: {
  professional: PendingProfessional;
  onClose: () => void;
  onActionComplete?: () => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleAction = async (action: "approve" | "reject") => {
    const confirmMessage =
      action === "approve"
        ? `Are you sure you want to APPROVE ${professional.full_name} as a ${professional.role}?`
        : `Are you sure you want to REJECT and DELETE the account of ${professional.full_name}? This action cannot be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/admin/manage-professional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: professional.user_id,
          role: professional.role,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} professional`);
      }

      // Close modal and refresh the list
      onClose();
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {professional.full_name}
              </h3>
              <p className="text-gray-600">@{professional.user_name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              Contact Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900">{professional.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-gray-900">
                  {professional.phone_number || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-gray-900">
                  {professional.location || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-gray-900 capitalize">{professional.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Applied On</p>
                <p className="text-gray-900">
                  {new Date(professional.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Bio */}
          {professional.bio && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Bio</h4>
              <p className="text-gray-700 whitespace-pre-wrap">
                {professional.bio}
              </p>
            </div>
          )}

          {/* Specialties */}
          {professional.specialties && professional.specialties.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Specialties
              </h4>
              <div className="flex flex-wrap gap-2">
                {professional.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reason for Joining - HIGHLIGHTED */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>⭐</span>
              <span>Reason for Joining & Qualifications</span>
            </h4>
            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
              {professional.reason_for_joining}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              disabled={processing}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={() => handleAction("approve")}
            >
              {processing ? "Processing..." : "✅ Approve"}
            </button>
            <button
              disabled={processing}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={() => handleAction("reject")}
            >
              {processing ? "Processing..." : "❌ Reject"}
            </button>
            <button
              disabled={processing}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

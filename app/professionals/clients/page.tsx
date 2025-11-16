"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// API now returns a flat array of client user objects. Example:
// [ { id, full_name, user_name, location, gender }, ... ]
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

interface UserProfile {
  role: string;
  full_name: string;
}

export default function ProfessionalClientsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [clients, setClients] = useState<ClientMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    checkProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkProfile = async () => {
    try {
      // Check if user is authenticated and is a professional
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

      if (data.role !== "trainer" && data.role !== "nutritionist") {
        router.push("/dashboard");
        return;
      }

      setProfile(data);
      await fetchClients();
    } catch (err) {
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

      if (!response.ok) {
        if (response.status === 404 || response.status === 403) {
          // No clients yet, that's okay
          setClients([]);
          return;
        }
        throw new Error("Failed to fetch clients");
      }

      const data = await response.json();
      // API may return either { clients: [...] } or directly [...]
      const list: ClientMatch[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.clients)
        ? data.clients
        : [];
      setClients(list);
      console.log("Fetched clients:", list);
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load clients");
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

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Failed to load data"}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Kindred</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Clients</h2>
          <p className="text-gray-600">
            Manage plans and track progress for your matched clients
          </p>
        </div>

        {/* Clients Grid */}
        {clients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Clients Yet
            </h3>
            <p className="text-gray-600 mb-6">
              You don&apos;t have any matched clients at the moment. Clients
              will appear here once they select you as their{" "}
              {profile.role === "trainer" ? "trainer" : "nutritionist"}.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((match) => (
              <Link
                key={match.match_id}
                href={`/professionals/clients/${match.client_id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {match.full_name}
                    </h3>
                    {match.user_name && (
                      <p className="text-sm text-gray-500 font-mono">
                        @{match.user_name}
                      </p>
                    )}
                  </div>
                  <div className="text-3xl">👤</div>
                </div>

                <div className="space-y-2 mb-4">
                  {match.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📍</span>
                      {match.location}
                    </div>
                  )}
                  {match.gender && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">⚧</span>
                      <span className="capitalize">{match.gender}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Matched since</span>
                    <span>
                      {match.created_at
                        ? new Date(match.created_at).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-blue-600 text-sm font-medium text-center">
                    View Details →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {clients.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Stats
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {clients.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Clients</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {
                    clients.filter((c) =>
                      c.created_at
                        ? new Date(c.created_at) >
                          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        : false
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600 mt-1">New This Month</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {
                    clients.filter((c) =>
                      c.last_updated
                        ? new Date(c.last_updated) >
                          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        : false
                    ).length
                  }
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Active This Week
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

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
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load clients");
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[var(--color-teal)] text-white rounded-full hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)] mb-2">
              My Clients
            </h1>
            <p className="text-gray-600">
              Manage your active client relationships and plans
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-[var(--color-teal)] hover:underline"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Clients Grid */}
        {clients.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-[var(--color-background)] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-[var(--color-teal)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
              No Clients Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              When clients match with you, they will appear here. Make sure your
              profile is complete to attract more matches.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div
                key={client.match_id}
                className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-[var(--color-background)] rounded-full flex items-center justify-center text-xl font-bold text-[var(--color-teal)]">
                      {client.full_name
                        ? client.full_name.charAt(0).toUpperCase()
                        : "C"}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[var(--color-foreground)]">
                        {client.full_name || "Unknown Client"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {client.location || "No location"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 mr-2 text-[var(--color-teal)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {client.gender || "Not specified"}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 mr-2 text-[var(--color-teal)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Matched {new Date(client.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Link
                    href={`/professionals/clients/${client.client_id}`}
                    className="flex-1 bg-[var(--color-teal)] text-white text-center py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface ProfessionalData {
  id: string;
  role: string;
  full_name: string;
  user_name: string;
  location: string | null;
  profile: {
    bio: string;
    specialties: string[];
    is_verified: boolean;
  };
}

export default function ProfessionalProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [professional, setProfessional] = useState<ProfessionalData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (username) {
      fetchProfessional();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const fetchProfessional = async () => {
    try {
      const response = await fetch(`/api/professionals/${username}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Professional not found");
        } else {
          throw new Error("Failed to fetch professional");
        }
        return;
      }

      const data = await response.json();
      setProfessional(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !professional) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || "Professional not found"}
          </h2>
          <Link
            href="/professionals"
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to Professionals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/professionals"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Professionals
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {professional.full_name}
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  @{professional.user_name}
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Verified{" "}
                {professional.role === "trainer" ? "Trainer" : "Nutritionist"}
              </span>
            </div>

            {professional.location && (
              <p className="text-gray-600 flex items-center mt-2">
                <span className="mr-2">📍</span>
                {professional.location}
              </p>
            )}
          </div>

          {/* Bio Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {professional.profile.bio}
            </p>
          </div>

          {/* Specialties Section */}
          {professional.profile.specialties &&
            professional.profile.specialties.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Specialties
                </h2>
                <div className="flex flex-wrap gap-2">
                  {professional.profile.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Contact Section */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Interested in working together?
            </h2>
            <p className="text-gray-600 mb-4">
              Sign up or log in to connect with {professional.full_name}.
            </p>
            <div className="flex gap-4">
              <Link
                href="/auth/signup"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Sign Up
              </Link>
              <Link
                href="/auth/signin"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

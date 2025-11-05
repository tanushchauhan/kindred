"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ProfessionalProfile {
  bio: string;
  specialties: string[];
  is_verified: boolean;
}

interface Professional {
  id: string;
  full_name: string;
  user_name: string;
  location: string | null;
  trainer_profiles?: ProfessionalProfile;
  nutritionist_profiles?: ProfessionalProfile;
}

export default function ProfessionalsPage() {
  const [trainers, setTrainers] = useState<Professional[]>([]);
  const [nutritionists, setNutritionists] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"trainers" | "nutritionists">(
    "trainers"
  );

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    try {
      const response = await fetch("/api/professionals");

      if (!response.ok) {
        throw new Error("Failed to fetch professionals");
      }

      const data = await response.json();
      setTrainers(data.trainers || []);
      setNutritionists(data.nutritionists || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const renderProfessionalCard = (professional: Professional) => {
    const profile =
      professional.trainer_profiles || professional.nutritionist_profiles;

    if (!profile) return null;

    return (
      <Link
        key={professional.id}
        href={`/professionals/${professional.user_name}`}
        className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {professional.full_name}
            </h3>
            <p className="text-sm text-gray-500">@{professional.user_name}</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✓ Verified
          </span>
        </div>

        {professional.location && (
          <p className="text-sm text-gray-600 mb-3">
            📍 {professional.location}
          </p>
        )}

        <p className="text-sm text-gray-700 mb-4 line-clamp-3">{profile.bio}</p>

        {profile.specialties && profile.specialties.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.specialties.slice(0, 3).map((specialty, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {specialty}
              </span>
            ))}
            {profile.specialties.length > 3 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                +{profile.specialties.length - 3} more
              </span>
            )}
          </div>
        )}
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading professionals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Find Professionals
              </h1>
              <p className="mt-1 text-gray-600">
                Connect with verified trainers and nutritionists
              </p>
            </div>
            <Link
              href="/"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("trainers")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "trainers"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Trainers ({trainers.length})
            </button>
            <button
              onClick={() => setActiveTab("nutritionists")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "nutritionists"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Nutritionists ({nutritionists.length})
            </button>
          </nav>
        </div>

        {/* Professional Grid */}
        {activeTab === "trainers" && (
          <div>
            {trainers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  No verified trainers available yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainers.map(renderProfessionalCard)}
              </div>
            )}
          </div>
        )}

        {activeTab === "nutritionists" && (
          <div>
            {nutritionists.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  No verified nutritionists available yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nutritionists.map(renderProfessionalCard)}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

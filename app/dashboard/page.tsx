"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to check if onboarding is completed
  const hasCompletedOnboarding = (
    clientProfiles?:
      | Array<{
          user_id: string;
          onboarding_data: Record<string, unknown> | null;
        }>
      | {
          user_id: string;
          onboarding_data: Record<string, unknown> | null;
        }
  ): boolean => {
    if (!clientProfiles) return false;

    // Normalize to single object
    const clientProfile = Array.isArray(clientProfiles)
      ? clientProfiles[0]
      : clientProfiles;

    if (!clientProfile?.onboarding_data) return false;

    return Object.keys(clientProfile.onboarding_data).length > 0;
  };
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (response.status === 404) {
          // Profile not found - user needs to complete profile
          router.push("/auth/complete-profile");
          return;
        }
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();

      // Check if user is admin and redirect
      if (data.role === "admin") {
        router.push("/admin");
        return;
      }

      // Fetch auth user to get email
      const authResponse = await fetch("/api/auth/user", {
        credentials: "include",
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        data.email = authData.email;
      }

      if (data.client_profiles) {
        console.log("Client profiles:", data.client_profiles);
        console.log(
          "Onboarding data:",
          data.client_profiles[0]?.onboarding_data
        );
        console.log(
          "Type of onboarding_data:",
          typeof data.client_profiles[0]?.onboarding_data
        );
        console.log(
          "Is onboarding_data null?:",
          data.client_profiles[0]?.onboarding_data === null
        );
        console.log(
          "Onboarding data keys:",
          data.client_profiles[0]?.onboarding_data
            ? Object.keys(data.client_profiles[0].onboarding_data)
            : "N/A"
        );
      }
      if (data.trainer_profiles) {
        console.log("Trainer profiles:", data.trainer_profiles);
      }
      if (data.nutritionist_profiles) {
        console.log("Nutritionist profiles:", data.nutritionist_profiles);
      }

      setProfile(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      // Redirect to home page after logout
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Redirect anyway
      router.push("/");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to delete account");
        setIsDeleting(false);
        return;
      }

      // Account deleted successfully
      alert("Your account has been successfully deleted.");
      router.push("/");
    } catch (error) {
      console.error("Delete account error:", error);
      alert("An unexpected error occurred. Please try again.");
      setIsDeleting(false);
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
          <p className="text-red-600 mb-4">
            {error || "Failed to load profile"}
          </p>
          <button
            onClick={() => router.push("/auth/signin")}
            className="text-blue-600 hover:text-blue-700"
          >
            Go to Sign In
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
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {profile.full_name}!
          </h2>
          {profile.user_name && (
            <p className="text-gray-600 mb-2">
              Username:{" "}
              <span className="font-mono text-blue-600">
                @{profile.user_name}
              </span>
            </p>
          )}
          <p className="text-gray-600">
            Role:{" "}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
              {profile.role}
            </span>
          </p>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Profile Information
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="text-xs text-gray-900 font-mono">
                  {profile.id}
                </dd>
              </div>
              {profile.user_name && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Username
                  </dt>
                  <dd className="text-sm text-gray-900 font-mono">
                    @{profile.user_name}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">
                  {profile.email || "Not available"}
                </dd>
              </div>
              {profile.phone_number && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900">
                    {profile.phone_number}
                  </dd>
                </div>
              )}
              {profile.gender && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Gender</dt>
                  <dd className="text-sm text-gray-900 capitalize">
                    {profile.gender}
                  </dd>
                </div>
              )}
              {profile.location && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Location
                  </dt>
                  <dd className="text-sm text-gray-900">{profile.location}</dd>
                </div>
              )}
              {profile.birth_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Birth Date
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(profile.birth_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-4">
              <Link
                href="/profile"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit Profile →
              </Link>
            </div>
          </div>

          {/* Role-specific section */}
          {profile.role === "client" && profile.client_profiles && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Client Information
              </h3>
              {hasCompletedOnboarding(profile.client_profiles) ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-green-600">
                      ✓ Onboarding completed
                    </p>
                    <Link
                      href="/match"
                      className="inline-flex items-center px-4 py-2 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition font-medium shadow-md hover:shadow-lg"
                    >
                      <span className="mr-2">✨</span>
                      Find AI Matches
                    </Link>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your personalized preferences are set. Use the Quick Actions
                    below to find matches or update your preferences.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Complete your onboarding to personalize your experience
                  </p>
                  <Link
                    href="/onboarding"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
                  >
                    Start Onboarding
                  </Link>
                </div>
              )}
            </div>
          )}

          {profile.role === "trainer" && profile.trainer_profiles && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Trainer Information
              </h3>

              {!profile.trainer_profiles.is_verified ? (
                // Show verification pending for unverified trainers
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">⏳</span>
                    <div>
                      <p className="font-medium text-yellow-900 mb-1">
                        Verification Pending
                      </p>
                      <p className="text-sm text-yellow-700">
                        Your account is currently under review. You&apos;ll be
                        able to complete your professional profile once
                        verified.
                      </p>
                    </div>
                  </div>
                </div>
              ) : profile.trainer_profiles.bio &&
                profile.trainer_profiles.specialties?.length > 0 ? (
                // Show bio and specialties for verified trainers with complete profile
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Status
                    </dt>
                    <dd className="text-sm">
                      <span className="text-green-600">✓ Verified</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Bio</dt>
                    <dd className="text-sm text-gray-900">
                      {profile.trainer_profiles.bio}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Specialties
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {profile.trainer_profiles.specialties.join(", ")}
                    </dd>
                  </div>
                </dl>
              ) : (
                // Show complete profile prompt for verified trainers without complete profile
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">✅</span>
                    <div className="flex-1">
                      <p className="font-medium text-blue-900 mb-1">
                        Account Verified!
                      </p>
                      <p className="text-sm text-blue-700 mb-3">
                        Complete your professional profile to start connecting
                        with clients
                      </p>
                      <Link
                        href="/professional-onboarding"
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
                      >
                        Complete Profile
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {profile.role === "nutritionist" && profile.nutritionist_profiles && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Nutritionist Information
              </h3>

              {!profile.nutritionist_profiles.is_verified ? (
                // Show verification pending for unverified nutritionists
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">⏳</span>
                    <div>
                      <p className="font-medium text-yellow-900 mb-1">
                        Verification Pending
                      </p>
                      <p className="text-sm text-yellow-700">
                        Your account is currently under review. You&apos;ll be
                        able to complete your professional profile once
                        verified.
                      </p>
                    </div>
                  </div>
                </div>
              ) : profile.nutritionist_profiles.bio &&
                profile.nutritionist_profiles.specialties?.length > 0 ? (
                // Show bio and specialties for verified nutritionists with complete profile
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Status
                    </dt>
                    <dd className="text-sm">
                      <span className="text-green-600">✓ Verified</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Bio</dt>
                    <dd className="text-sm text-gray-900">
                      {profile.nutritionist_profiles.bio}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Specialties
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {profile.nutritionist_profiles.specialties.join(", ")}
                    </dd>
                  </div>
                </dl>
              ) : (
                // Show complete profile prompt for verified nutritionists without complete profile
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">✅</span>
                    <div className="flex-1">
                      <p className="font-medium text-blue-900 mb-1">
                        Account Verified!
                      </p>
                      <p className="text-sm text-blue-700 mb-3">
                        Complete your professional profile to start connecting
                        with clients
                      </p>
                      <Link
                        href="/professional-onboarding"
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
                      >
                        Complete Profile
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/profile"
              className="border border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition text-center"
            >
              <div className="text-2xl mb-2">👤</div>
              <h4 className="font-medium text-gray-900">Edit Profile</h4>
              <p className="text-xs text-gray-500 mt-1">
                Update your information
              </p>
            </Link>

            {profile.role === "client" &&
            hasCompletedOnboarding(profile.client_profiles) ? (
              <>
                <Link
                  href="/match"
                  className="border-2 border-purple-300 bg-linear-to-br from-purple-50 to-blue-50 rounded-lg p-4 hover:border-purple-500 hover:shadow-lg transition text-center"
                >
                  <div className="text-2xl mb-2">✨</div>
                  <h4 className="font-medium text-gray-900">Find AI Matches</h4>
                  <p className="text-xs text-purple-600 mt-1 font-medium">
                    Get personalized recommendations
                  </p>
                </Link>
                <Link
                  href="/plans"
                  className="border-2 border-green-300 bg-linear-to-br from-green-50 to-blue-50 rounded-lg p-4 hover:border-green-500 hover:shadow-lg transition text-center"
                >
                  <div className="text-2xl mb-2">📋</div>
                  <h4 className="font-medium text-gray-900">My Plans</h4>
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    View nutrition & exercise plans
                  </p>
                </Link>
                <Link
                  href="/progress"
                  className="border-2 border-blue-300 bg-linear-to-br from-blue-50 to-purple-50 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition text-center"
                >
                  <div className="text-2xl mb-2">📊</div>
                  <h4 className="font-medium text-gray-900">My Progress</h4>
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    Track your wellness journey
                  </p>
                </Link>
                <Link
                  href="/health-data"
                  className="border-2 border-purple-300 bg-linear-to-br from-purple-50 to-pink-50 rounded-lg p-4 hover:border-purple-500 hover:shadow-lg transition text-center"
                >
                  <div className="text-2xl mb-2">💚</div>
                  <h4 className="font-medium text-gray-900">Health Data</h4>
                  <p className="text-xs text-purple-600 mt-1 font-medium">
                    Log nutrition & fitness data
                  </p>
                </Link>
                <Link
                  href="/onboarding"
                  className="border border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition text-center"
                >
                  <div className="text-2xl mb-2">🔄</div>
                  <h4 className="font-medium text-gray-900">
                    Update Preferences
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Change your onboarding data
                  </p>
                </Link>
              </>
            ) : profile.role === "client" ? (
              <Link
                href="/onboarding"
                className="border border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition text-center"
              >
                <div className="text-2xl mb-2">📝</div>
                <h4 className="font-medium text-gray-900">Onboarding</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Complete your questionnaire
                </p>
              </Link>
            ) : null}

            {(profile.role === "trainer" ||
              profile.role === "nutritionist") && (
              <Link
                href="/professional-onboarding"
                className="border border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition text-center"
              >
                <div className="text-2xl mb-2">💼</div>
                <h4 className="font-medium text-gray-900">
                  Professional Profile
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Update bio and specialties
                </p>
              </Link>
            )}

            {(profile.role === "trainer" ||
              profile.role === "nutritionist") && (
              <Link
                href="/professionals/clients"
                className="border-2 border-blue-300 bg-linear-to-br from-blue-50 to-purple-50 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition text-center"
              >
                <div className="text-2xl mb-2">👥</div>
                <h4 className="font-medium text-gray-900">My Clients</h4>
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  Manage plans and track progress
                </p>
              </Link>
            )}

            {(profile.role === "trainer" ||
              profile.role === "nutritionist") && (
              <Link
                href="/dashboard/chat"
                className="border-2 border-indigo-300 bg-linear-to-br from-indigo-50 to-purple-50 rounded-lg p-4 hover:border-indigo-500 hover:shadow-lg transition text-center"
              >
                <div className="text-2xl mb-2">💬</div>
                <h4 className="font-medium text-gray-900">Messages</h4>
                <p className="text-xs text-indigo-600 mt-1 font-medium">
                  Chat with your clients
                </p>
              </Link>
            )}
          </div>
        </div>

        {/* Danger Zone - Delete Account */}
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200 mt-10">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Danger Zone
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Once you delete your account, there is no going back. This action
            will permanently delete your profile, all associated data, and
            remove your access to the platform.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition text-sm font-medium"
          >
            Delete My Account
          </button>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Delete Account
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                This action cannot be undone. This will permanently delete:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 mb-4">
                <li>Your profile information</li>
                <li>All {profile?.role} specific data</li>
                <li>Your authentication credentials</li>
                <li>Any progress or history</li>
              </ul>
              <p className="text-sm font-semibold text-red-600 mb-3">
                Type <span className="font-mono bg-gray-100 px-1">DELETE</span>{" "}
                to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={isDeleting}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition text-sm font-medium"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== "DELETE" || isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

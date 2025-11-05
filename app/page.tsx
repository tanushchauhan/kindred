import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Wellness Platform
          </h1>
          <p className="text-xl text-gray-600">
            Your journey to better health starts here
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link
            href="/auth/signin"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
            <p className="text-gray-600">
              Already have an account? Sign in to access your dashboard
            </p>
          </Link>

          <Link
            href="/auth/signup"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <div className="text-4xl mb-4">✨</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign Up</h2>
            <p className="text-gray-600">
              New here? Create an account to get started
            </p>
          </Link>
        </div>

        <div className="mb-8">
          <Link
            href="/professionals"
            className="block bg-linear-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 hover:shadow-xl transition transform hover:-translate-y-1 text-center"
          >
            <div className="text-4xl mb-4">💼</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Find Professionals
            </h2>
            <p className="text-blue-100">
              Browse verified trainers and nutritionists
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

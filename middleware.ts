import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware to handle CORS for mobile app requests
 * Allows cross-origin requests from React Native mobile app
 */
export function middleware(request: NextRequest) {
  // Get the origin from the request
  const origin = request.headers.get("origin");

  // List of allowed origins (add your mobile app origins here)
  const allowedOrigins = [
    "http://localhost:8081", // React Native dev server
    "http://localhost:19006", // Expo web
    "http://192.168.1.1:8081", // Add your computer's IP if needed
    "*", // Fallback for development
  ];

  // Determine which origin to allow
  let allowOrigin = "*";
  if (origin && allowedOrigins.includes(origin)) {
    allowOrigin = origin;
  } else if (origin && origin.startsWith("http://192.168.")) {
    // Allow any local network IP for development
    allowOrigin = origin;
  } else if (origin && origin.startsWith("http://10.0.")) {
    // Allow iOS simulator network
    allowOrigin = origin;
  }

  // Handle preflight OPTIONS requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Add CORS headers to all API responses
  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", allowOrigin);
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");

  return response;
}

// Apply middleware only to API routes
export const config = {
  matcher: "/api/:path*",
};

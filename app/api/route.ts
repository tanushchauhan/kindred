import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    const pkgRaw = fs.readFileSync(pkgPath, "utf8");
    const pkg = JSON.parse(pkgRaw || "{}");
    const version = pkg.version || "0.0.0";

    const greeting = "Hello developers! 👋 Welcome to Kindred.";
    const joke =
      "Why did the developer go broke? Because he used up all his cache. 😄";

    const payload = {
      branding: {
        name: "Kindred",
        tagLine: "A place to find your wellness family",
      },
      greeting,
      joke,
      version,
      timestamp: new Date().toISOString(),
      runtime: {
        node: process.version,
        env: process.env.NODE_ENV ?? "development",
      },
      notes: "This endpoint is intended for developer greetings & quick info.",
    };

    return NextResponse.json(payload);
  } catch (err) {
    const fallback = {
      branding: { name: "Kindred" },
      greeting: "Hello developers! 👋",
      joke: "Why do programmers prefer dark mode? Because light attracts bugs. 🐛",
      error: String(err),
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(fallback, { status: 200 });
  }
}

export const runtime = "nodejs";

/**
 * app/api/match/route.ts — FastAPI Proxy
 *
 * Forwards /api/match requests to the FastAPI backend.
 * This means the frontend never hardcodes localhost:8000 —
 * in production, set FASTAPI_URL to your deployed Python service URL.
 */
import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${FASTAPI_URL}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: "FastAPI error", detail: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    // FastAPI is probably not running
    if (err.code === "ECONNREFUSED") {
      return NextResponse.json(
        { error: "Recipe matcher service is offline. Make sure the Python backend is running." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const response = await fetch(`${FASTAPI_URL}/health`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ status: "offline" }, { status: 503 });
  }
}
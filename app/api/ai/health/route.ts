import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  return NextResponse.json({
    ok: true,
    openaiConfigured: Boolean(apiKey?.trim()),
    runtime,
    checkedAt: new Date().toISOString()
  });
}

import { NextResponse } from "next/server";
import { syncService } from "@/lib/server/services/syncService";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const userId = request.headers.get("x-apex-user-id")?.trim();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "missing_user_id" }, { status: 401 });
  }

  const body = (await request.json()) as unknown;
  const result = await syncService.applySnapshot({ ...(body as Record<string, unknown>), userId });

  return NextResponse.json({
    ok: true,
    ...result
  });
}

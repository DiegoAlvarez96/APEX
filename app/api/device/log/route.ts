import { NextResponse } from "next/server";
import { buildDeviceVisit, insertDeviceVisit, type DeviceClientPayload } from "@/lib/device";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(request: Request) {
  let client: DeviceClientPayload = {};
  try {
    client = (await request.json()) as DeviceClientPayload;
  } catch {
    client = {};
  }

  const visit = buildDeviceVisit(request, client);
  const result = await insertDeviceVisit(visit);
  return NextResponse.json(result, {
    status: result.ok ? 200 : 202,
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}

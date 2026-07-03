export type DeviceClientPayload = {
  path?: string;
  referrer?: string;
  language?: string;
  languages?: string[];
  timezone?: string;
  platform?: string;
  userAgent?: string;
  screen?: { width?: number; height?: number; colorDepth?: number; pixelDepth?: number };
  viewport?: { width?: number; height?: number };
  devicePixelRatio?: number;
  touchPoints?: number;
  standalone?: boolean;
};

export type DeviceVisit = {
  id?: string;
  visited_at?: string;
  ip?: string | null;
  user_agent?: string | null;
  browser?: string | null;
  browser_version?: string | null;
  os?: string | null;
  os_version?: string | null;
  device_type?: string | null;
  device_vendor?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  postal_code?: string | null;
  timezone?: string | null;
  language?: string | null;
  path?: string | null;
  referrer?: string | null;
  screen_width?: number | null;
  screen_height?: number | null;
  viewport_width?: number | null;
  viewport_height?: number | null;
  pixel_ratio?: number | null;
  platform?: string | null;
  is_pwa?: boolean | null;
  touch_points?: number | null;
  client_info?: Record<string, unknown>;
  headers_info?: Record<string, unknown>;
};

export function buildDeviceVisit(request: Request, client: DeviceClientPayload = {}): DeviceVisit {
  const headers = request.headers;
  const userAgent = client.userAgent || headers.get("user-agent") || "";
  const parsed = parseUserAgent(userAgent);
  const forwardedFor = headers.get("x-forwarded-for") ?? headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || null;

  return {
    ip,
    user_agent: userAgent || null,
    browser: parsed.browser,
    browser_version: parsed.browserVersion,
    os: parsed.os,
    os_version: parsed.osVersion,
    device_type: parsed.deviceType,
    device_vendor: parsed.deviceVendor,
    country: headers.get("x-vercel-ip-country"),
    region: headers.get("x-vercel-ip-country-region"),
    city: decodeHeader(headers.get("x-vercel-ip-city")),
    latitude: headers.get("x-vercel-ip-latitude"),
    longitude: headers.get("x-vercel-ip-longitude"),
    postal_code: headers.get("x-vercel-ip-postal-code"),
    timezone: client.timezone ?? null,
    language: client.language ?? headers.get("accept-language")?.split(",")[0] ?? null,
    path: client.path ?? null,
    referrer: client.referrer || headers.get("referer") || null,
    screen_width: toNumber(client.screen?.width),
    screen_height: toNumber(client.screen?.height),
    viewport_width: toNumber(client.viewport?.width),
    viewport_height: toNumber(client.viewport?.height),
    pixel_ratio: toNumber(client.devicePixelRatio),
    platform: client.platform ?? null,
    is_pwa: Boolean(client.standalone),
    touch_points: toNumber(client.touchPoints),
    client_info: compactObject({
      ...client,
      userAgent: undefined
    }),
    headers_info: compactObject({
      host: headers.get("host"),
      forwardedHost: headers.get("x-forwarded-host"),
      forwardedProto: headers.get("x-forwarded-proto"),
      vercelDeploymentUrl: headers.get("x-vercel-deployment-url"),
      vercelForwardedFor: headers.get("x-vercel-forwarded-for")
    })
  };
}

export async function insertDeviceVisit(visit: DeviceVisit) {
  const config = supabaseConfig();
  if (!config) return { ok: false, code: "supabase_not_configured" as const };

  const response = await fetch(`${config.url}/rest/v1/device_visits`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(visit)
  });

  if (!response.ok) {
    return { ok: false, code: "supabase_insert_failed" as const, status: response.status, detail: await response.text() };
  }
  return { ok: true as const };
}

export async function listDeviceVisits(limit = 200) {
  const config = supabaseConfig();
  if (!config) return { ok: false, code: "supabase_not_configured" as const, visits: [] as DeviceVisit[] };

  const safeLimit = Math.max(1, Math.min(limit, 500));
  const response = await fetch(`${config.url}/rest/v1/device_visits?select=*&order=visited_at.desc&limit=${safeLimit}`, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return { ok: false, code: "supabase_list_failed" as const, status: response.status, detail: await response.text(), visits: [] as DeviceVisit[] };
  }
  return { ok: true as const, visits: (await response.json()) as DeviceVisit[] };
}

export function isDevicePasswordValid(value: string | null | undefined) {
  const configured = process.env.DEVICE_LIST_PASSWORD?.trim();
  return Boolean(configured && value && value === configured);
}

export function devicePasswordConfigured() {
  return Boolean(process.env.DEVICE_LIST_PASSWORD?.trim());
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

function parseUserAgent(userAgent: string) {
  const browserMatch =
    userAgent.match(/Edg\/([\d.]+)/) ??
    userAgent.match(/CriOS\/([\d.]+)/) ??
    userAgent.match(/Chrome\/([\d.]+)/) ??
    userAgent.match(/Version\/([\d.]+).*Safari/) ??
    userAgent.match(/Firefox\/([\d.]+)/);
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /CriOS|Chrome\//.test(userAgent)
      ? "Chrome"
      : /Safari/.test(userAgent)
        ? "Safari"
        : /Firefox/.test(userAgent)
          ? "Firefox"
          : "Unknown";

  const osMatch =
    userAgent.match(/iPhone OS ([\d_]+)/) ??
    userAgent.match(/CPU OS ([\d_]+)/) ??
    userAgent.match(/Android ([\d.]+)/) ??
    userAgent.match(/Windows NT ([\d.]+)/) ??
    userAgent.match(/Mac OS X ([\d_]+)/);
  const os = /iPhone|iPad|iPod/.test(userAgent)
    ? "iOS"
    : /Android/.test(userAgent)
      ? "Android"
      : /Windows/.test(userAgent)
        ? "Windows"
        : /Mac OS X/.test(userAgent)
          ? "macOS"
          : "Unknown";
  const deviceType = /iPad|Tablet/.test(userAgent) ? "tablet" : /Mobile|iPhone|Android/.test(userAgent) ? "mobile" : "desktop";
  const deviceVendor = /iPhone|iPad|Macintosh/.test(userAgent) ? "Apple" : /Android/.test(userAgent) ? "Android" : null;

  return {
    browser,
    browserVersion: browserMatch?.[1]?.replace(/_/g, ".") ?? null,
    os,
    osVersion: osMatch?.[1]?.replace(/_/g, ".") ?? null,
    deviceType,
    deviceVendor
  };
}

function decodeHeader(value: string | null) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function compactObject(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== ""));
}

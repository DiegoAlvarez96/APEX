import { NextResponse } from "next/server";
import { devicePasswordConfigured, isDevicePasswordValid, listDeviceVisits, type DeviceVisit } from "@/lib/device";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const password = url.searchParams.get("password") ?? bearerPassword(request);
  return renderList(password);
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as { password?: string };
    return renderList(body.password ?? bearerPassword(request));
  }
  const formData = await request.formData();
  return renderList(String(formData.get("password") ?? ""));
}

async function renderList(password: string | null | undefined) {
  if (!devicePasswordConfigured()) {
    return htmlResponse(page("Configurar acceso", "<p>Falta configurar <code>DEVICE_LIST_PASSWORD</code> en Vercel.</p>"), 500);
  }

  if (!isDevicePasswordValid(password)) {
    return htmlResponse(loginPage(), 401);
  }

  const result = await listDeviceVisits();
  if (!result.ok) {
    return htmlResponse(page("Dispositivos", `<p>No se pudo leer Supabase: <code>${escapeHtml(result.code)}</code></p>`), 500);
  }

  return htmlResponse(page("Dispositivos", renderTable(result.visits)), 200);
}

function bearerPassword(request: Request) {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;
}

function loginPage() {
  return page(
    "Dispositivos",
    `<form method="post" class="panel">
      <label>Contraseña</label>
      <input name="password" type="password" autofocus />
      <button type="submit">Ingresar</button>
    </form>`
  );
}

function renderTable(visits: DeviceVisit[]) {
  if (!visits.length) return "<p>No hay dispositivos registrados todavia.</p>";
  const rows = visits
    .map(
      (visit) => `<tr>
        <td>${escapeHtml(formatDate(visit.visited_at))}</td>
        <td>${escapeHtml([visit.browser, visit.browser_version].filter(Boolean).join(" "))}<br/><small>${escapeHtml([visit.os, visit.os_version].filter(Boolean).join(" "))}</small></td>
        <td>${escapeHtml(visit.device_type ?? "-")}<br/><small>${escapeHtml(visit.device_vendor ?? "")}</small></td>
        <td>${escapeHtml([visit.city, visit.region, visit.country].filter(Boolean).join(", ") || "-")}<br/><small>${escapeHtml([visit.latitude, visit.longitude].filter(Boolean).join(", "))}</small></td>
        <td>${escapeHtml(visit.ip ?? "-")}</td>
        <td>${escapeHtml(visit.language ?? "-")}<br/><small>${escapeHtml(visit.timezone ?? "")}</small></td>
        <td>${escapeHtml(formatScreen(visit))}</td>
        <td><small>${escapeHtml(visit.path ?? "-")}</small></td>
      </tr>`
    )
    .join("");
  return `<div class="meta">${visits.length} registros recientes</div>
    <table>
      <thead>
        <tr><th>Fecha</th><th>Navegador</th><th>Dispositivo</th><th>Ubicacion</th><th>IP</th><th>Idioma/Zona</th><th>Pantalla</th><th>Ruta</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function page(title: string, body: string) {
  return `<!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)} - APEX</title>
        <style>
          body{margin:0;background:#0e0f12;color:#f5f5f5;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
          main{max-width:1180px;margin:0 auto;padding:24px}
          h1{font-size:28px;margin:0 0 18px}
          code{background:#202228;border-radius:6px;padding:2px 6px}
          .panel{display:grid;gap:10px;max-width:360px;background:#17191f;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px}
          input,button{height:42px;border-radius:10px;border:0;padding:0 12px;font:inherit}
          input{background:#fff;color:#111}
          button{background:#c7ff50;color:#111;font-weight:700;cursor:pointer}
          .meta{margin-bottom:12px;color:rgba(255,255,255,.55);font-size:13px}
          table{width:100%;border-collapse:collapse;background:#15171c;border-radius:12px;overflow:hidden}
          th,td{padding:10px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left;vertical-align:top;font-size:13px}
          th{color:rgba(255,255,255,.58);font-size:11px;text-transform:uppercase;letter-spacing:.08em}
          small{color:rgba(255,255,255,.48)}
        </style>
      </head>
      <body><main><h1>${escapeHtml(title)}</h1>${body}</main></body>
    </html>`;
}

function htmlResponse(body: string, status: number) {
  return new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0"
    }
  });
}

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-AR", { timeZone: "America/Buenos_Aires" });
}

function formatScreen(visit: DeviceVisit) {
  const screen = visit.screen_width && visit.screen_height ? `${visit.screen_width}x${visit.screen_height}` : "-";
  const viewport = visit.viewport_width && visit.viewport_height ? `${visit.viewport_width}x${visit.viewport_height}` : "-";
  return `${screen} / ${viewport}${visit.pixel_ratio ? ` @${visit.pixel_ratio}` : ""}`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

import { NextResponse } from "next/server";
import { addDiagEntry, getDiagEntries } from "@/lib/diag-log";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Diagnóstico temporário — confirma de verdade, em toda visita, se
// detectamos Android + navegador embutido corretamente, sem depender de
// interpretar telas do Clarity. Ver lib/diag-log.ts.
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`diag:${ip}`, 20, 60 * 1000);
  if (!limited.ok) return NextResponse.json({ ok: false }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.ua !== "string") return NextResponse.json({ ok: false }, { status: 400 });

  addDiagEntry({
    ua: body.ua.slice(0, 300),
    isAndroid: !!body.isAndroid,
    isInAppBrowser: !!body.isInAppBrowser,
    redirectAttempted: !!body.redirectAttempted,
    url: typeof body.url === "string" ? body.url.slice(0, 300) : "",
  });

  return NextResponse.json({ ok: true }, { status: 202 });
}

// Protegido por uma chave simples na query string (?key=), pra eu poder
// consultar direto sem expor esse log pra qualquer visitante.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== process.env.DIAG_LOG_KEY) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ entries: getDiagEntries() });
}

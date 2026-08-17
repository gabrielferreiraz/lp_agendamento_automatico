import { NextResponse } from "next/server";
import { appendDealNote, CrmApiError } from "@/lib/crm";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getRegisteredLead } from "@/lib/lead-registry";
import type { DealNoteRequest } from "@/types/lead";

export const dynamic = "force-dynamic";

const MAX_NOTE_LENGTH = 300;

// Usado pela opção "nenhum desses horários funciona pra mim" — texto
// livre que o lead escreve na etapa de agendamento, anotado na descrição
// do negócio que já existe (não cria agendamento nenhum, ver
// StepAgendamento). Best-effort: se falhar, o consultor ainda recebe a
// preferência via WhatsApp (ver /api/notify), essa rota é reforço, não a
// única via.
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`deal-note:${ip}`, 8, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Muitas tentativas" }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as DealNoteRequest | null;
  if (!body?.dealId || typeof body.note !== "string" || !body.note.trim()) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }
  if (body.note.length > MAX_NOTE_LENGTH) {
    return NextResponse.json({ error: "Texto muito longo" }, { status: 400 });
  }

  // Mesmo princípio do /api/notify: só aceita nota pra um negócio que
  // este servidor realmente criou via /api/lead.
  const registered = getRegisteredLead(body.dealId);
  if (!registered) {
    return NextResponse.json({ error: "Negócio não encontrado" }, { status: 404 });
  }

  try {
    await appendDealNote(body.dealId, body.note.trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/deal-note] falha ao anotar preferência de horário (endpoint do CRM pode ainda não existir)", err);
    if (err instanceof CrmApiError) return NextResponse.json({ error: "not_yet_supported" }, { status: 502 });
    return NextResponse.json({ error: "Erro inesperado" }, { status: 500 });
  }
}

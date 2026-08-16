import { NextResponse } from "next/server";
import { createAppointment, CrmApiError } from "@/lib/crm";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getRegisteredLead } from "@/lib/lead-registry";
import type { CreateAppointmentRequest } from "@/types/lead";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`appointments:${ip}`, 8, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Muitas tentativas, aguarde alguns minutos." }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } });
  }

  const body = (await req.json().catch(() => null)) as CreateAppointmentRequest | null;

  if (!body?.contactId || !body?.dealId || !DATE_RE.test(body.date ?? "") || !TIME_RE.test(body.time ?? "")) {
    return NextResponse.json({ error: "Dados incompletos para agendar" }, { status: 400 });
  }

  // `dealId` só pode ser um negócio que este mesmo servidor criou de
  // verdade via /api/lead — impede que alguém sem passar pelo formulário
  // fabrique um dealId qualquer só pra reservar/monopolizar os 5 slots do
  // dia (negando a vaga pra leads reais).
  const registered = getRegisteredLead(body.dealId);
  if (!registered || registered.contactId !== body.contactId) {
    return NextResponse.json({ error: "Negócio não encontrado" }, { status: 404 });
  }

  try {
    const result = await createAppointment(body);

    // Sinal mais valioso pro algoritmo de otimização do anúncio: o lead
    // não só preencheu o formulário, chegou a marcar reunião de verdade.
    if (body.eventId) {
      sendMetaCapiEvent({
        eventName: "Schedule",
        eventId: body.eventId,
        actionSourceUrl: req.headers.get("referer") ?? "",
        clientIp: ip,
        userAgent: req.headers.get("user-agent") ?? undefined,
        tracking: body.tracking,
      }).catch((err) => console.error("[api/appointments] falha ao mandar evento CAPI", err));
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof CrmApiError) {
      // 409 = alguém reservou esse horário entre o GET e este POST — o
      // front reconsulta /api/availability e mostra a grade atualizada.
      if (err.status === 409) {
        return NextResponse.json({ error: "slot_unavailable" }, { status: 409 });
      }
      if (err.status === 429) return NextResponse.json({ error: "Muitas tentativas, aguarde alguns instantes." }, { status: 429 });
      console.error("[api/appointments] CRM recusou", err.status, err.message);
      return NextResponse.json({ error: "Não foi possível confirmar o agendamento agora." }, { status: 502 });
    }
    console.error("[api/appointments] erro inesperado", err);
    return NextResponse.json({ error: "Erro inesperado" }, { status: 500 });
  }
}

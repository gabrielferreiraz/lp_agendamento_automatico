import { NextResponse } from "next/server";
import { createLeadDeal, CrmApiError } from "@/lib/crm";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { validateQualificationAnswers } from "@/lib/validation";
import { registerLead } from "@/lib/lead-registry";
import type { CreateLeadRequest, CreateLeadResponse } from "@/types/lead";

export const dynamic = "force-dynamic";

// Chamado assim que o passo 5 (dados de contato) é concluído — cria o
// contato + negócio no CRM na hora, independente do lead concluir ou não
// o agendamento depois (ver StepAgendamento). A notificação de WhatsApp
// é separada (/api/notify) e só dispara mais tarde.
export async function POST(req: Request) {
  // Rota pública, sem autenticação, alvo de anúncio pago — precisa de
  // limite próprio pra não virar porta de spam pro CRM (ver
  // lib/rate-limit.ts pro porquê de também existir um limite global).
  const ip = getClientIp(req);
  const limited = rateLimit(`lead:${ip}`, 8, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Muitas tentativas, aguarde alguns minutos." }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } });
  }

  const rawBody = (await req.json().catch(() => null)) as (CreateLeadRequest & Record<string, unknown>) | null;
  if (!rawBody) return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });

  const validated = validateQualificationAnswers(rawBody);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const { dealId, contactId } = await createLeadDeal(validated.answers, rawBody.tracking);
    registerLead(dealId, contactId, validated.answers);

    if (rawBody.eventId) {
      sendMetaCapiEvent({
        eventName: "Lead",
        eventId: rawBody.eventId,
        actionSourceUrl: req.headers.get("referer") ?? "",
        clientIp: ip,
        userAgent: req.headers.get("user-agent") ?? undefined,
        tracking: rawBody.tracking,
        userData: { phone: validated.answers.telefone, name: validated.answers.nome },
      }).catch((err) => console.error("[api/lead] falha ao mandar evento CAPI", err));
    }

    return NextResponse.json<CreateLeadResponse>({ dealId, contactId }, { status: 201 });
  } catch (err) {
    if (err instanceof CrmApiError) {
      if (err.status === 429) return NextResponse.json({ error: "Muitas tentativas, aguarde alguns instantes." }, { status: 429 });
      console.error("[api/lead] CRM recusou a criação do negócio", err.status, err.message);
      return NextResponse.json({ error: "Não foi possível registrar seus dados agora. Tente novamente." }, { status: 502 });
    }
    console.error("[api/lead] erro inesperado", err);
    return NextResponse.json({ error: "Erro inesperado" }, { status: 500 });
  }
}

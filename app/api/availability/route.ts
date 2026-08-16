import { NextResponse } from "next/server";
import { getAvailability, CrmApiError } from "@/lib/crm";
import { env } from "@/lib/env";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// GET simples, sem parâmetro — o consultor é fixo (Vinícius) enquanto só
// ele recebe leads. Quando entrar o 2º consultor, isso vira
// ?consultorId=... escolhido por regra de distribuição (round-robin, time,
// etc.), mas o contrato de resposta não muda.
export async function GET(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`availability:${ip}`, 20, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Muitas tentativas, aguarde um instante." }, { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } });
  }

  try {
    const availability = await getAvailability(env.crmOwnerId());
    return NextResponse.json(availability);
  } catch (err) {
    if (err instanceof CrmApiError) {
      if (err.status === 429) return NextResponse.json({ error: "Muitas tentativas, aguarde um instante." }, { status: 429 });
      console.error("[api/availability] CRM recusou", err.status, err.message);
      return NextResponse.json({ error: "Não foi possível carregar os horários agora." }, { status: 502 });
    }
    console.error("[api/availability] erro inesperado", err);
    return NextResponse.json({ error: "Erro inesperado" }, { status: 500 });
  }
}

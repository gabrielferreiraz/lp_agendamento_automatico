import { NextResponse } from "next/server";
import { notifyN8n } from "@/lib/n8n";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getRegisteredLead } from "@/lib/lead-registry";
import type { NotifyRequest } from "@/types/lead";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

// Alvo do `navigator.sendBeacon` (detecção de saída) e do `fetch` normal
// (confirmação de agendamento) — por isso aceita tanto JSON quanto o
// `text/plain` que o sendBeacon manda por padrão quando o Blob não tem
// `type` explícito.
export async function POST(req: Request) {
  // Generoso (dispara sozinho via timeout/beacon, sem ação humana repetida),
  // mas ainda limitado — sem isso um sendBeacon forjado em loop vira uma
  // fábrica infinita de mensagem de WhatsApp pro time.
  const ip = getClientIp(req);
  const limited = rateLimit(`notify:${ip}`, 20, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Muitas tentativas" }, { status: 429 });
  }

  const raw = await req.text();
  let body: NotifyRequest | null = null;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  if (!body?.dealId || typeof body.agendado !== "boolean") {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }
  if (body.agendado && (!DATE_RE.test(body.data ?? "") || !TIME_RE.test(body.hora ?? ""))) {
    return NextResponse.json({ error: "Data/hora inválida" }, { status: 400 });
  }

  // Ponto central da correção: NUNCA confiar no nome/telefone/respostas
  // que vieram no body — qualquer um pode chamar esta rota direto (é
  // pública, é o alvo do sendBeacon) e forjar um "lead" inteiro pra fazer
  // o n8n mandar uma mensagem inventada pro WhatsApp do Renan/Vinícius.
  // Os únicos dados que realmente importam pro conteúdo da mensagem vêm
  // do registro que só /api/lead consegue criar; do body só aceitamos
  // `agendado`/`data`/`hora`, que descrevem o que ACONTECEU nesta chamada,
  // não quem é o lead.
  const registered = getRegisteredLead(body.dealId);
  if (!registered) {
    return NextResponse.json({ error: "Negócio não encontrado" }, { status: 404 });
  }

  const payload: NotifyRequest = {
    ...registered.answers,
    dealId: body.dealId,
    contactId: registered.contactId,
    agendado: body.agendado,
    data: body.agendado ? body.data : undefined,
    hora: body.agendado ? body.hora : undefined,
    tracking: body.tracking,
  };

  // Sem `await`: quem chama isso via sendBeacon já não tem mais página pra
  // esperar resposta, e a confirmação de agendamento não deve travar a UI
  // esperando o WhatsApp sair — dispara e responde 202 na hora.
  notifyN8n(payload).catch((err) => console.error("[api/notify] falha ao notificar n8n", err));

  return NextResponse.json({ ok: true }, { status: 202 });
}

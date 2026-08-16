import { env } from "./env";
import type { NotifyRequest } from "@/types/lead";

// Dispara exatamente 1 vez por lead pro workflow "agendamento-lp" no n8n
// (Evolution API -> WhatsApp do Renan + Vinícius). O texto da mensagem é
// decidido lá dentro do n8n a partir do campo `agendado` — este arquivo só
// entrega o payload, nunca decide conteúdo de mensagem.
export async function notifyN8n(payload: NotifyRequest): Promise<void> {
  const res = await fetch(env.n8nWebhookUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    // Não relança: a notificação de WhatsApp nunca pode derrubar o
    // fluxo do lead (o negócio já foi criado no CRM antes disso). Só
    // fica registrado no log do servidor pra investigar depois.
    console.error(`[n8n] falha ao notificar (HTTP ${res.status}) — dealId=${payload.dealId}`);
  }
}

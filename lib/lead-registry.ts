import type { QualificationAnswers } from "@/types/lead";

// Memória server-side dos leads criados de verdade via /api/lead — existe
// só pra `/api/appointments` e `/api/notify` nunca precisarem confiar no
// que o cliente manda de volta sobre um lead. Sem isso, qualquer um podia
// chamar /api/notify direto com nome/motivo/dealId inventados e fazer o
// n8n mandar uma mensagem de WhatsApp forjada pro Renan/Vinícius como se
// fosse um lead real.
//
// Mesma ressalva do rate-limit.ts: em memória, single-instance. Aceitável
// aqui porque o ciclo de vida de um lead (preencher -> agendar ou desistir)
// dura minutos, nunca horas.

type RegisteredLead = { contactId: string; answers: QualificationAnswers; createdAt: number };

const registry = new Map<string, RegisteredLead>();
const TTL_MS = 2 * 60 * 60 * 1000; // 2h — folga generosa acima do timeout de 5min de inatividade da tela de agendamento

setInterval(
  () => {
    const now = Date.now();
    for (const [dealId, entry] of registry) {
      if (now - entry.createdAt > TTL_MS) registry.delete(dealId);
    }
  },
  30 * 60 * 1000,
).unref();

export function registerLead(dealId: string, contactId: string, answers: QualificationAnswers): void {
  registry.set(dealId, { contactId, answers, createdAt: Date.now() });
}

export function getRegisteredLead(dealId: string): RegisteredLead | undefined {
  const entry = registry.get(dealId);
  if (!entry) return undefined;
  if (Date.now() - entry.createdAt > TTL_MS) {
    registry.delete(dealId);
    return undefined;
  }
  return entry;
}

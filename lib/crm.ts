import { env } from "./env";
import { rateLimit } from "./rate-limit";
import type { AvailabilityResponse, QualificationAnswers, TrackingParams } from "@/types/lead";

// Cliente fino pra API v1 do CRM (crm.reoboteconsorcios.com.br/docs).
// Cada função aqui espelha 1 endpoint documentado — nenhuma lógica de
// negócio (cascata de dias, slots) mora aqui, isso é responsabilidade
// do próprio CRM. Este arquivo só sabe formar o request e tratar erro.

class CrmApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "CrmApiError";
  }
}

async function crmFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.crmApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.crmApiKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    // Nunca cachear: disponibilidade e criação de lead são sempre em
    // tempo real, um GET desatualizado aqui gera double-booking.
    cache: "no-store",
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.success) {
    const code = body?.error as string | undefined;
    throw new CrmApiError(code ?? `Falha ao chamar ${path} (HTTP ${res.status})`, res.status, code);
  }

  return body.data as T;
}

export { CrmApiError };

// Cota da API do CRM é por chave/organização, não por visitante — um
// ataque distribuído (várias origens, cada uma dentro do limite por IP
// das rotas em app/api/*) ainda conseguiria estourar o limite real do
// CRM (30 req/min em /deals e /appointments) e derrubar o formulário pra
// TODO mundo, inclusive leads legítimos. Isso reserva uma fatia abaixo do
// teto documentado e rejeita cedo (sem nem chamar o CRM) quando estourar,
// em vez de deixar o CRM devolver 429 pra gente descobrir na prática onde
// está o limite.
function assertGlobalCrmBudget(bucket: string, limit: number, windowMs: number) {
  const result = rateLimit(`global:crm:${bucket}`, limit, windowMs);
  if (!result.ok) {
    throw new CrmApiError("Limite de requisições ao CRM atingido, tente novamente em instantes", 429, "global_rate_limited");
  }
}

// O CRM tem uma condição de corrida conhecida (ver upsert-contact.ts no
// crm-reobote): dois POST /deals com o mesmo telefone quase ao mesmo
// tempo (ex: duplo toque no botão) podem os dois não encontrar um
// contato existente, os dois tentarem criar, e o segundo esbarrar na
// restrição de telefone único do banco. O próprio CRM devolve essa
// mensagem específica avisando que é seguro tentar de novo — então
// tentamos, automaticamente, sem o lead nunca ver o erro.
function isRetryableContactConflict(err: unknown): boolean {
  return err instanceof CrmApiError && err.status === 400 && err.message.includes("Conflito ao criar contato");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildDealDescription(answers: QualificationAnswers): string {
  // Vira a "descrição" do negócio no CRM — decisão do cliente foi não
  // mapear valor/faixa pra campos estruturados (a pessoa às vezes nem
  // sabe o valor exato), então tudo entra como texto legível aqui.
  return [
    `Valor de crédito buscado: ${answers.valorCredito}`,
    `Faixa de parcela ideal: ${answers.faixaParcela}`,
    `Prazo pra contratar: ${answers.prazo}`,
    `O que despertou o interesse: ${answers.motivo || "—"}`,
    answers.instagram ? `Instagram: @${answers.instagram.replace(/^@/, "")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function createLeadDeal(
  answers: QualificationAnswers,
  tracking?: TrackingParams,
): Promise<{ dealId: string; contactId: string }> {
  assertGlobalCrmBudget("deals", 25, 60_000); // teto real do CRM: 30/min

  const body = JSON.stringify({
    contact: {
      name: answers.nome,
      phone: answers.telefone,
      // Mandar também como `whatsapp` (mesmo valor) não é redundância — o
      // dedupe de contato do CRM (findDuplicateContact) só procura por
      // WhatsApp existente quando a própria chamada manda esse campo.
      // Como o CRM guarda todo telefone-só como WhatsApp internamente
      // ("todo celular também é WhatsApp"), mandar só `phone` faz toda
      // resposta buscar errado e nunca achar o contato que ele mesmo já
      // criou — aí tenta recriar e esbarra na trava de duplicidade
      // (era a causa real do "Conflito ao criar contato" persistente,
      // não uma corrida passageira). Mandando os dois campos, a busca
      // encontra certo desde a primeira vez.
      whatsapp: answers.telefone,
      source: "Landing page - Meta Ads",
    },
    ownerId: env.crmOwnerId(),
    description: buildDealDescription(answers),
    source: "Landing page - Meta Ads",
    ...(tracking?.campaignId || tracking?.adId || tracking?.adSetId
      ? {
          adAttribution: {
            campaignId: tracking.campaignId,
            adId: tracking.adId,
            adSetId: tracking.adSetId,
          },
        }
      : {}),
  });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const data = await crmFetch<{ id: string; contact: { id: string } }>("/api/v1/deals", { method: "POST", body });
      return { dealId: data.id, contactId: data.contact.id };
    } catch (err) {
      if (attempt === 2 || !isRetryableContactConflict(err)) throw err;
      await delay(300);
    }
  }
  // Inatingível (o loop acima sempre retorna ou lança) — só pra o TS ver
  // que a função sempre resolve ou rejeita em todo caminho.
  throw new CrmApiError("Falha ao criar negócio", 500);
}

export async function getAvailability(consultorId: string): Promise<AvailabilityResponse> {
  assertGlobalCrmBudget("availability", 50, 60_000); // teto real do CRM: 60/min

  return crmFetch<AvailabilityResponse>(`/api/v1/availability?consultorId=${encodeURIComponent(consultorId)}`);
}

export async function createAppointment(params: {
  contactId: string;
  dealId: string;
  date: string;
  time: string;
}): Promise<{ taskId: string; googleCalendarSynced: boolean }> {
  assertGlobalCrmBudget("appointments", 25, 60_000); // teto real do CRM: 30/min

  return crmFetch("/api/v1/appointments", {
    method: "POST",
    body: JSON.stringify({
      consultorId: env.crmOwnerId(),
      contactId: params.contactId,
      dealId: params.dealId,
      date: params.date,
      time: params.time,
    }),
  });
}

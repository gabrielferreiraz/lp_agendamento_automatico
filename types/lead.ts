// Tipos compartilhados entre o formulário (client) e as rotas internas
// (/api/*) que falam com CRM/n8n/Meta. Mantidos num único lugar pra
// front e back nunca divergirem sobre o formato do payload.

export const VALOR_CREDITO_OPTIONS = [
  "50 mil a 100 mil",
  "100 mil a 300 mil",
  "300 mil a 500 mil",
  "500 mil a 700 mil",
  "700 mil a 1 milhão",
  "Acima de 1 milhão",
] as const;

export const FAIXA_PARCELA_OPTIONS = ["300 a 500", "500 a 1000", "1000 a 3000", "3000 a 5000"] as const;

export const PRAZO_OPTIONS = [
  "Compra imediata",
  "Curto prazo (até 30 dias)",
  "Médio prazo (até 3 meses)",
  "Apenas pesquisando por enquanto",
] as const;

export type ValorCredito = (typeof VALOR_CREDITO_OPTIONS)[number];
export type FaixaParcela = (typeof FAIXA_PARCELA_OPTIONS)[number];
export type Prazo = (typeof PRAZO_OPTIONS)[number];

// Parâmetros de rastreio capturados da URL/cookies no carregamento da
// página — trafegam junto com o lead até o CRM (adAttribution/customFields)
// e até a Meta (Conversions API) pra fechar o loop de atribuição do anúncio.
export type TrackingParams = {
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  campaignId?: string;
  adId?: string;
  adSetId?: string;
};

// Respostas coletadas nos passos 1-5 do formulário (qualificação + contato).
export type QualificationAnswers = {
  valorCredito: ValorCredito;
  faixaParcela: FaixaParcela;
  prazo: Prazo;
  motivo: string;
  nome: string;
  telefone: string;
  instagram?: string;
};

// Body de POST /api/lead — chamado assim que o passo 5 é concluído.
export type CreateLeadRequest = QualificationAnswers & {
  tracking?: TrackingParams;
  // Gerado no client (crypto.randomUUID) e reaproveitado no `fbq('track',
  // 'Lead', {}, { eventID })` — permite a Meta deduplicar o evento do
  // Pixel com o da Conversions API mandado por /api/lead.
  eventId?: string;
};

export type CreateLeadResponse = {
  dealId: string;
  contactId: string;
};

// Body de POST /api/appointments (rota interna, faz proxy pro CRM).
export type CreateAppointmentRequest = {
  contactId: string;
  dealId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  tracking?: TrackingParams; // pro evento "Schedule" da Conversions API
  eventId?: string; // mesmo esquema de dedupe do CreateLeadRequest, mas pro evento "Schedule"
};

export type AvailabilitySlot = { time: string; available: boolean };

export type AvailabilityResponse = {
  date: string;
  timezone: string;
  slots: AvailabilitySlot[];
};

// Body de POST /api/notify — dispara a mensagem de WhatsApp via n8n.
// `agendado` é o campo que o workflow usa pra decidir o texto da mensagem.
export type NotifyRequest = QualificationAnswers & {
  dealId: string;
  contactId: string;
  agendado: boolean;
  data?: string; // YYYY-MM-DD, só quando agendado === true
  hora?: string; // HH:MM, só quando agendado === true
  tracking?: TrackingParams;
};

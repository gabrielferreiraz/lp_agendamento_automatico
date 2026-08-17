"use client";

// Campo Grande (MS) é sempre UTC-4 — o Brasil aboliu horário de verão em
// 2019, então esse offset nunca muda ao longo do ano (nada de tabela de
// transição pra manter). A API do CRM sempre devolve os horários nesse
// fuso (ver AvailabilityCalendarResponse.timezone) — esses helpers
// convertem pro fuso de quem está com a página aberta, detectado
// automaticamente pelo navegador, sem precisar perguntar nada pro lead.
const CRM_UTC_OFFSET = "-04:00";

function toInstant(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${CRM_UTC_OFFSET}`);
}

// "08:30" (Campo Grande) -> "09:30" pra quem está em Brasília/SP, por
// exemplo — sem isso, o lead de fora de MS/MT/RO/AM lê o horário errado
// e aparece atrasado (ou cedo demais) na call.
export function formatSlotTimeLocal(date: string, time: string): string {
  return toInstant(date, time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Formata só a data (sem horário específico de slot) — meio-dia UTC evita
// que o fuso empurre o resultado pro dia vizinho.
function dateAtNoonUTC(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function formatDateLabelLocal(date: string): string {
  return dateAtNoonUTC(date).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

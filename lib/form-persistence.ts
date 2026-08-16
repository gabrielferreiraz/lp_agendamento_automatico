"use client";

import type { ValorCredito, FaixaParcela, Prazo } from "@/types/lead";

const STORAGE_KEY = "reobote-lead-form-v1";
// Mesmo prazo do lead-registry no servidor (lib/lead-registry.ts) — não
// faz sentido guardar por mais tempo que isso no navegador, porque depois
// desse prazo o próprio servidor já esqueceu o `dealId` e recusaria
// retomar o agendamento de qualquer forma (ver /api/appointments,
// /api/notify).
const TTL_MS = 2 * 60 * 60 * 1000;

export type PersistedFormState = {
  savedAt: number;
  step: number;
  valorCredito?: ValorCredito;
  faixaParcela?: FaixaParcela;
  prazo?: Prazo;
  motivo: string;
  nome: string;
  telefone: string;
  instagram: string;
  consentimento: boolean;
  dealId: string | null;
  contactId: string | null;
  scheduled: { date: string; time: string } | null;
};

// localStorage (não sessionStorage) de propósito: um reload sem querer é
// só o caso mais óbvio, mas também cobre o lead que fecha a aba sem
// querer no meio do preenchimento e volta pelo mesmo link minutos depois
// — sem isso, ele perderia tudo de novo.
export function loadPersistedState(): PersistedFormState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedFormState;
    if (typeof parsed.savedAt !== "number" || Date.now() - parsed.savedAt > TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    // JSON corrompido, localStorage bloqueado (modo privado em alguns
    // navegadores), etc. — nunca deixa isso quebrar o formulário, só
    // degrada pra "sem estado salvo".
    return null;
  }
}

export function savePersistedState(state: Omit<PersistedFormState, "savedAt">): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
  } catch {
    // Idem — cota cheia ou storage indisponível não pode derrubar o form.
  }
}

export function clearPersistedState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignora
  }
}

"use client";

// fbq só existe depois que o script do Pixel carrega (ver
// components/MetaPixel.tsx) e só existe de verdade se o Pixel ID tiver
// sido configurado — por isso todo disparo aqui é best-effort e nunca
// quebra o formulário se `window.fbq` não existir.
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackPixelEvent(eventName: "Lead" | "Schedule" | "ViewContent", eventId?: string) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", eventName, {}, eventId ? { eventID: eventId } : undefined);
}

export function newEventId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

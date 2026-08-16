"use client";

import { useEffect, useRef } from "react";
import type { NotifyRequest } from "@/types/lead";

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Garante que o Renan/Vinícius sempre recebem um aviso sobre o lead, com
 * dois gatilhos (o que disparar primeiro vence):
 *   1. Saída da página (fecha aba / navega pra outro site) — via
 *      `pagehide` + `sendBeacon`, dispara quase na hora.
 *   2. 5 minutos sem confirmar o agendamento — rede de segurança pro caso
 *      do gatilho 1 não disparar (nem todo navegador/SO garante o evento
 *      de saída em segundo plano).
 *
 * Só arma quando `armed` é true (isto é, quando o lead já está na tela de
 * agendamento — antes disso não faz sentido avisar "não agendou", ele
 * ainda nem chegou lá). `markScheduled()` cancela os dois gatilhos quando
 * o agendamento é confirmado de verdade.
 */
export function useExitNotify(payload: NotifyRequest | null, armed: boolean) {
  const firedRef = useRef(false);
  const payloadRef = useRef(payload);

  // Mantém a ref sempre com o payload mais recente, sem mutar durante o
  // render (o efeito de baixo lê `payloadRef.current` de dentro de um
  // listener assíncrono, então precisa do valor mais atual sem precisar
  // re-registrar o listener a cada resposta digitada no formulário).
  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  useEffect(() => {
    if (!armed || !payloadRef.current) return;

    const fire = () => {
      if (firedRef.current || !payloadRef.current) return;
      firedRef.current = true;

      const body = JSON.stringify({ ...payloadRef.current, agendado: false });
      const blob = new Blob([body], { type: "application/json" });
      const sent = navigator.sendBeacon?.("/api/notify", blob);
      if (!sent) {
        // Fallback pra navegadores sem sendBeacon (raro) — `keepalive`
        // pede ao browser pra tentar completar o request mesmo se a
        // página estiver sendo descarregada.
        fetch("/api/notify", { method: "POST", body, keepalive: true }).catch(() => {});
      }
    };

    const onPageHide = () => fire();
    window.addEventListener("pagehide", onPageHide);
    const timeoutId = window.setTimeout(fire, INACTIVITY_TIMEOUT_MS);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.clearTimeout(timeoutId);
    };
  }, [armed, payload?.dealId]);

  return {
    markScheduled: () => {
      firedRef.current = true;
    },
  };
}

"use client";

import { useEffect, useRef } from "react";
import type { QualificationAnswers, TrackingParams } from "@/types/lead";

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

export function useAbandonedLead(
  payload: (QualificationAnswers & { tracking?: TrackingParams; eventId?: string }) | null,
  armed: boolean,
) {
  const firedRef = useRef(false);
  const payloadRef = useRef(payload);

  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  useEffect(() => {
    if (!armed || !payloadRef.current) return;

    const fire = () => {
      if (firedRef.current || !payloadRef.current) return;
      firedRef.current = true;

      const body = JSON.stringify(payloadRef.current);
      const blob = new Blob([body], { type: "application/json" });
      const sent = navigator.sendBeacon?.("/api/lead", blob);
      
      if (!sent) {
        fetch("/api/lead", { method: "POST", body, keepalive: true }).catch(() => {});
      }
    };

    const onPageHide = () => fire();
    window.addEventListener("pagehide", onPageHide);
    const timeoutId = window.setTimeout(fire, INACTIVITY_TIMEOUT_MS);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.clearTimeout(timeoutId);
    };
  }, [armed, payload?.telefone]); // payload?.telefone is a safe dependency to track if contact exists

  return {
    disarmAbandonedLead: () => {
      firedRef.current = true;
    },
  };
}

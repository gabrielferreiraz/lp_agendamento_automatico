"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { OptionCard } from "../OptionCard";
import { StepShell, PrimaryButton, BackLink } from "../StepShell";
import type { AvailabilityResponse } from "@/types/lead";

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

function formatDatePt(iso: string): string {
  const [y, mo, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "UTC" });
}

export function AgendamentoStep({
  step,
  total,
  onConfirm,
  onSkip,
  confirming,
  error,
}: {
  step: number;
  total: number;
  onConfirm: (date: string, time: string) => void;
  onSkip: () => void;
  confirming: boolean;
  error: string | null;
}) {
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  async function load() {
    setLoadError(null);
    setAvailability(null);
    try {
      const res = await fetch("/api/availability", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data: AvailabilityResponse = await res.json();
      setAvailability(data);
    } catch {
      setLoadError("Não conseguimos carregar os horários agora.");
    }
  }

  useEffect(() => {
    // `load` busca a grade de horários (sistema externo, a API do CRM) —
    // as chamadas de setState lá dentro só acontecem depois do `await
    // fetch`, nunca de forma síncrona durante este efeito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  // Slot ficou indisponível entre o carregamento e a confirmação (outro
  // lead reservou primeiro) — recarrega a grade automaticamente.
  useEffect(() => {
    if (error === "slot_unavailable") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTime(null);
      load();
    }
  }, [error]);

  return (
    <StepShell
      step={step}
      total={total}
      title="Qual o melhor horário pra falarmos com você?"
      subtitle={availability ? `Próxima data disponível: ${formatDatePt(availability.date)}` : undefined}
      footer={
        <>
          <PrimaryButton
            onClick={() => availability && selectedTime && onConfirm(availability.date, selectedTime)}
            disabled={!selectedTime}
            loading={confirming}
          >
            Confirmar horário
          </PrimaryButton>
          <BackLink onClick={onSkip} label="Prefiro que me chamem sem marcar horário" />
        </>
      }
    >
      {!availability && !loadError && (
        <div className="flex justify-center py-6">
          <svg className="h-6 w-6 animate-spin text-white/50" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      )}

      {loadError && (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-sm text-white/60">{loadError}</p>
          <button onClick={load} className="text-sm font-medium text-blue-300 underline underline-offset-2 cursor-pointer">
            Tentar de novo
          </button>
        </div>
      )}

      {availability && (
        <m.div className="flex flex-col gap-3" variants={listVariants} initial="hidden" animate="show">
          {availability.slots.map((slot) => (
            <m.div key={slot.time} variants={itemVariants}>
              <OptionCard
                label={slot.available ? slot.time : `${slot.time} · indisponível`}
                selected={selectedTime === slot.time}
                onClick={() => slot.available && setSelectedTime(slot.time)}
              />
            </m.div>
          ))}
          {error && error !== "slot_unavailable" && <p className="text-sm text-rose-300">{error}</p>}
        </m.div>
      )}

      <p className="mt-4 text-center text-xs text-white/40">
        Você poderá marcar apenas o próximo dia útil, pra garantir que a conversa aconteça rápido.
      </p>
    </StepShell>
  );
}

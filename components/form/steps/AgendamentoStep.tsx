"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { OptionCard } from "../OptionCard";
import { CalendarPicker } from "../CalendarPicker";
import { StepShell, PrimaryButton, BackLink } from "../StepShell";
import { formatSlotTimeLocal, formatDateLabelLocal } from "@/lib/timezone";
import type { AvailabilityCalendarResponse } from "@/types/lead";

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function AgendamentoStep({
  step,
  total,
  onConfirm,
  onOutroHorario,
  confirming,
  savingOutro,
  error,
}: {
  step: number;
  total: number;
  onConfirm: (date: string, time: string) => void;
  onOutroHorario: (texto: string) => void;
  confirming: boolean;
  savingOutro: boolean;
  error: string | null;
}) {
  const [calendar, setCalendar] = useState<AvailabilityCalendarResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showOutro, setShowOutro] = useState(false);
  const [outroTexto, setOutroTexto] = useState("");

  async function load() {
    setLoadError(null);
    setCalendar(null);
    setSelectedTime(null);
    try {
      const res = await fetch("/api/availability", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data: AvailabilityCalendarResponse = await res.json();
      setCalendar(data);
      // Pré-seleciona o primeiro dia com vaga — o lead já vê horários sem
      // precisar tocar no calendário antes, mas ainda pode trocar pro
      // outro dia se preferir.
      const firstAvailable = data.days.find((d) => d.hasAvailability);
      setSelectedDate(firstAvailable?.date ?? data.days[0]?.date ?? null);
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
  // lead reservou primeiro) — recarrega o calendário automaticamente.
  useEffect(() => {
    if (error === "slot_unavailable") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTime(null);
      load();
    }
  }, [error]);

  const selectedDay = calendar?.days.find((d) => d.date === selectedDate) ?? null;

  return (
    <StepShell
      step={step}
      total={total}
      title="Qual o melhor horário pra falarmos com você?"
      subtitle={selectedDate ? formatDateLabelLocal(selectedDate) : undefined}
      footer={
        !showOutro ? (
          <>
            <PrimaryButton
              onClick={() => selectedDate && selectedTime && onConfirm(selectedDate, selectedTime)}
              disabled={!selectedTime}
              loading={confirming}
            >
              Confirmar horário
            </PrimaryButton>
            <BackLink onClick={() => setShowOutro(true)} label="Nenhum desses horários funciona pra mim" />
          </>
        ) : (
          <>
            <PrimaryButton onClick={() => onOutroHorario(outroTexto)} loading={savingOutro}>
              Enviar
            </PrimaryButton>
            <BackLink onClick={() => setShowOutro(false)} label="Voltar pros horários" />
          </>
        )
      }
    >
      {showOutro ? (
        <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <p className="mb-3 text-sm text-white/60">Tudo bem — nos diga um dia e horário melhor pra você que o consultor tenta se ajustar.</p>
          <textarea
            autoFocus
            value={outroTexto}
            onChange={(e) => setOutroTexto(e.target.value)}
            placeholder="Ex: quinta à tarde, ou depois das 18h..."
            rows={4}
            maxLength={300}
            className="w-full resize-none rounded-2xl border border-white/12 bg-white/5 px-4 py-3.5 text-[15px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-blue-400/60 focus:bg-white/[0.07]"
          />
        </m.div>
      ) : (
        <>
          {!calendar && !loadError && (
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

          {calendar && (
            <div className="flex flex-col gap-5">
              <CalendarPicker
                availableDays={calendar.days.map((d) => ({ date: d.date, hasAvailability: d.hasAvailability }))}
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setSelectedTime(null);
                }}
              />

              {selectedDay && selectedDay.hasAvailability ? (
                <m.div className="flex flex-col gap-3" variants={listVariants} initial="hidden" animate="show">
                  {selectedDay.slots.map((slot) => (
                    <m.div key={slot.time} variants={itemVariants}>
                      <OptionCard
                        label={slot.available ? formatSlotTimeLocal(selectedDay.date, slot.time) : `${formatSlotTimeLocal(selectedDay.date, slot.time)} · indisponível`}
                        selected={selectedTime === slot.time}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                      />
                    </m.div>
                  ))}
                </m.div>
              ) : (
                <p className="text-center text-sm text-white/50">Sem horários livres nesse dia — escolha o outro dia em destaque no calendário.</p>
              )}

              {error && error !== "slot_unavailable" && <p className="text-sm text-rose-300">{error}</p>}
            </div>
          )}
        </>
      )}
    </StepShell>
  );
}

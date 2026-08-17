"use client";

import { m } from "framer-motion";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function CalendarPicker({
  availableDays,
  selectedDate,
  onSelectDate,
}: {
  availableDays: { date: string; hasAvailability: boolean }[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}) {
  // Sempre o mês de "hoje" no aparelho de quem está vendo — só os 2 dias
  // que vieram da API (ver availableDays) acendem, o resto do mês é só
  // pra dar contexto visual de calendário de verdade, nunca clicável.
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const availableMap = new Map(availableDays.map((d) => [d.date, d.hasAvailability]));

  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-white/35">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => {
          if (!day) return <span key={`empty-${i}`} />;

          const dateKey = toDateKey(year, month, day);
          const isAvailable = availableMap.get(dateKey) === true;
          const isSelected = selectedDate === dateKey;

          return (
            <m.button
              key={dateKey}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelectDate(dateKey)}
              whileTap={isAvailable ? { scale: 0.92 } : undefined}
              className={[
                "aspect-square rounded-lg text-[13px] font-medium transition-colors",
                isSelected
                  ? "bg-blue-500 text-white"
                  : isAvailable
                    ? "bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25 cursor-pointer"
                    : "bg-transparent text-white/20 cursor-not-allowed",
              ].join(" ")}
            >
              {day}
            </m.button>
          );
        })}
      </div>
    </div>
  );
}

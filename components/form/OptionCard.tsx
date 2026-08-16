import { AnimatePresence, m } from "framer-motion";

export function OptionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <m.button
      type="button"
      onClick={onClick}
      data-selected={selected}
      whileHover={{ scale: 1.012 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="glass-option flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left text-[15px] font-medium text-white/90 cursor-pointer"
    >
      <span>{label}</span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected ? "border-blue-400 bg-blue-400" : "border-white/30"
        }`}
      >
        <AnimatePresence>
          {selected && (
            <m.svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-3 w-3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <path d="M5 13l4 4L19 7" stroke="#0b1220" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </m.svg>
          )}
        </AnimatePresence>
      </span>
    </m.button>
  );
}

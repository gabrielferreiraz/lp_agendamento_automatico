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
    <button
      type="button"
      onClick={onClick}
      data-selected={selected}
      className="option flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left text-[15px] font-medium text-white/90 cursor-pointer"
    >
      <span>{label}</span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? "border-blue-400 bg-blue-400" : "border-white/30"
        }`}
      >
        {selected && (
          <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
            <path d="M5 13l4 4L19 7" stroke="#0b1220" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}

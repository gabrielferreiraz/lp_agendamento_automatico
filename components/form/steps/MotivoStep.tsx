import { StepShell, PrimaryButton, BackLink } from "../StepShell";

export function MotivoStep({
  step,
  total,
  value,
  onChange,
  onNext,
  onBack,
}: {
  step: number;
  total: number;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <StepShell
      step={step}
      total={total}
      title="Conte um pouco o que despertou seu interesse pelo consórcio"
      footer={
        <>
          <PrimaryButton onClick={onNext} disabled={value.trim().length < 3}>
            Continuar
          </PrimaryButton>
          <BackLink onClick={onBack} />
        </>
      }
    >
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Insira sua resposta."
        rows={4}
        className="w-full resize-none rounded-2xl border border-white/12 bg-white/5 px-4 py-3.5 text-[15px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-blue-400/60 focus:bg-white/[0.07]"
      />
    </StepShell>
  );
}

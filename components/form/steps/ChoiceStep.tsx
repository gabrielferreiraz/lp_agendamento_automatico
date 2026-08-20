import { OptionCard } from "../OptionCard";
import { StepShell, PrimaryButton, BackLink } from "../StepShell";

export function ChoiceStep<T extends string>({
  step,
  total,
  title,
  options,
  value,
  onChange,
  onNext,
  onBack,
}: {
  step: number;
  total: number;
  title: string;
  options: readonly T[];
  value: T | undefined;
  onChange: (v: T) => void;
  onNext: () => void;
  onBack?: () => void;
}) {
  return (
    <StepShell
      step={step}
      total={total}
      title={title}
      footer={
        <>
          <PrimaryButton onClick={onNext} disabled={!value}>
            Continuar
          </PrimaryButton>
          {onBack && <BackLink onClick={onBack} />}
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {options.map((opt) => (
          <OptionCard key={opt} label={opt} selected={value === opt} onClick={() => onChange(opt)} />
        ))}
      </div>
    </StepShell>
  );
}

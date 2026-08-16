import { m } from "framer-motion";
import { OptionCard } from "../OptionCard";
import { StepShell, PrimaryButton, BackLink } from "../StepShell";

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

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
      <m.div className="flex flex-col gap-3" variants={listVariants} initial="hidden" animate="show">
        {options.map((opt) => (
          <m.div key={opt} variants={itemVariants}>
            <OptionCard label={opt} selected={value === opt} onClick={() => onChange(opt)} />
          </m.div>
        ))}
      </m.div>
    </StepShell>
  );
}

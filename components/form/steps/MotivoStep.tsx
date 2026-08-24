import { StepShell, PrimaryButton, BackLink } from "../StepShell";

export function MotivoStep({
  step,
  total,
  value,
  onChange,
  onNext,
  loading = false,
}: {
  step: number;
  total: number;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  loading?: boolean;
}) {
  return (
    <StepShell
      step={step}
      total={total}
      title="Conte um pouco o que despertou seu interesse pelo consórcio"
      footer={
        <PrimaryButton onClick={onNext} disabled={value.trim().length < 3} loading={loading}>
          Continuar
        </PrimaryButton>
      }
    >
      {/* Sem autoFocus de propósito — abrir o teclado sozinho bem na hora
          da transição de etapa (junto com o layout ainda se ajustando)
          era o que fazia o teclado cobrir a caixa de texto no celular.
          O toque manual do lead pra focar já dá tempo do layout assentar
          antes do teclado subir. */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Insira sua resposta."
        rows={4}
        className="w-full resize-none rounded-2xl border border-white/12 bg-white/5 px-4 py-3.5 text-[15px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-blue-400/60 focus:bg-white/[0.07]"
      />
    </StepShell>
  );
}

import type { ReactNode } from "react";
import { StepShell, PrimaryButton, BackLink } from "../StepShell";

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function ContatoStep({
  step,
  total,
  nome,
  telefone,
  instagram,
  consentimento,
  onChangeNome,
  onChangeTelefone,
  onChangeInstagram,
  onChangeConsentimento,
  onNext,
  onBack,
  loading,
  error,
}: {
  step: number;
  total: number;
  nome: string;
  telefone: string;
  instagram: string;
  consentimento: boolean;
  onChangeNome: (v: string) => void;
  onChangeTelefone: (v: string) => void;
  onChangeInstagram: (v: string) => void;
  onChangeConsentimento: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}) {
  const telefoneDigits = telefone.replace(/\D/g, "");
  const canSubmit = nome.trim().length >= 3 && telefoneDigits.length >= 10 && consentimento;

  return (
    <StepShell
      step={step}
      total={total}
      title="Informações de contato"
      subtitle="Falta apenas um passo"
      footer={
        <>
          <PrimaryButton onClick={onNext} disabled={!canSubmit} loading={loading}>
            Continuar
          </PrimaryButton>
          <BackLink onClick={onBack} />
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Nome completo">
          <input
            autoFocus
            name="name"
            autoComplete="name"
            value={nome}
            onChange={(e) => onChangeNome(e.target.value)}
            placeholder="Insira sua resposta."
            className="field-input"
          />
        </Field>
        <Field label="Telefone (WhatsApp)">
          <input
            type="tel"
            name="tel"
            autoComplete="tel"
            inputMode="tel"
            value={telefone}
            onChange={(e) => onChangeTelefone(formatPhone(e.target.value))}
            placeholder="(67) 99999-9999"
            className="field-input"
          />
        </Field>
        <Field label="Instagram (opcional)">
          <input
            name="instagram"
            autoComplete="off"
            value={instagram}
            onChange={(e) => onChangeInstagram(e.target.value)}
            placeholder="@seuusuario"
            className="field-input"
          />
        </Field>

        <label className="mt-1 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-white/60">
          <input
            type="checkbox"
            checked={consentimento}
            onChange={(e) => onChangeConsentimento(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-blue-500"
          />
          <span>
            Autorizo a Reobote Consórcios a entrar em contato comigo por telefone e WhatsApp e a tratar meus dados
            conforme a{" "}
            <a href="/privacidade" target="_blank" className="underline underline-offset-2 hover:text-white/90">
              Política de Privacidade
            </a>
            .
          </span>
        </label>

        {error && <p className="text-sm text-rose-300">{error}</p>}
      </div>

      <style jsx>{`
        :global(.field-input) {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.875rem 1rem;
          font-size: 15px;
          color: white;
          outline: none;
          transition:
            border-color 150ms ease,
            background-color 150ms ease;
        }
        :global(.field-input::placeholder) {
          color: rgba(255, 255, 255, 0.35);
        }
        :global(.field-input:focus) {
          border-color: rgba(96, 165, 250, 0.6);
          background: rgba(255, 255, 255, 0.07);
        }
      `}</style>
    </StepShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-white/50">{label}</span>
      {children}
    </label>
  );
}

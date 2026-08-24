import { VALOR_CREDITO_OPTIONS, type QualificationAnswers } from "@/types/lead";

const MAX_NAME_LENGTH = 120;
const MAX_INSTAGRAM_LENGTH = 60;
const MAX_MOTIVO_LENGTH = 500;

// `/api/lead` é uma rota pública, sem autenticação — nada garante que o
// body veio mesmo do nosso formulário. Isso valida no servidor o que o
// client só valida na UI (que qualquer um pode ignorar com um POST
// direto): as 3 perguntas de múltipla escolha precisam bater com uma das
// opções reais, e os campos livres têm um teto de tamanho, pra não deixar
// texto arbitrário/gigante entrar sem controle na descrição do negócio no
// CRM (visível pra quem for atender o lead).
export function validateQualificationAnswers(body: unknown): { ok: true; answers: QualificationAnswers } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Corpo inválido" };
  const b = body as Record<string, unknown>;

  if (typeof b.nome !== "string" || b.nome.trim().length < 2 || b.nome.length > MAX_NAME_LENGTH) {
    return { ok: false, error: "Nome inválido" };
  }

  if (typeof b.telefone !== "string") return { ok: false, error: "Telefone inválido" };
  const phoneDigits = b.telefone.replace(/\D/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 13) return { ok: false, error: "Telefone inválido" };

  if (!(VALOR_CREDITO_OPTIONS as readonly string[]).includes(b.valorCredito as string)) {
    return { ok: false, error: "Valor de crédito inválido" };
  }
  if (b.motivo !== undefined && (typeof b.motivo !== "string" || b.motivo.length > MAX_MOTIVO_LENGTH)) {
    return { ok: false, error: "Motivo inválido" };
  }

  if (b.instagram !== undefined && (typeof b.instagram !== "string" || b.instagram.length > MAX_INSTAGRAM_LENGTH)) {
    return { ok: false, error: "Instagram inválido" };
  }

  return {
    ok: true,
    answers: {
      nome: b.nome.trim(),
      telefone: b.telefone,
      valorCredito: b.valorCredito as QualificationAnswers["valorCredito"],
      motivo: (b.motivo as string | undefined)?.trim() || undefined,
      instagram: (b.instagram as string | undefined)?.trim() || undefined,
    },
  };
}

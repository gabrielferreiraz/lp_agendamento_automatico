import { m } from "framer-motion";

// Progresso "mentiroso", de propósito — mesmo truque de barra de VSL: salta
// bem rápido nas primeiras perguntas (fáceis, de múltipla escolha) pra
// prender o lead logo de cara com a sensação de "já fiz quase tudo", e vai
// desacelerando conforme chega nas perguntas que dão mais trabalho (texto
// livre, contato, agendamento) — só fecha em 100% na última etapa de
// verdade. Não é proporcional a `step/total`; é uma curva calibrada a dedo
// pro gatilho de "falta pouquinho, não vale a pena parar agora".
const FAKE_PROGRESS_BY_STEP = [35, 55, 70, 80, 88, 94, 100];

export function ProgressBar({ step }: { step: number; total: number }) {
  const pct = FAKE_PROGRESS_BY_STEP[step] ?? 100;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <m.div
        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-emerald-400"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 140, damping: 22 }}
      />
    </div>
  );
}

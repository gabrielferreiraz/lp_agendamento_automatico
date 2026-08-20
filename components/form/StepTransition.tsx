import type { ReactNode } from "react";

// Troca de etapa instantânea, sem animação — removida de propósito depois
// de ver no Clarity/heatmap sinais de que o app não estava terminando de
// renderizar/responder num bom tanto de aparelhos (navegador embutido do
// Facebook em celular mais limitado). `step` como key ainda garante que o
// React trata cada etapa como uma árvore nova (útil pra resetar estado
// local dos componentes de etapa), só que sem custo de animação nenhum.
export function StepTransition({ step, children }: { step: number; children: ReactNode }) {
  return <div key={step}>{children}</div>;
}

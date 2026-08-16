"use client";

import { AnimatePresence, m, type Variants } from "framer-motion";
import type { ReactNode } from "react";

// Sem `scale` de propósito: o cartão de vidro (`.glass-card`) tem
// `backdrop-filter`, e animar blur + transform junto é o combo mais caro
// de GPU que existe em CSS — visível como travadinha em celular
// intermediário (relatado num Galaxy A35). Só `x` + `opacity` já lê como
// "deslizou e trocou" sem esse custo.
const variants: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -28 : 28 }),
};

// `step` como key força o React a trocar a árvore inteira a cada passo, o
// que é justamente o que dá pro AnimatePresence perceber "isso saiu, isso
// entrou" e animar os dois lados da troca (não só o que chega).
//
// `mode="wait"` em vez de "popLayout": o cartão que sai termina de sumir
// antes do próximo começar a aparecer — nunca dois `.glass-card` com
// blur animando ao mesmo tempo na tela (que é o pico de custo de GPU
// desse componente). Custa uma pausa de ~90ms entre um sumir e o outro
// aparecer, imperceptível na prática, mas corta o pico de trabalho da
// GPU praticamente pela metade no momento exato da troca.
export function StepTransition({ step, direction, children }: { step: number; direction: number; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait" custom={direction} initial={false}>
      <m.div
        key={step}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}

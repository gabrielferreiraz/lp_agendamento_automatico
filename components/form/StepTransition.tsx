"use client";

import { AnimatePresence, m, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const variants: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 36 : -36, scale: 0.98 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -36 : 36, scale: 0.98 }),
};

// `step` como key força o React a trocar a árvore inteira a cada passo, o
// que é justamente o que dá pro AnimatePresence perceber "isso saiu, isso
// entrou" e animar os dois lados da troca (não só o que chega).
export function StepTransition({ step, direction, children }: { step: number; direction: number; children: ReactNode }) {
  return (
    <AnimatePresence mode="popLayout" custom={direction} initial={false}>
      <m.div
        key={step}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}

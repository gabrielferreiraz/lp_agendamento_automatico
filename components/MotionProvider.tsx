"use client";

import { LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

// Precisa ser um Client Component à parte: `layout.tsx` é Server Component,
// e passar a função `features` direto de lá pro LazyMotion quebra o build
// (função não é serializável através da fronteira server/client — só
// `children` pode atravessar).
const loadMotionFeatures = () => import("@/lib/motion-features").then((mod) => mod.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadMotionFeatures}>
      {/* "user": respeita o SO quando a pessoa pede menos movimento, sem
          precisar checar isso em cada componente que usa m.*. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

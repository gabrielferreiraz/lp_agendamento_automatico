"use client";

// Bundle de features do framer-motion carregado à parte (chunk separado,
// buscado em paralelo, fora do JS crítico da primeira renderização) — é
// o que o `LazyMotion` em app/layout.tsx importa sob demanda. `domAnimation`
// cobre tudo que este formulário usa (spring, gestos de hover/tap,
// AnimatePresence, animação de path de SVG); não precisa do pacote maior
// `domMax` (que adiciona drag/layout animation, que não usamos).
export { domAnimation as default } from "framer-motion";

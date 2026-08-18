"use client";

import { useEffect } from "react";

// As manchas de fundo e o brilho da borda do cartão rodam pra sempre
// (`infinite`) — gasto constante de GPU/bateria mesmo com ninguém
// olhando. Suspeita levantada pelo padrão visto no Clarity (sessões que
// ficam "ocultas" pouco depois de carregar, sem nenhuma interação): em
// celular com economia de bateria agressiva, esse gasto contínuo pode
// contribuir pro Android/navegador embutido jogar a aba pra trás. Isso
// não resolve a causa raiz (é instabilidade do navegador embutido do
// Facebook, fora do nosso controle), mas corta uma fonte de consumo
// constante que está inteiramente sob nosso controle.
export function PauseAnimationsWhenHidden() {
  useEffect(() => {
    const apply = () => {
      document.documentElement.classList.toggle("page-hidden", document.hidden);
    };
    apply();
    document.addEventListener("visibilitychange", apply);
    return () => document.removeEventListener("visibilitychange", apply);
  }, []);

  return null;
}

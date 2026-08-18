"use client";

import { useEffect } from "react";

// Convenção do Next.js: qualquer erro de render dentro desta rota cai
// aqui em vez de deixar a página em branco morto. Descoberto via
// Clarity: ~10% das sessões (a maioria vindo do navegador embutido do
// Facebook/Instagram) tinham erro de JS e a tela ficava vazia, sem
// nenhuma chance de recuperação — o lead simplesmente não via nada e
// desistia. Isso não corrige a causa (uma instabilidade conhecida desse
// navegador embutido, fora do nosso controle), mas garante que sempre
// sobra alguma coisa na tela pra tentar de novo.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app/error] erro de render capturado", error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <div className="glass-card w-full max-w-md p-8">
        <h2 className="text-xl font-semibold text-white">Algo não carregou direito</h2>
        <p className="mt-2 text-sm text-white/60">
          Isso pode acontecer dependendo do aplicativo usado pra abrir esta página. Toque no botão abaixo pra tentar de novo.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 cursor-pointer"
        >
          Tentar de novo
        </button>
      </div>
    </main>
  );
}

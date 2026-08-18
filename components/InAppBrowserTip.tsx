"use client";

import { useEffect, useState } from "react";

// Detecta o navegador embutido do Facebook/Instagram (User-Agent traz
// "FBAN"/"FBAV"/"FB_IAB" ou "Instagram") — é de onde vem a maior parte
// do tráfego de anúncio, e também de onde vêm os erros de JS
// instáveis (ver Clarity: "error invoking postmessage: java object is
// gone", específico desse navegador). Não corrige o bug em si (é do
// app do Facebook, fora do nosso controle), só dá uma saída visível pra
// quem travar — abrir no navegador padrão do celular resolve na maioria
// dos casos, e essa opção já existe dentro do próprio menu "⋯" do
// Facebook, só não é óbvia pra quem não conhece.
export function InAppBrowserTip() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isInAppBrowser = /FBAN|FBAV|FB_IAB|Instagram/i.test(ua);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShow(isInAppBrowser);
  }, []);

  if (!show) return null;

  return (
    <div className="mb-4 w-full max-w-md rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-center text-xs text-amber-200/90">
      Se a página travar, toque em <span className="font-semibold">⋯</span> no topo e escolha{" "}
      <span className="font-semibold">&quot;Abrir no navegador&quot;</span>.
    </div>
  );
}

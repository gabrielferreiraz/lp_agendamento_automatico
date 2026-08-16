import Script from "next/script";

// Só renderiza alguma coisa quando META_PIXEL_ID estiver configurado —
// enquanto não tiver, o componente simplesmente não injeta nada (sem
// quebrar o build, sem erro no console). Assim que a variável for
// preenchida, o rastreamento liga sozinho, sem precisar mexer em código.
//
// De propósito SEM prefixo `NEXT_PUBLIC_`: esse valor nunca é lido do lado
// do navegador (o componente é Server Component, roda só no servidor e
// escreve o ID direto no HTML/script que manda pro cliente — o resultado
// final é público de qualquer jeito, não tem nada "secreto" aqui). Um
// `NEXT_PUBLIC_*` só funciona se existir NO MOMENTO DO BUILD da imagem
// Docker, o que exige configuração especial de "build arg" na
// hospedagem; uma env var comum, lida em cada request (graças ao
// `force-dynamic` no layout), funciona com qualquer painel que só ofereça
// "Environment Variables" normais — sem depender de achar uma opção
// específica de build.
export function MetaPixel() {
  const pixelId = process.env.META_PIXEL_ID;
  if (!pixelId) return null;

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

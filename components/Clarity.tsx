import Script from "next/script";

// Mesmo padrão do MetaPixel.tsx: variável sem prefixo NEXT_PUBLIC_, lida
// a cada request (o layout já é dynamic="force-dynamic") — funciona só
// configurando como env var normal, sem precisar de build arg. Sem
// CLARITY_PROJECT_ID configurado, não injeta nada.
export function Clarity() {
  const projectId = process.env.CLARITY_PROJECT_ID;
  if (!projectId) return null;

  return (
    // "lazyOnload" em vez de "afterInteractive": o Clarity é só
    // diagnóstico (gravação de sessão), não precisa disputar o momento
    // mais crítico da página (logo depois de interativa, quando o lead
    // costuma tocar no primeiro botão) com o Pixel/framer-motion —
    // reduz a chance de contribuir pra travadinha justo na hora que
    // mais importa, principalmente em navegador embutido mais limitado
    // (Facebook/Instagram).
    <Script id="ms-clarity" strategy="lazyOnload">
      {`
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${projectId}");
      `}
    </Script>
  );
}

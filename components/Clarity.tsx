import Script from "next/script";

// Mesmo padrão do MetaPixel.tsx: variável sem prefixo NEXT_PUBLIC_, lida
// a cada request (o layout já é dynamic="force-dynamic") — funciona só
// configurando como env var normal, sem precisar de build arg. Sem
// CLARITY_PROJECT_ID configurado, não injeta nada.
export function Clarity() {
  const projectId = process.env.CLARITY_PROJECT_ID;
  if (!projectId) return null;

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
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

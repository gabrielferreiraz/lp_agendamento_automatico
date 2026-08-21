import Script from "next/script";

// Redireciona automaticamente pro navegador padrão quando detecta Android +
// navegador embutido do Facebook/Instagram — é onde vive o bug confirmado
// via Clarity ("error invoking postmessage: java object is gone", erro de
// ponte Java específico do WebView do Android que o Facebook usa pro
// navegador interno).
//
// `strategy="beforeInteractive"`: roda o mais cedo possível, antes até da
// página hidratar — quanto antes a troca de navegador acontecer, menos
// tempo o WebView problemático tem pra travar antes do redirecionamento
// surtir efeito.
//
// `package=com.android.chrome` explícito (mudou de propósito): a versão
// sem `package=` fixo pedia pro Android decidir, o que na prática mostra
// uma caixa "abrir com qual app?" — e o log de diagnóstico (/api/diag)
// mostrou várias tentativas de redirecionamento sem nenhuma chegada
// confirmada do outro lado, sugerindo que a maioria ignora essa caixa e
// fica parada no navegador embutido. Apontando direto pro Chrome (instalado
// de fábrica em praticamente todo Android no Brasil), a troca acontece sem
// precisar de decisão nenhuma da pessoa. `S.browser_fallback_url` cobre o
// caso raro de Chrome não estar instalado — sem isso funcionar de jeito
// nenhum (iOS, ou algum Android que bloqueia `intent://`), o aviso visível
// (InAppBrowserTip) continua como reforço.
//
// Manda um beacon pro /api/diag em TODA visita (não só quando redireciona)
// — confirma de verdade, consultável depois, se a detecção Android/in-app
// está batendo com o tráfego real, em vez de depender de interpretar o
// Clarity (que não expõe User-Agent bruto).
export function InAppBrowserRedirect() {
  return (
    <Script id="in-app-browser-redirect" strategy="beforeInteractive">
      {`
        (function () {
          try {
            var ua = navigator.userAgent || "";
            var isAndroid = /Android/i.test(ua);
            var isInAppBrowser = /FBAN|FBAV|FB_IAB|Instagram/i.test(ua);
            var willRedirect = isAndroid && isInAppBrowser;

            try {
              var payload = JSON.stringify({
                ua: ua,
                isAndroid: isAndroid,
                isInAppBrowser: isInAppBrowser,
                redirectAttempted: willRedirect,
                url: location.href
              });
              if (navigator.sendBeacon) {
                navigator.sendBeacon("/api/diag", new Blob([payload], { type: "application/json" }));
              }
            } catch (e) {}

            if (!willRedirect) return;

            var url = location.href.replace(/^https?:\\/\\//, "");
            url += (url.indexOf("?") === -1 ? "?" : "&") + "via=inapp-redirect";
            var fallback = encodeURIComponent(location.href);
            location.replace(
              "intent://" + url +
              "#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=" + fallback + ";end"
            );
          } catch (e) {
            // Nunca deixar essa tentativa quebrar o carregamento normal da página.
          }
        })();
      `}
    </Script>
  );
}

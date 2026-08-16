"use client";

import type { TrackingParams } from "@/types/lead";

// Lido 1x quando a página carrega e guardado em memória pro resto da
// sessão do formulário — captura o que veio na URL do anúncio (fbclid,
// utm_*) e o que o Pixel da Meta já deixou em cookie (_fbp sempre; _fbc
// só existe se o Pixel já rodou com um fbclid presente). Isso alimenta
// tanto o adAttribution mandado pro CRM quanto (futuramente) os eventos
// da Conversions API — mandar os dois (Pixel + CAPI) com o mesmo par
// fbp/fbc é o que permite a Meta deduplicar o evento client-side do
// server-side em vez de contar como 2 conversões.
function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

// Formato oficial da Meta pro _fbc quando precisamos gerar na mão
// (fbclid presente na URL mas o Pixel ainda não teve tempo de setar o
// cookie): fb.1.<timestamp em ms>.<fbclid>
function buildFbc(fbclid: string): string {
  return `fb.1.${Date.now()}.${fbclid}`;
}

export function captureTrackingParams(): TrackingParams {
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid") ?? undefined;

  return {
    fbclid,
    fbp: readCookie("_fbp"),
    fbc: readCookie("_fbc") ?? (fbclid ? buildFbc(fbclid) : undefined),
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
    // Meta anexa esses 3 automaticamente nos parâmetros da URL quando o
    // clique vem de um anúncio (precisa estar habilitado no nível da
    // conta/anúncio em "Parâmetros de URL"), por isso os nomes batem com
    // o padrão deles em vez de utm_*.
    campaignId: params.get("campaign_id") ?? undefined,
    adId: params.get("ad_id") ?? undefined,
    adSetId: params.get("adset_id") ?? undefined,
  };
}

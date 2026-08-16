import crypto from "node:crypto";
import { env } from "./env";
import type { TrackingParams } from "@/types/lead";

// Envio server-side de eventos pra Meta Conversions API — a contraparte
// do Pixel (client-side). Mandar os dois com o mesmo `event_id` deixa a
// Meta deduplicar automaticamente em vez de contar 2 conversões, e ainda
// recupera dado perdido por ad blocker/Safari/iOS (por isso o próprio
// Events Manager anuncia "custo mais baixo por resultado" ao ligar os
// dois juntos).
//
// Sem METE_CAPI_ACCESS_TOKEN configurado (cliente ainda não gerou o
// token), esta função só loga e não faz nada — nunca derruba o fluxo do
// lead por falta de credencial de rastreio.

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

type CapiEventName = "Lead" | "Schedule";

export async function sendMetaCapiEvent(params: {
  eventName: CapiEventName;
  eventId: string; // mesmo valor usado no `fbq('track', ..., {eventID: ...})` do Pixel, pra dedupe
  actionSourceUrl: string;
  clientIp?: string;
  userAgent?: string;
  tracking?: TrackingParams;
  userData?: { phone?: string; name?: string };
}): Promise<void> {
  const pixelId = env.metaPixelId();
  const token = env.metaCapiToken();

  if (!pixelId || !token) {
    console.info(`[meta-capi] ignorado (Pixel/token não configurados ainda) — evento ${params.eventName}`);
    return;
  }

  const userData: Record<string, unknown> = {
    client_ip_address: params.clientIp,
    client_user_agent: params.userAgent,
    fbp: params.tracking?.fbp,
    fbc: params.tracking?.fbc,
  };
  if (params.userData?.phone) userData.ph = [sha256(params.userData.phone.replace(/\D/g, ""))];
  if (params.userData?.name) userData.fn = [sha256(params.userData.name.split(" ")[0])];

  const res = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [
        {
          event_name: params.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: params.eventId,
          event_source_url: params.actionSourceUrl,
          action_source: "website",
          user_data: userData,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error(`[meta-capi] falha ao enviar evento ${params.eventName} (HTTP ${res.status})`, errBody);
  }
}

// Leitura centralizada de variáveis de ambiente server-side. Nunca
// importado por um Client Component — tudo aqui fica só no servidor
// (rotas /api/*), o navegador nunca vê nenhum destes valores.
//
// Pixel ID e token da Conversions API ainda não foram configurados
// (ver conversa com o cliente) — por isso são opcionais aqui e cada
// integração degrada sozinha (loga um aviso e segue sem quebrar o
// fluxo do lead) enquanto não forem preenchidos no .env.

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

export const env = {
  crmApiBaseUrl: () => process.env.CRM_API_BASE_URL ?? "https://crm.reoboteconsorcios.com.br",
  crmApiKey: () => required("CRM_API_KEY"),
  crmOwnerId: () => required("CRM_OWNER_ID"), // id do Vinícius — fixo por enquanto (único consultor recebendo tráfego hoje)

  n8nWebhookUrl: () => required("N8N_WEBHOOK_URL"),

  // Opcionais — sem eles a integração correspondente só fica desligada.
  metaPixelId: () => process.env.META_PIXEL_ID || null,
  metaCapiToken: () => process.env.META_CAPI_ACCESS_TOKEN || null,
};

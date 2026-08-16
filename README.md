# forms-e-agendamento-call

Landing page de captação de leads pra anúncios do Meta Ads da Reobote
Consórcios. Substitui o formulário nativo do Facebook: mesmas perguntas de
qualificação, mais uma etapa de agendamento automático da reunião de
fechamento (só o próximo dia útil, em slots fixos, ver `lib/crm.ts` e a
documentação em `crm.reoboteconsorcios.com.br/docs`).

## Como roda

Sem banco de dados próprio — esta aplicação é "burra" de propósito: o
navegador do lead só fala com as rotas internas (`/api/lead`,
`/api/availability`, `/api/appointments`, `/api/notify`), e são essas rotas
que, no servidor, chamam:

- **CRM** (`lib/crm.ts`) — cria o contato/negócio e reserva o horário
  (usa a API v1, autenticada por `CRM_API_KEY`).
- **n8n** (`lib/n8n.ts`) — dispara o aviso de WhatsApp (Evolution API) pro
  Renan (supervisor) e pro consultor responsável.
- **Meta Conversions API** (`lib/meta-capi.ts`) — opcional, só liga
  quando `META_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN` estiverem
  preenchidos.

```bash
npm install
cp .env.example .env   # preencher com os valores reais
npm run dev
```

## Fluxo do formulário

1. Passos 1-4: qualificação (valor de crédito, faixa de parcela, prazo,
   motivo) — só em memória no client, nada é enviado ainda.
2. Passo 5 (contato): ao confirmar, `POST /api/lead` já cria o
   contato + negócio no CRM — **isso acontece mesmo que o lead não chegue
   a agendar depois** (decisão do cliente: nunca perder o lead por causa da
   etapa de agendamento).
3. Passo 6 (agendamento): mostra os horários do próximo dia útil
   (`GET /api/availability`). Se o lead confirma um horário,
   `POST /api/appointments` reserva o slot e o aviso de WhatsApp
   (`/api/notify`, `agendado: true`) sai na hora. Se o lead sair da página
   ou ficar 5 minutos sem decidir, o aviso sai sozinho com
   `agendado: false` (ver `lib/use-exit-notify.ts`) — o texto da mensagem
   em si é decidido dentro do workflow do n8n a partir desse campo.
4. Passo 7: tela de confirmação (com ou sem horário marcado).

## Variáveis de ambiente

Ver `.env.example`. Todas são lidas em runtime, a cada request (`/` e
`/privacidade` usam `dynamic = "force-dynamic"` — ver `app/layout.tsx` —
justamente pra nenhuma variável de ambiente ficar "congelada" dentro do
HTML gerado no build) — então basta configurar como env var normal em
qualquer painel de hospedagem, sem precisar de "build arg" especial pra
nenhuma delas. Único ponto de atenção real:

- `N8N_WEBHOOK_URL` — precisa ser a URL de **produção** do n8n
  (`/webhook/agendamento-lp`, sem `-test`), com o workflow **Active**.

## Deploy

`Dockerfile` gera uma imagem standalone do Next.js, mesmo padrão do
`crm-reobote`, pronta pra subir no EasyPanel.

## Pendências conhecidas

- Sincronização real com o Google Calendar do consultor está desligada no
  CRM (app do Google ainda não verificado — ver conversa/decisão do
  cliente). O agendamento funciona normalmente sem isso; só não aparece
  sozinho no Google Calendar do celular do consultor ainda.
- Pixel ID e token da Conversions API da Meta ainda não foram fornecidos.
- `CRM_OWNER_ID` está fixo (Vinícius) — quando entrar mais de um
  consultor, isso vira seleção dinâmica em `/api/availability` e
  `/api/appointments`.

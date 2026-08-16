export const metadata = { title: "Política de Privacidade — Reobote Consórcios" };

export default function PrivacidadePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-6 px-5 py-16 text-white/80">
      <h1 className="text-2xl font-semibold text-white">Política de Privacidade</h1>
      <p className="text-sm text-white/50">Última atualização: agosto de 2026</p>

      <section className="flex flex-col gap-3 text-sm leading-relaxed">
        <p>
          Esta página explica, de forma simples, como a <strong>Reobote Consórcios</strong> trata os dados
          preenchidos neste formulário, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 —
          LGPD).
        </p>

        <h2 className="mt-2 text-base font-semibold text-white">Quais dados coletamos</h2>
        <p>
          Nome, telefone/WhatsApp, Instagram (quando informado) e as respostas sobre seu interesse em consórcio
          (valor de crédito buscado, faixa de parcela, prazo de contratação e o que despertou seu interesse). Se
          você escolher um horário, também registramos a data e o horário escolhidos.
        </p>

        <h2 className="mt-2 text-base font-semibold text-white">Para que usamos esses dados</h2>
        <p>
          Para que um consultor da Reobote Consórcios entre em contato com você por telefone ou WhatsApp, entenda
          sua necessidade e, se você agendou, para confirmar e realizar a reunião marcada. Também usamos essas
          informações para medir a performance dos nossos anúncios (por exemplo, saber que uma campanha específica
          gerou este contato).
        </p>

        <h2 className="mt-2 text-base font-semibold text-white">Com quem compartilhamos</h2>
        <p>
          Seus dados são enviados para os sistemas internos da Reobote Consórcios (CRM e WhatsApp corporativo) e,
          de forma limitada e sem dados de contato completos, para a Meta (Facebook/Instagram) apenas para fins de
          mensuração de anúncios. Não vendemos nem repassamos seus dados para terceiros não relacionados à Reobote
          Consórcios.
        </p>

        <h2 className="mt-2 text-base font-semibold text-white">Seus direitos</h2>
        <p>
          Você pode solicitar a qualquer momento a confirmação, correção ou exclusão dos seus dados, entrando em
          contato pelo mesmo WhatsApp que vai te chamar após o preenchimento deste formulário.
        </p>

        <p className="mt-4 text-xs text-white/40">
          Este texto é um resumo informativo elaborado para este formulário específico e pode ser substituído a
          qualquer momento por uma política de privacidade mais completa da empresa.
        </p>
      </section>
    </main>
  );
}

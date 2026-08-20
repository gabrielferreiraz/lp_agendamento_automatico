function formatDatePt(iso: string): string {
  const [y, mo, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "UTC" });
}

export function ConfirmacaoStep({ scheduled }: { scheduled: { date: string; time: string } | null }) {
  return (
    <div className="card w-full max-w-md p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-emerald-300">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {scheduled ? (
        <>
          <h2 className="mt-5 text-xl font-semibold text-white sm:text-2xl">Reunião confirmada!</h2>
          <p className="mt-2 text-sm text-white/60">
            Marcamos sua conversa para <span className="font-medium text-white/85">{formatDatePt(scheduled.date)}</span> às{" "}
            <span className="font-medium text-white/85">{scheduled.time}</span>. Um consultor vai te chamar no WhatsApp.
          </p>
        </>
      ) : (
        <>
          <h2 className="mt-5 text-xl font-semibold text-white sm:text-2xl">Recebemos suas informações!</h2>
          <p className="mt-2 text-sm text-white/60">
            Um consultor da Reobote Consórcios vai entrar em contato com você pelo WhatsApp em breve.
          </p>
        </>
      )}

      <p className="mt-6 text-sm font-medium text-white/80">
        Já está tudo registrado por aqui — pode fechar esta página com tranquilidade.
      </p>
    </div>
  );
}

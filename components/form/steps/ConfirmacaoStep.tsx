import { m } from "framer-motion";

function formatDatePt(iso: string): string {
  const [y, mo, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "UTC" });
}

export function ConfirmacaoStep({ scheduled }: { scheduled: { date: string; time: string } | null }) {
  return (
    <m.div
      className="glass-card w-full max-w-md p-8 text-center"
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative mx-auto flex h-14 w-14 items-center justify-center">
        <m.span
          className="absolute inset-0 rounded-full bg-emerald-400/25"
          initial={{ scale: 0.6, opacity: 0.6 }}
          animate={{ scale: [0.6, 1.6], opacity: [0.6, 0] }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.15, repeat: 2, repeatDelay: 0.3 }}
        />
        <m.div
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.05 }}
        >
          <m.svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-7 w-7 text-emerald-300"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" }}
          >
            <m.path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </m.svg>
        </m.div>
      </div>

      <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.35 }}>
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
      </m.div>

      <m.p
        className="mt-6 text-sm font-medium text-white/80"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        Já está tudo registrado por aqui — pode fechar esta página com tranquilidade.
      </m.p>
    </m.div>
  );
}

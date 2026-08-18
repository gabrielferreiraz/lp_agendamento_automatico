import Image from "next/image";
import { LeadForm } from "@/components/form/LeadForm";
import { InAppBrowserTip } from "@/components/InAppBrowserTip";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-4 py-12 sm:justify-center sm:py-16">
      <InAppBrowserTip />

      <div className="flex flex-col items-center gap-3 text-center">
        <Image
          src="/logo-reobote.svg"
          alt="Reobote Consórcios"
          width={264}
          height={150}
          priority
          className="h-14 w-auto sm:h-16"
        />
        <p className="max-w-xs text-sm text-white/50">Responda 5 perguntas rápidas e fale com um consultor.</p>
      </div>

      <LeadForm />
    </main>
  );
}

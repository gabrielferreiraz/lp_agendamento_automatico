import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MotionProvider } from "@/components/MotionProvider";
import { MetaPixel } from "@/components/MetaPixel";
import { Clarity } from "@/components/Clarity";
import { PauseAnimationsWhenHidden } from "@/components/PauseAnimationsWhenHidden";
import { InAppBrowserRedirect } from "@/components/InAppBrowserRedirect";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reobote Consórcios — Fale com um consultor",
  description: "Simule seu consórcio e agende uma conversa rápida com um consultor Reobote.",
};

// Sem isso, "/" e "/privacidade" seriam pré-gerados uma única vez no
// build (ver MetaPixel.tsx) — qualquer variável de ambiente configurada
// só DEPOIS do build (o caso comum em painéis como o EasyPanel, que não
// necessariamente reconstroem a imagem ao mudar uma env var) nunca
// apareceria no site. Troca por renderização a cada request (mesmo
// padrão já usado nas rotas /api/*) — custo desprezível pra uma página
// deste tamanho, e ganha a variável sempre refletir o ambiente atual,
// sem precisar de rebuild.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <InAppBrowserRedirect />
        <MetaPixel />
        <Clarity />
        <PauseAnimationsWhenHidden />
        <div className="bg-blobs" aria-hidden="true">
          <div className="bg-blob bg-blob-1" />
          <div className="bg-blob bg-blob-2" />
          <div className="bg-blob bg-blob-3" />
        </div>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

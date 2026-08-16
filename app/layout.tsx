import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MotionProvider } from "@/components/MotionProvider";
import { MetaPixel } from "@/components/MetaPixel";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reobote Consórcios — Fale com um consultor",
  description: "Simule seu consórcio e agende uma conversa rápida com um consultor Reobote.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <MetaPixel />
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

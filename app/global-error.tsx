"use client";

// Convenção do Next.js pra erro no próprio layout raiz (mais raro que o
// erro coberto por app/error.tsx, mas se acontecer o layout normal nem
// chega a montar) — por isso precisa do próprio <html>/<body> aqui, e
// estilo inline em vez de depender do globals.css (que é importado
// dentro do layout que pode ter sido justamente o que quebrou).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#070b14", color: "#f1f5f9", fontFamily: "Arial, Helvetica, sans-serif", padding: 24 }}>
        <div style={{ maxWidth: 380, textAlign: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Algo não carregou direito</h2>
          <p style={{ marginTop: 8, fontSize: 14, color: "rgba(241,245,249,0.6)" }}>
            Isso pode acontecer dependendo do aplicativo usado pra abrir esta página. Toque no botão abaixo pra tentar de novo.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ marginTop: 24, width: "100%", borderRadius: 12, background: "#2563eb", color: "#fff", padding: "14px 24px", fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}

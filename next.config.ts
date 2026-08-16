import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build de produção autocontido (server.js + node_modules mínimos) —
  // é o formato que o Dockerfile copia pra imagem final, mesmo padrão
  // usado no crm-reobote.
  output: "standalone",
};

export default nextConfig;

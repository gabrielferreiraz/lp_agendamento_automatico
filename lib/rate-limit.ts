// Limitador em memória, sem dependência externa (Redis etc.) — suficiente
// pro tamanho desta aplicação (1 container, tráfego de 1 landing page),
// mas com uma limitação real: reseta ao reiniciar o container e não
// compartilha estado se um dia isso rodar em mais de uma réplica. Se a
// escala exigir isso, precisa virar um contador externo compartilhado.
//
// Dois níveis de proteção, porque resolvem ameaças diferentes:
//   - `rateLimit(key, ...)` por IP: barra um único script/bot martelando
//     a rota.
//   - `rateLimit("global:...", ...)` sem IP: protege a cota da própria
//     API do CRM (compartilhada por TODO o tráfego, real ou não — um
//     ataque distribuído por várias origens passaria pelo limite por IP
//     mas ainda estouraria essa cota global).

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Limpeza periódica pra não vazar memória com IPs que só aparecem uma vez
// (bucket expirado nunca mais é lido, mas ficaria ocupando o Map pra
// sempre sem isso).
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(key);
    }
  },
  10 * 60 * 1000,
).unref();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count++;
  return { ok: true };
}

export function getClientIp(req: Request): string {
  // EasyPanel/reverse proxy típico injeta x-forwarded-for; sem isso, cai
  // pra um bucket único ("unknown") — pior caso é todo cliente sem esse
  // header compartilhar 1 limite, nunca um bypass do limite.
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

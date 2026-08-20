// Registro em memória, só de diagnóstico temporário — não é parte do
// produto, existe pra confirmar de verdade (em vez de adivinhar pelo
// Clarity) se a detecção de Android + navegador embutido está batendo
// certo com o que realmente chega. Buffer circular pequeno, sem
// persistência — é descartável, dá pra remover depois que o mistério do
// navegador embutido estiver resolvido.
export type DiagEntry = {
  timestamp: string;
  ua: string;
  isAndroid: boolean;
  isInAppBrowser: boolean;
  redirectAttempted: boolean;
  url: string;
};

const MAX_ENTRIES = 200;
const entries: DiagEntry[] = [];

export function addDiagEntry(entry: Omit<DiagEntry, "timestamp">): void {
  entries.push({ ...entry, timestamp: new Date().toISOString() });
  if (entries.length > MAX_ENTRIES) entries.shift();
}

export function getDiagEntries(): DiagEntry[] {
  return entries;
}

export const STATUS_OBRA: Record<string, { label: string; cls: string }> = {
  em_andamento: { label: "Em andamento", cls: "bg-amber-100 text-amber-800" },
  paralisada: { label: "Paralisada", cls: "bg-red-100 text-red-700" },
  concluida: { label: "Concluída", cls: "bg-emerald-100 text-emerald-700" },
  planejamento: { label: "Planejamento", cls: "bg-sky-100 text-sky-700" },
};

export const STATUS_RDO: Record<string, { label: string; cls: string }> = {
  rascunho: { label: "Rascunho", cls: "bg-slate-200 text-slate-700" },
  finalizado: { label: "Finalizado", cls: "bg-emerald-100 text-emerald-700" },
};

export const CLIMA: Record<string, { label: string; icon: string }> = {
  bom: { label: "Bom", icon: "☀️" },
  nublado: { label: "Nublado", icon: "⛅" },
  chuvoso: { label: "Chuvoso", icon: "🌧️" },
  impraticavel: { label: "Impraticável", icon: "⛈️" },
};

export const CONDICAO: Record<string, string> = {
  praticavel: "Praticável",
  impraticavel: "Impraticável",
};

export const STATUS_ATIVIDADE: Record<string, { label: string; cls: string }> = {
  em_andamento: { label: "Em andamento", cls: "bg-amber-100 text-amber-800" },
  concluida: { label: "Concluída", cls: "bg-emerald-100 text-emerald-700" },
  paralisada: { label: "Paralisada", cls: "bg-red-100 text-red-700" },
};

export const TIPO_OCORRENCIA: Record<string, string> = {
  geral: "Geral",
  seguranca: "Segurança",
  atraso: "Atraso",
  acidente: "Acidente",
  visita: "Visita técnica",
  material: "Material",
};

export function formatDate(d?: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.slice(0, 10).split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

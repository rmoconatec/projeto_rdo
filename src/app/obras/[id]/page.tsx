"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STATUS_OBRA, STATUS_RDO, formatDate } from "@/lib/labels";

type Rdo = {
  id: number;
  numero: number;
  data: string;
  status: string;
};
type Obra = {
  id: number;
  nome: string;
  cliente: string | null;
  endereco: string | null;
  responsavel: string | null;
  descricao: string | null;
  status: string;
  dataInicio: string | null;
  previsaoTermino: string | null;
  rdos: Rdo[];
};

export default function ObraDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [obra, setObra] = useState<Obra | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [novoData, setNovoData] = useState(
    new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/obras/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setObra(data);
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  async function criarRdo() {
    setCreating(true);
    const res = await fetch(`/api/obras/${id}/rdos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: novoData }),
    });
    setCreating(false);
    if (res.ok) {
      const rdo = await res.json();
      router.push(`/obras/${id}/rdo/${rdo.id}`);
    }
  }

  async function excluirObra() {
    if (!confirm("Excluir esta obra e todos os seus RDOs?")) return;
    await fetch(`/api/obras/${id}`, { method: "DELETE" });
    router.push("/obras");
  }

  if (loading) return <p className="text-slate-500">Carregando...</p>;
  if (!obra) return <p className="text-slate-500">Obra não encontrada.</p>;

  return (
    <div className="space-y-6">
      <Link href="/obras" className="text-sm text-orange-600 hover:underline">
        ← Voltar para obras
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{obra.nome}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  STATUS_OBRA[obra.status]?.cls ?? "bg-slate-100"
                }`}
              >
                {STATUS_OBRA[obra.status]?.label ?? obra.status}
              </span>
            </div>
            {obra.descricao && (
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                {obra.descricao}
              </p>
            )}
          </div>
          <button
            onClick={excluirObra}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Excluir obra
          </button>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Info label="Cliente" value={obra.cliente} />
          <Info label="Responsável" value={obra.responsavel} />
          <Info label="Início" value={formatDate(obra.dataInicio)} />
          <Info label="Previsão término" value={formatDate(obra.previsaoTermino)} />
          <Info label="Endereço" value={obra.endereco} className="col-span-2" />
        </dl>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Novo Relatório Diário (RDO)
        </h2>
        <p className="text-sm text-slate-500">
          Crie um RDO para registrar o que aconteceu no dia.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Data
            </span>
            <input
              type="date"
              value={novoData}
              onChange={(e) => setNovoData(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            onClick={criarRdo}
            disabled={creating}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {creating ? "Criando..." : "+ Criar RDO"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Relatórios Diários ({obra.rdos.length})
        </h2>
        {obra.rdos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            Nenhum RDO criado para esta obra.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {obra.rdos.map((r) => (
              <Link
                key={r.id}
                href={`/obras/${id}/rdo/${r.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 font-bold text-orange-600">
                    {r.numero}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">RDO #{r.numero}</p>
                    <p className="text-sm text-slate-500">{formatDate(r.data)}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    STATUS_RDO[r.status]?.cls ?? "bg-slate-100"
                  }`}
                >
                  {STATUS_RDO[r.status]?.label ?? r.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-slate-800">{value || "—"}</dd>
    </div>
  );
}

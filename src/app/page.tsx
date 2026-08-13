"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { localDb } from "@/db/dexie";
import { STATUS_RDO, formatDate } from "@/lib/labels";

type RecentRdo = {
  id: string;
  numero: number;
  data: string;
  status: string;
  obraId: string;
  obraNome: string;
};

export default function Home() {
  const [totalObras, setTotalObras] = useState(0);
  const [obrasAtivas, setObrasAtivas] = useState(0);
  const [totalRdos, setTotalRdos] = useState(0);
  const [rdosHoje, setRdosHoje] = useState(0);
  const [recentes, setRecentes] = useState<RecentRdo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([localDb.obras.toArray(), localDb.rdos.toArray()]).then(([todasObras, todasRdos]) => {
      if (cancelled) return;
      setTotalObras(todasObras.length);
      setObrasAtivas(todasObras.filter((o) => o.status === "em_andamento").length);
      setTotalRdos(todasRdos.length);
      const hoje = new Date().toISOString().slice(0, 10);
      setRdosHoje(todasRdos.filter((r) => r.data === hoje).length);
      const sorted = [...todasRdos].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const recent = sorted.slice(0, 6);
      const recentesComObra: RecentRdo[] = recent.map((r) => ({
        id: r.id,
        numero: r.numero,
        data: r.data,
        status: r.status,
        obraId: r.obraId,
        obraNome: todasObras.find((o) => o.id === r.obraId)?.nome ?? "Obra",
      }));
      setRecentes(recentesComObra);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <p className="text-slate-500">Carregando...</p>;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-8 text-white shadow">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Bem-vindo ao seu Diário de Obras
        </h1>
        <p className="mt-2 max-w-2xl text-orange-50">
          Registre e acompanhe a evolução das suas obras com Relatórios Diários
          de Obra (RDO). Os dados ficam salvos no seu navegador e são
          sincronizados com o servidor quando você clicar em &ldquo;Sincronizar&rdquo;.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/obras"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-orange-600 shadow hover:bg-orange-50"
          >
            Gerenciar obras
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Obras cadastradas" value={totalObras} icon="🏢" />
        <Stat label="Obras em andamento" value={obrasAtivas} icon="🚧" />
        <Stat label="RDOs registrados" value={totalRdos} icon="📋" />
        <Stat label="RDOs de hoje" value={rdosHoje} icon="📅" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Relatórios recentes
          </h2>
          <Link
            href="/obras"
            className="text-sm font-medium text-orange-600 hover:underline"
          >
            Ver obras →
          </Link>
        </div>
        {recentes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Nenhum RDO registrado ainda. Comece cadastrando uma obra.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {recentes.map((r) => (
              <Link
                key={r.id}
                href={`/obras/${r.obraId}/rdo/${r.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    RDO #{r.numero} — {r.obraNome}
                  </p>
                  <p className="text-sm text-slate-500">{formatDate(r.data)}</p>
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
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

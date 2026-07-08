import Link from "next/link";
import { db } from "@/db";
import { obras, rdos } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { STATUS_RDO, formatDate } from "@/lib/labels";

export const dynamic = "force-dynamic";

async function getData() {
  const [obraCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(obras);
  const [obraAtivas] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(obras)
    .where(eq(obras.status, "em_andamento"));
  const [rdoCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(rdos);
  const [rdoHoje] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(rdos)
    .where(sql`${rdos.data} = current_date`);
  const recentes = await db
    .select({
      id: rdos.id,
      numero: rdos.numero,
      data: rdos.data,
      status: rdos.status,
      obraId: rdos.obraId,
      obraNome: obras.nome,
    })
    .from(rdos)
    .leftJoin(obras, eq(obras.id, rdos.obraId))
    .orderBy(desc(rdos.createdAt))
    .limit(6);

  return {
    totalObras: obraCount?.total ?? 0,
    obrasAtivas: obraAtivas?.total ?? 0,
    totalRdos: rdoCount?.total ?? 0,
    rdosHoje: rdoHoje?.total ?? 0,
    recentes,
  };
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className={`text-2xl ${accent}`}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default async function Home() {
  const data = await getData();
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-8 text-white shadow">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Bem-vindo ao seu Diário de Obras
        </h1>
        <p className="mt-2 max-w-2xl text-orange-50">
          Registre e acompanhe a evolução das suas obras com Relatórios Diários
          de Obra (RDO). Melhore a comunicação entre canteiro, escritório e
          cliente.
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
        <Stat
          label="Obras cadastradas"
          value={data.totalObras}
          icon="🏢"
          accent=""
        />
        <Stat
          label="Obras em andamento"
          value={data.obrasAtivas}
          icon="🚧"
          accent=""
        />
        <Stat label="RDOs registrados" value={data.totalRdos} icon="📋" accent="" />
        <Stat label="RDOs de hoje" value={data.rdosHoje} icon="📅" accent="" />
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
        {data.recentes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Nenhum RDO registrado ainda. Comece cadastrando uma obra.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {data.recentes.map((r) => (
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

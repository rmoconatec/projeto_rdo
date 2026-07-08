import Link from "next/link";
import { notFound } from "next/navigation";
import ExportWordButton from "@/components/ExportWordButton";
import { db } from "@/db";
import {
  rdos,
  obras,
  maoDeObra,
  equipamentos,
  atividades,
  ocorrencias,
  comentarios,
  anexos,
  materiais,
} from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import {
  CLIMA,
  CONDICAO,
  STATUS_ATIVIDADE,
  TIPO_OCORRENCIA,
  formatDate,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

function section(title: string) {
  return (
    <h2 className="mt-6 mb-2 border-b border-slate-300 pb-1 text-sm font-bold uppercase tracking-wide text-slate-700">
      {title}
    </h2>
  );
}

export default async function Relatorio({
  params,
}: {
  params: Promise<{ id: string; rdoId: string }>;
}) {
  const { id, rdoId } = await params;
  const rdoIdN = Number(rdoId);

  const [rdo] = await db.select().from(rdos).where(eq(rdos.id, rdoIdN));
  if (!rdo) notFound();
  const [obra] = await db.select().from(obras).where(eq(obras.id, rdo.obraId));
  const [mo, eqp, at, oc, co, an, mt] = await Promise.all([
    db.select().from(maoDeObra).where(eq(maoDeObra.rdoId, rdoIdN)),
    db.select().from(equipamentos).where(eq(equipamentos.rdoId, rdoIdN)),
    db.select().from(atividades).where(eq(atividades.rdoId, rdoIdN)),
    db.select().from(ocorrencias).where(eq(ocorrencias.rdoId, rdoIdN)),
    db
      .select()
      .from(comentarios)
      .where(eq(comentarios.rdoId, rdoIdN))
      .orderBy(asc(comentarios.createdAt)),
    db.select().from(anexos).where(eq(anexos.rdoId, rdoIdN)),
    db.select().from(materiais).where(eq(materiais.rdoId, rdoIdN)),
  ]);

  const totalEfetivo = mo.reduce((s, r) => s + (r.quantidade || 0), 0);

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-slate-800 print:p-0">
      <div className="mb-4 flex items-start justify-between border-b-2 border-slate-800 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">
            Relatório Diário de Obra (RDO)
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            {obra?.nome ?? "Obra"}
          </h1>
        </div>
        <div className="text-right text-sm">
          <p className="font-bold text-slate-900">RDO #{rdo.numero}</p>
          <p className="text-slate-600">{formatDate(rdo.data)}</p>
          <p className="text-slate-500">
            Status: {rdo.status === "finalizado" ? "Finalizado" : "Rascunho"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <Info label="Cliente" value={obra?.cliente} />
        <Info label="Responsável" value={obra?.responsavel} />
        <Info label="Endereço" value={obra?.endereco} />
        <Info label="Início" value={formatDate(obra?.dataInicio)} />
      </div>

      {section("Condições Climáticas")}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100 text-left text-xs uppercase text-slate-500">
            <th className="p-2">Período</th>
            <th className="p-2">Clima</th>
            <th className="p-2">Condição</th>
          </tr>
        </thead>
        <tbody>
          {(["Manha", "Tarde", "Noite"] as const).map((p) => {
            const climaVal = String(rdo[`clima${p}` as keyof typeof rdo] ?? "");
            const condVal = String(
              rdo[`condicao${p}` as keyof typeof rdo] ?? ""
            );
            return (
              <tr key={p} className="border-b border-slate-100">
                <td className="p-2 font-medium">
                  {p === "Manha" ? "Manhã" : p}
                </td>
                <td className="p-2">
                  {(CLIMA as Record<string, { label: string; icon: string }>)[
                    climaVal
                  ]?.label ?? "—"}
                </td>
                <td className="p-2">{CONDICAO[condVal] ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {section(`Mão de Obra (total: ${totalEfetivo})`)}
      {mo.length === 0 ? (
        <p className="text-sm text-slate-400">Não informado.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {mo.map((r, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="p-2">{r.funcao}</td>
                <td className="p-2 text-right">{r.quantidade} pessoas</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {section("Equipamentos")}
      {eqp.length === 0 ? (
        <p className="text-sm text-slate-400">Não informado.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {eqp.map((r, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="p-2">{r.nome}</td>
                <td className="p-2 text-right">{r.quantidade}</td>
                <td className="p-2 text-right text-slate-500">{r.situacao}</td>
                <td className="p-2">
                  {Array.isArray(r.fotos) && r.fotos.length > 0 ? (
                    <div className="flex gap-1">
                      {r.fotos.map((f, j) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={j}
                          src={f}
                          alt=""
                          className="h-10 w-10 rounded object-cover"
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {section("Atividades Executadas")}
      {at.length === 0 ? (
        <p className="text-sm text-slate-400">Não informado.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-xs uppercase text-slate-500">
              <th className="p-2">Atividade</th>
              <th className="p-2">Un.</th>
              <th className="p-2 text-right">Total</th>
              <th className="p-2 text-right">Exec.</th>
              <th className="p-2 text-right">%</th>
              <th className="p-2">Status</th>
              <th className="p-2">Fotos</th>
            </tr>
          </thead>
          <tbody>
            {at.map((r, i) => {
              const total = r.quantidadeTotal || 0;
              const exec = r.quantidadeExecutada || 0;
              const pct = total > 0 ? Math.round((exec / total) * 100) : 0;
              return (
                <tr key={i} className="border-b border-slate-100">
                  <td className="p-2">{r.descricao}</td>
                  <td className="p-2">{r.unidade}</td>
                  <td className="p-2 text-right">{total}</td>
                  <td className="p-2 text-right">{exec}</td>
                  <td className="p-2 text-right">{pct}%</td>
                  <td className="p-2">
                    {STATUS_ATIVIDADE[String(r.status ?? "")]?.label ??
                      r.status ??
                      "—"}
                  </td>
                  <td className="p-2">
                    {Array.isArray(r.fotos) && r.fotos.length > 0 ? (
                      <div className="flex gap-1">
                        {r.fotos.map((f, j) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={j}
                            src={f}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {section("Controle de Materiais")}
      {mt.length === 0 ? (
        <p className="text-sm text-slate-400">Não informado.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-xs uppercase text-slate-500">
              <th className="p-2">Material</th>
              <th className="p-2">Un.</th>
              <th className="p-2 text-right">Chegada</th>
              <th className="p-2 text-right">Utilizada</th>
              <th className="p-2 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {mt.map((r, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="p-2">
                  {r.nome}
                  {r.observacao ? (
                    <span className="block text-xs text-slate-400">
                      {r.observacao}
                    </span>
                  ) : null}
                </td>
                <td className="p-2">{r.unidade}</td>
                <td className="p-2 text-right">{r.qtdEntrada}</td>
                <td className="p-2 text-right">{r.qtdUtilizada}</td>
                <td className="p-2 text-right">
                  {(r.qtdEntrada || 0) - (r.qtdUtilizada || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {section("Ocorrências")}
      {oc.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma ocorrência.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {oc.map((r, i) => (
            <li key={i}>
              <span className="font-semibold text-slate-700">
                [{TIPO_OCORRENCIA[r.tipo] ?? r.tipo}] {r.descricao}
              </span>
            </li>
          ))}
        </ul>
      )}

      {section("Observações Gerais")}
      <p className="whitespace-pre-wrap text-sm">
        {rdo.observacoes || "Nenhuma observação."}
      </p>

      {an.length > 0 && section("Anexos e Documentos")}
      {an.length > 0 && (
        <ul className="space-y-1 text-sm">
          {an.map((a, i) => (
            <li key={i}>
              📎 {a.nome}
            </li>
          ))}
        </ul>
      )}

      {co.length > 0 && section("Comentários")}
      {co.length > 0 && (
        <ul className="space-y-1 text-sm">
          {co.map((c) => (
            <li key={c.id}>
              <span className="font-semibold">{c.autor}:</span> {c.texto}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex items-end justify-between border-t border-slate-300 pt-6 text-sm">
        <div>
          <div className="h-10 border-b border-slate-400" />
          <p className="mt-1 text-xs text-slate-500">Responsável técnico</p>
        </div>
        <p className="text-xs text-slate-400">
          Gerado em {new Date().toLocaleString("pt-BR")}
        </p>
      </div>

      <div className="mt-6 no-print text-center">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          🖨️ Imprimir / Salvar PDF
        </button>{" "}
        <ExportWordButton rdoId={rdoIdN} />{" "}
        <Link
          href={`/obras/${id}/rdo/${rdoId}`}
          className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          ← Voltar ao RDO
        </Link>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-xs uppercase text-slate-400">{label}: </span>
      <span className="text-slate-700">{value || "—"}</span>
    </div>
  );
}

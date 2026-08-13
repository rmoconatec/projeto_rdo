"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import ExportWordButton from "@/components/ExportWordButton";
import { localDb } from "@/db/dexie";
import {
  CLIMA,
  CONDICAO,
  STATUS_ATIVIDADE,
  TIPO_OCORRENCIA,
  formatDate,
} from "@/lib/labels";

type RdoFull = {
  id: string;
  numero: number;
  data: string;
  status: string;
  climaManha: string;
  climaTarde: string;
  climaNoite: string;
  condicaoManha: string;
  condicaoTarde: string;
  condicaoNoite: string;
  observacoes: string | null;
  serverId: number | null;
  obra: { nome: string; cliente: string | null; responsavel: string | null; endereco: string | null; dataInicio: string | null } | null;
  maoDeObra: { funcao: string; quantidade: number }[];
  equipamentos: { nome: string; quantidade: number; situacao: string; fotos: string[] }[];
  atividades: { descricao: string; unidade: string; quantidadeTotal: number; quantidadeExecutada: number; status: string; fotos: string[] }[];
  ocorrencias: { tipo: string; descricao: string }[];
  comentarios: { id: string; autor: string; texto: string }[];
  anexos: { nome: string; url: string }[];
  materiais: { nome: string; unidade: string; qtdEntrada: number; qtdUtilizada: number; observacao: string | null }[];
};

export default function Relatorio({
  params,
}: {
  params: Promise<{ id: string; rdoId: string }>;
}) {
  const { id, rdoId } = use(params);
  const [data, setData] = useState<RdoFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const rdo = await localDb.rdos.get(rdoId);
      if (cancelled || !rdo) {
        if (!cancelled) setLoading(false);
        return;
      }

      const obra = await localDb.obras.get(rdo.obraId);

      const [mo, eqp, at, oc, co, an, mt] = await Promise.all([
        localDb.maoDeObra.where("rdoId").equals(rdoId).toArray(),
        localDb.equipamentos.where("rdoId").equals(rdoId).toArray(),
        localDb.atividades.where("rdoId").equals(rdoId).toArray(),
        localDb.ocorrencias.where("rdoId").equals(rdoId).toArray(),
        localDb.comentarios.where("rdoId").equals(rdoId).toArray(),
        localDb.anexos.where("rdoId").equals(rdoId).toArray(),
        localDb.materiais.where("rdoId").equals(rdoId).toArray(),
      ]);

      if (cancelled) return;

      setData({
        id: rdo.id,
        numero: rdo.numero,
        data: rdo.data,
        status: rdo.status,
        climaManha: rdo.climaManha,
        climaTarde: rdo.climaTarde,
        climaNoite: rdo.climaNoite,
        condicaoManha: rdo.condicaoManha,
        condicaoTarde: rdo.condicaoTarde,
        condicaoNoite: rdo.condicaoNoite,
        observacoes: rdo.observacoes,
        serverId: rdo.serverId,
        obra: obra
          ? {
              nome: obra.nome,
              cliente: obra.cliente,
              responsavel: obra.responsavel,
              endereco: obra.endereco,
              dataInicio: obra.dataInicio,
            }
          : null,
        maoDeObra: mo.map(({ funcao, quantidade }) => ({ funcao, quantidade })),
        equipamentos: eqp.map(({ nome, quantidade, situacao, fotos }) => ({
          nome,
          quantidade,
          situacao,
          fotos: fotos ?? [],
        })),
        atividades: at.map(
          ({ descricao, unidade, quantidadeTotal, quantidadeExecutada, status, fotos }) => ({
            descricao,
            unidade: unidade ?? "un",
            quantidadeTotal: quantidadeTotal ?? 0,
            quantidadeExecutada: quantidadeExecutada ?? 0,
            status: status ?? "em_andamento",
            fotos: fotos ?? [],
          })
        ),
        ocorrencias: oc.map(({ tipo, descricao }) => ({ tipo: tipo ?? "geral", descricao })),
        comentarios: co.map(({ id: cid, autor, texto }) => ({ id: cid || crypto.randomUUID(), autor, texto })),
        anexos: an.map(({ nome, url }) => ({ nome, url })),
        materiais: mt.map(
          ({ nome, unidade, qtdEntrada, qtdUtilizada, observacao }) => ({
            nome,
            unidade: unidade ?? "un",
            qtdEntrada: qtdEntrada ?? 0,
            qtdUtilizada: qtdUtilizada ?? 0,
            observacao,
          })
        ),
      });

      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [rdoId]);

  if (loading) return <p className="text-slate-500">Carregando...</p>;
  if (!data) return <p className="text-slate-500">RDO não encontrado.</p>;

  const totalEfetivo = data.maoDeObra.reduce((s, r) => s + (r.quantidade || 0), 0);

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-slate-800 print:p-0">
      <div className="mb-4 flex items-start justify-between border-b-2 border-slate-800 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">
            Relatório Diário de Obra (RDO)
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            {data.obra?.nome ?? "Obra"}
          </h1>
        </div>
        <div className="text-right text-sm">
          <p className="font-bold text-slate-900">RDO #{data.numero}</p>
          <p className="text-slate-600">{formatDate(data.data)}</p>
          <p className="text-slate-500">
            Status: {data.status === "finalizado" ? "Finalizado" : "Rascunho"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <Info label="Cliente" value={data.obra?.cliente} />
        <Info label="Responsável" value={data.obra?.responsavel} />
        <Info label="Endereço" value={data.obra?.endereco} />
        <Info label="Início" value={formatDate(data.obra?.dataInicio)} />
      </div>

      <Section title="Condições Climáticas" />
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
            const climaKey = `clima${p}` as keyof typeof data;
            const condKey = `condicao${p}` as keyof typeof data;
            return (
              <tr key={p} className="border-b border-slate-100">
                <td className="p-2 font-medium">
                  {p === "Manha" ? "Manhã" : p}
                </td>
                <td className="p-2">
                  {CLIMA[String(data[climaKey])]?.label ?? "—"}
                </td>
                <td className="p-2">{CONDICAO[String(data[condKey])] ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Section title={`Mão de Obra (total: ${totalEfetivo})`} />
      {data.maoDeObra.length === 0 ? (
        <p className="text-sm text-slate-400">Não informado.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {data.maoDeObra.map((r, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="p-2">{r.funcao}</td>
                <td className="p-2 text-right">{r.quantidade} pessoas</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Section title="Equipamentos" />
      {data.equipamentos.length === 0 ? (
        <p className="text-sm text-slate-400">Não informado.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {data.equipamentos.map((r, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="p-2">{r.nome}</td>
                <td className="p-2 text-right">{r.quantidade}</td>
                <td className="p-2 text-right text-slate-500">{r.situacao}</td>
                <td className="p-2">
                  {r.fotos.length > 0 ? (
                    <div className="flex gap-1">
                      {r.fotos.map((f, j) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={j} src={f} alt="" className="h-10 w-10 rounded object-cover" />
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

      <Section title="Atividades Executadas" />
      {data.atividades.length === 0 ? (
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
            {data.atividades.map((r, i) => {
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
                    {STATUS_ATIVIDADE[r.status]?.label ?? r.status}
                  </td>
                  <td className="p-2">
                    {r.fotos.length > 0 ? (
                      <div className="flex gap-1">
                        {r.fotos.map((f, j) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={j} src={f} alt="" className="h-10 w-10 rounded object-cover" />
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

      <Section title="Controle de Materiais" />
      {data.materiais.length === 0 ? (
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
            {data.materiais.map((r, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="p-2">
                  {r.nome}
                  {r.observacao ? (
                    <span className="block text-xs text-slate-400">{r.observacao}</span>
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

      <Section title="Ocorrências" />
      {data.ocorrencias.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma ocorrência.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {data.ocorrencias.map((r, i) => (
            <li key={i}>
              <span className="font-semibold text-slate-700">
                [{TIPO_OCORRENCIA[r.tipo] ?? r.tipo}] {r.descricao}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Section title="Observações Gerais" />
      <p className="whitespace-pre-wrap text-sm">
        {data.observacoes || "Nenhuma observação."}
      </p>

      {data.anexos.length > 0 && <Section title="Anexos e Documentos" />}
      {data.anexos.length > 0 && (
        <ul className="space-y-1 text-sm">
          {data.anexos.map((a, i) => (
            <li key={i}>📎 {a.nome}</li>
          ))}
        </ul>
      )}

      {data.comentarios.length > 0 && <Section title="Comentários" />}
      {data.comentarios.length > 0 && (
        <ul className="space-y-1 text-sm">
          {data.comentarios.map((c) => (
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
        {data.serverId ? (
          <ExportWordButton rdoId={data.serverId} />
        ) : (
          <span className="inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-400">
            📄 Exportar Word (sincronize primeiro)
          </span>
        )}{" "}
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

function Section({ title }: { title: string }) {
  return (
    <h2 className="mt-6 mb-2 border-b border-slate-300 pb-1 text-sm font-bold uppercase tracking-wide text-slate-700">
      {title}
    </h2>
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

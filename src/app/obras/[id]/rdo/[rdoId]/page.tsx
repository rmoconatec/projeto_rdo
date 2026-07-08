"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ExportWordButton from "@/components/ExportWordButton";
import {
  CLIMA,
  CONDICAO,
  STATUS_ATIVIDADE,
  TIPO_OCORRENCIA,
  formatDate,
} from "@/lib/labels";

type MO = { funcao: string; quantidade: number };
type EQ = { nome: string; quantidade: number; situacao: string; fotos?: string[] };
type AT = {
  descricao: string;
  unidade: string;
  quantidadeTotal: number;
  quantidadeExecutada: number;
  progresso: number;
  status: string;
  fotos?: string[];
};
type OC = { tipo: string; descricao: string };
type CO = { id: number; autor: string; texto: string; createdAt: string };
type AN = { id?: number; nome: string; url: string; tipo?: string | null; tamanho?: number | null };
type MT = {
  nome: string;
  unidade: string;
  qtdEntrada: number;
  qtdUtilizada: number;
  observacao: string;
};

type RdoData = {
  id: number;
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
  obra: { id: number; nome: string };
  maoDeObra: MO[];
  equipamentos: EQ[];
  atividades: AT[];
  ocorrencias: OC[];
  comentarios: CO[];
  anexos: AN[];
  materiais: MT[];
};

export default function RdoEditor({
  params,
}: {
  params: Promise<{ id: string; rdoId: string }>;
}) {
  const { id, rdoId } = use(params);
  const router = useRouter();
  const [rdo, setRdo] = useState<RdoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // seções editáveis
  const [data, setData] = useState("");
  const [status, setStatus] = useState("rascunho");
  const [clima, setClima] = useState({
    climaManha: "bom",
    climaTarde: "bom",
    climaNoite: "bom",
    condicaoManha: "praticavel",
    condicaoTarde: "praticavel",
    condicaoNoite: "praticavel",
  });
  const [observacoes, setObservacoes] = useState("");
  const [mo, setMo] = useState<MO[]>([]);
  const [eqp, setEqp] = useState<EQ[]>([]);
  const [at, setAt] = useState<AT[]>([]);
  const [oc, setOc] = useState<OC[]>([]);
  const [comentarios, setComentarios] = useState<CO[]>([]);
  const [anexos, setAnexos] = useState<AN[]>([]);
  const [materiais, setMateriais] = useState<MT[]>([]);
  const [novoComentario, setNovoComentario] = useState({ autor: "", texto: "" });

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/rdos/${rdoId}`);
        if (cancelled) return;
        if (res.ok) {
          const d: RdoData = await res.json();
          setRdo(d);
          setData(d.data?.slice(0, 10) ?? "");
          setStatus(d.status);
          setClima({
            climaManha: d.climaManha ?? "bom",
            climaTarde: d.climaTarde ?? "bom",
            climaNoite: d.climaNoite ?? "bom",
            condicaoManha: d.condicaoManha ?? "praticavel",
            condicaoTarde: d.condicaoTarde ?? "praticavel",
            condicaoNoite: d.condicaoNoite ?? "praticavel",
          });
          setObservacoes(d.observacoes ?? "");
          setMo(d.maoDeObra ?? []);
          setEqp(d.equipamentos ?? []);
          setAt(d.atividades ?? []);
          setOc(d.ocorrencias ?? []);
          setComentarios(d.comentarios ?? []);
          setAnexos(d.anexos ?? []);
          setMateriais(d.materiais ?? []);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [rdoId]);

  async function salvar(novoStatus?: string) {
    setSaving(true);
    const st = novoStatus ?? status;
    await fetch(`/api/rdos/${rdoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data,
        status: st,
        ...clima,
        observacoes,
        maoDeObra: mo,
        equipamentos: eqp,
        atividades: at,
        ocorrencias: oc,
        anexos: anexos.map(({ id, ...a }) => a),
        materiais: materiais,
      }),
    });
    setStatus(st);
    setSaving(false);
    setSavedMsg("Salvo!");
    setTimeout(() => setSavedMsg(""), 2000);
  }

  async function excluir() {
    if (!confirm("Excluir este RDO?")) return;
    await fetch(`/api/rdos/${rdoId}`, { method: "DELETE" });
    router.push(`/obras/${id}`);
  }

  async function enviarComentario() {
    if (!novoComentario.texto.trim()) return;
    const res = await fetch(`/api/rdos/${rdoId}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoComentario),
    });
    if (res.ok) {
      const c = await res.json();
      setComentarios((prev) => [...prev, c]);
      setNovoComentario({ autor: novoComentario.autor, texto: "" });
    }
  }

  if (loading) return <p className="text-slate-500">Carregando...</p>;
  if (!rdo) return <p className="text-slate-500">RDO não encontrado.</p>;

  const totalEfetivo = mo.reduce((s, r) => s + (Number(r.quantidade) || 0), 0);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/obras/${id}`}
          className="text-sm text-orange-600 hover:underline"
        >
          ← {rdo.obra?.nome}
        </Link>
        <div className="flex items-center gap-2">
          {savedMsg && (
            <span className="text-sm font-medium text-emerald-600">
              {savedMsg}
            </span>
          )}
          <button
            onClick={excluir}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Excluir
          </button>
          <button
            onClick={() => salvar()}
            disabled={saving}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar rascunho"}
          </button>
          <button
            onClick={() => salvar("finalizado")}
            disabled={saving}
            className="rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            Finalizar RDO
          </button>
          <Link
            href={`/obras/${id}/rdo/${rdoId}/relatorio`}
            target="_blank"
            className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-1.5 text-sm font-semibold text-orange-600 hover:bg-orange-100"
          >
            🖨️ Gerar relatório
          </Link>
          <ExportWordButton rdoId={Number(rdoId)} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-xl font-bold text-white">
            {rdo.numero}
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              RDO #{rdo.numero}
            </h1>
            <p className="text-sm text-slate-500">
              {formatDate(data)} ·{" "}
              <span
                className={
                  status === "finalizado"
                    ? "text-emerald-600"
                    : "text-slate-500"
                }
              >
                {status === "finalizado" ? "Finalizado" : "Rascunho"}
              </span>
            </p>
          </div>
          <label className="ml-auto block">
            <span className="mb-1 block text-xs font-medium text-slate-500">
              Data do relatório
            </span>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </label>
        </div>
      </div>

      {/* Clima */}
      <Card title="Condições climáticas" icon="🌤️">
        <div className="grid gap-4 sm:grid-cols-3">
          {(["Manha", "Tarde", "Noite"] as const).map((p) => {
            const climaKey = `clima${p}` as keyof typeof clima;
            const condKey = `condicao${p}` as keyof typeof clima;
            return (
              <div key={p} className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  {p === "Manha" ? "Manhã" : p}
                </p>
                <select
                  value={clima[climaKey]}
                  onChange={(e) =>
                    setClima({ ...clima, [climaKey]: e.target.value })
                  }
                  className="mb-2 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                >
                  {Object.entries(CLIMA).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.icon} {v.label}
                    </option>
                  ))}
                </select>
                <select
                  value={clima[condKey]}
                  onChange={(e) =>
                    setClima({ ...clima, [condKey]: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                >
                  {Object.entries(CONDICAO).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Mão de obra */}
      <Card
        title="Mão de obra (efetivo)"
        icon="👷"
        action={
          <button
            onClick={() => setMo([...mo, { funcao: "", quantidade: 1 }])}
            className="btn-add"
          >
            + Adicionar
          </button>
        }
      >
        {mo.length === 0 && <Empty text="Nenhum efetivo registrado." />}
        <div className="space-y-2">
          {mo.map((r, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="Função (ex.: Pedreiro)"
                value={r.funcao}
                onChange={(e) =>
                  setMo(mo.map((x, j) => (j === i ? { ...x, funcao: e.target.value } : x)))
                }
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
              <input
                type="number"
                min={0}
                value={r.quantidade === 0 ? "" : r.quantidade}
                onChange={(e) =>
                  setMo(
                    mo.map((x, j) =>
                      j === i
                        ? {
                            ...x,
                            quantidade:
                              e.target.value === "" ? 0 : Number(e.target.value),
                          }
                        : x
                    )
                  )
                }
                className="w-20 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
              <RemoveBtn onClick={() => setMo(mo.filter((_, j) => j !== i))} />
            </div>
          ))}
        </div>
        {mo.length > 0 && (
          <p className="mt-2 text-right text-sm font-medium text-slate-600">
            Total de efetivo: {totalEfetivo}
          </p>
        )}
      </Card>

      {/* Equipamentos */}
      <Card
        title="Equipamentos"
        icon="🚜"
        action={
          <button
            onClick={() =>
              setEqp([
                ...eqp,
                { nome: "", quantidade: 1, situacao: "operando", fotos: [] },
              ])
            }
            className="btn-add"
          >
            + Adicionar
          </button>
        }
      >
        {eqp.length === 0 && <Empty text="Nenhum equipamento registrado." />}
        <div className="space-y-3">
          {eqp.map((r, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200 p-3 space-y-2"
            >
              <div className="flex gap-2">
                <input
                  placeholder="Equipamento (ex.: Betoneira)"
                  value={r.nome}
                  onChange={(e) =>
                    setEqp(
                      eqp.map((x, j) =>
                        j === i ? { ...x, nome: e.target.value } : x
                      )
                    )
                  }
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  value={r.quantidade === 0 ? "" : r.quantidade}
                  onChange={(e) =>
                    setEqp(
                      eqp.map((x, j) =>
                        j === i
                          ? {
                              ...x,
                              quantidade:
                                e.target.value === ""
                                  ? 0
                                  : Number(e.target.value),
                            }
                          : x
                      )
                    )
                  }
                  className="w-20 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
                <select
                  value={r.situacao}
                  onChange={(e) =>
                    setEqp(
                      eqp.map((x, j) =>
                        j === i ? { ...x, situacao: e.target.value } : x
                      )
                    )
                  }
                  className="w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                >
                  <option value="operando">Operando</option>
                  <option value="parado">Parado</option>
                  <option value="manutencao">Manutenção</option>
                </select>
                <RemoveBtn onClick={() => setEqp(eqp.filter((_, j) => j !== i))} />
              </div>
              <PhotosInput
                values={r.fotos ?? []}
                onChange={(fotos) =>
                  setEqp(
                    eqp.map((x, j) => (j === i ? { ...x, fotos } : x))
                  )
                }
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Atividades */}
      <Card
        title="Atividades executadas"
        icon="🧱"
        action={
          <button
            onClick={() =>
              setAt([
                ...at,
                {
                  descricao: "",
                  unidade: "un",
                  quantidadeTotal: 0,
                  quantidadeExecutada: 0,
                  progresso: 0,
                  status: "paralisada",
                  fotos: [],
                },
              ])
            }
            className="btn-add"
          >
            + Adicionar
          </button>
        }
      >
        {at.length === 0 && <Empty text="Nenhuma atividade registrada." />}
        <div className="space-y-3">
          {at.map((r, i) => {
            // cálculo automático do progresso
            const total = Math.max(0, r.quantidadeTotal || 0);
            const exec = Math.max(0, r.quantidadeExecutada || 0);
            const pct = total > 0 ? Math.min(100, Math.round((exec / total) * 100)) : 0;
            // status automático
            const autoStatus =
              pct >= 100
                ? "concluida"
                : exec > 0
                  ? "em_andamento"
                  : "paralisada";

            function updateAt(partial: Partial<AT>) {
              setAt(at.map((x, j) => (j === i ? { ...x, ...partial } : x)));
            }

            return (
              <div
                key={i}
                className="rounded-lg border border-slate-200 p-3 space-y-2"
              >
                {/* Descrição + remover */}
                <div className="flex gap-2">
                  <input
                    placeholder="Descrição da atividade"
                    value={r.descricao}
                    onChange={(e) => updateAt({ descricao: e.target.value })}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                  <RemoveBtn onClick={() => setAt(at.filter((_, j) => j !== i))} />
                </div>

                {/* Unidade + Qtde Total + Qtde Executada */}
                <div className="flex flex-wrap items-end gap-2">
                  <label className="block min-w-20">
                    <span className="mb-0.5 block text-xs font-medium text-slate-500">
                      Unidade
                    </span>
                    <select
                      value={r.unidade}
                      onChange={(e) => updateAt({ unidade: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                    >
                      <option value="un">un</option>
                      <option value="m²">m²</option>
                      <option value="m³">m³</option>
                      <option value="m">m</option>
                      <option value="kg">kg</option>
                      <option value="t">t</option>
                      <option value="h">h</option>
                      <option value="dias">dias</option>
                      <option value="l">l</option>
                      <option value="pç">pç</option>
                    </select>
                  </label>
                  <label className="block min-w-24">
                    <span className="mb-0.5 block text-xs font-medium text-slate-500">
                      Qtde. Total
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={r.quantidadeTotal === 0 ? "" : r.quantidadeTotal}
                      onChange={(e) =>
                        updateAt({
                          quantidadeTotal:
                            e.target.value === "" ? 0 : Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                    />
                  </label>
                  <label className="block min-w-24">
                    <span className="mb-0.5 block text-xs font-medium text-slate-500">
                      Qtde. Executada
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={r.quantidadeTotal || 0}
                      value={
                        r.quantidadeExecutada === 0
                          ? ""
                          : r.quantidadeExecutada
                      }
                      onChange={(e) =>
                        updateAt({
                          quantidadeExecutada: Math.min(
                            e.target.value === ""
                              ? 0
                              : Number(e.target.value),
                            r.quantidadeTotal || 0
                          ),
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                    />
                  </label>
                </div>

                {/* Barra de progresso + percentual + status automático */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pct >= 100
                            ? "bg-emerald-500"
                            : pct > 0
                              ? "bg-orange-500"
                              : "bg-slate-300"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-12 text-right text-sm font-bold text-slate-700">
                    {pct}%
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_ATIVIDADE[autoStatus]?.cls ?? "bg-slate-100"
                    }`}
                  >
                    {STATUS_ATIVIDADE[autoStatus]?.label ?? autoStatus}
                  </span>
                </div>

                {/* Fotos */}
                <PhotosInput
                  values={r.fotos ?? []}
                  onChange={(fotos) => updateAt({ fotos })}
                />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Ocorrências */}
      <Card
        title="Ocorrências"
        icon="⚠️"
        action={
          <button
            onClick={() => setOc([...oc, { tipo: "geral", descricao: "" }])}
            className="btn-add"
          >
            + Adicionar
          </button>
        }
      >
        {oc.length === 0 && <Empty text="Nenhuma ocorrência registrada." />}
        <div className="space-y-2">
          {oc.map((r, i) => (
            <div key={i} className="flex gap-2">
              <select
                value={r.tipo}
                onChange={(e) =>
                  setOc(oc.map((x, j) => (j === i ? { ...x, tipo: e.target.value } : x)))
                }
                className="w-40 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              >
                {Object.entries(TIPO_OCORRENCIA).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <input
                placeholder="Descrição da ocorrência"
                value={r.descricao}
                onChange={(e) =>
                  setOc(
                    oc.map((x, j) =>
                      j === i ? { ...x, descricao: e.target.value } : x
                    )
                  )
                }
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
              <RemoveBtn onClick={() => setOc(oc.filter((_, j) => j !== i))} />
            </div>
          ))}
        </div>
      </Card>

      {/* Controle de materiais */}
      <Card
        title="Controle de materiais"
        icon="📦"
        action={
          <button
            onClick={() =>
              setMateriais([
                ...materiais,
                {
                  nome: "",
                  unidade: "un",
                  qtdEntrada: 0,
                  qtdUtilizada: 0,
                  observacao: "",
                },
              ])
            }
            className="btn-add"
          >
            + Adicionar
          </button>
        }
      >
        {materiais.length === 0 && (
          <Empty text="Nenhum material registrado." />
        )}
        <div className="space-y-3">
          {materiais.map((r, i) => {
            const saldo = r.qtdEntrada - r.qtdUtilizada;
            return (
              <div
                key={i}
                className="rounded-lg border border-slate-200 p-3 space-y-2"
              >
                <div className="flex gap-2">
                  <input
                    placeholder="Material (ex.: Cimento CP-II)"
                    value={r.nome}
                    onChange={(e) =>
                      setMateriais(
                        materiais.map((x, j) =>
                          j === i ? { ...x, nome: e.target.value } : x
                        )
                      )
                    }
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                  <RemoveBtn
                    onClick={() =>
                      setMateriais(materiais.filter((_, j) => j !== i))
                    }
                  />
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="block w-24">
                    <span className="mb-0.5 block text-xs font-medium text-slate-500">
                      Unidade
                    </span>
                    <select
                      value={r.unidade}
                      onChange={(e) =>
                        setMateriais(
                          materiais.map((x, j) =>
                            j === i ? { ...x, unidade: e.target.value } : x
                          )
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                    >
                      <option value="un">un</option>
                      <option value="m²">m²</option>
                      <option value="m³">m³</option>
                      <option value="m">m</option>
                      <option value="kg">kg</option>
                      <option value="t">t</option>
                      <option value="l">l</option>
                      <option value="saco">saco</option>
                      <option value="pç">pç</option>
                    </select>
                  </label>
                  <label className="block w-28">
                    <span className="mb-0.5 block text-xs font-medium text-slate-500">
                      Qtd. Chegada
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={r.qtdEntrada === 0 ? "" : r.qtdEntrada}
                      onChange={(e) =>
                        setMateriais(
                          materiais.map((x, j) =>
                            j === i
                              ? {
                                  ...x,
                                  qtdEntrada:
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value),
                                }
                              : x
                          )
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                    />
                  </label>
                  <label className="block w-28">
                    <span className="mb-0.5 block text-xs font-medium text-slate-500">
                      Qtd. Utilizada
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={r.qtdEntrada || 0}
                      value={r.qtdUtilizada === 0 ? "" : r.qtdUtilizada}
                      onChange={(e) =>
                        setMateriais(
                          materiais.map((x, j) =>
                            j === i
                              ? {
                                  ...x,
                                  qtdUtilizada: Math.min(
                                    e.target.value === ""
                                      ? 0
                                      : Number(e.target.value),
                                    r.qtdEntrada || 0
                                  ),
                                }
                              : x
                          )
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                    />
                  </label>
                  <div className="flex-1 text-right">
                    <span className="text-xs font-medium text-slate-500">
                      Saldo:{" "}
                    </span>
                    <span className="text-sm font-bold text-slate-700">
                      {saldo} {r.unidade}
                    </span>
                  </div>
                </div>
                <input
                  placeholder="Observação (ex.: Nota fiscal 1234)"
                  value={r.observacao ?? ""}
                  onChange={(e) =>
                    setMateriais(
                      materiais.map((x, j) =>
                        j === i ? { ...x, observacao: e.target.value } : x
                      )
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Anexos / documentos */}
      <Card title="Anexos e documentos" icon="📎">
        <AnexosInput values={anexos} onChange={setAnexos} />
      </Card>

      {/* Observações gerais */}
      <Card title="Observações gerais" icon="📝">
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Anotações gerais sobre o dia de trabalho..."
          className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </Card>

      {/* Comentários */}
      <Card title="Comentários" icon="💬">
        <div className="space-y-3">
          {comentarios.length === 0 && (
            <Empty text="Nenhum comentário ainda." />
          )}
          {comentarios.map((c) => (
            <div
              key={c.id}
              className="rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <p className="font-semibold text-slate-700">{c.autor}</p>
              <p className="text-slate-600">{c.texto}</p>
            </div>
          ))}
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              placeholder="Seu nome"
              value={novoComentario.autor}
              onChange={(e) =>
                setNovoComentario({ ...novoComentario, autor: e.target.value })
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm sm:w-40"
            />
            <input
              placeholder="Escreva um comentário..."
              value={novoComentario.texto}
              onChange={(e) =>
                setNovoComentario({ ...novoComentario, texto: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && enviarComentario()}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
            <button
              onClick={enviarComentario}
              className="rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Enviar
            </button>
          </div>
        </div>
      </Card>

      <style jsx global>{`
        .btn-add {
          border-radius: 0.5rem;
          border: 1px solid #fdba74;
          background: #fff7ed;
          color: #ea580c;
          padding: 0.25rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .btn-add:hover {
          background: #ffedd5;
        }
      `}</style>
    </div>
  );
}

function Card({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <span>{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-2 text-sm text-slate-400">{text}</p>;
}

function AnexosInput({
  values,
  onChange,
}: {
  values: AN[];
  onChange: (anexos: AN[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fileIcons: Record<string, string> = {
    "application/pdf": "📄",
    "application/msword": "📝",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "📝",
    "application/vnd.ms-excel": "📊",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📊",
    "image/": "🖼️",
    "text/": "📃",
  };

  function iconFor(tipo?: string | null) {
    if (!tipo) return "📎";
    for (const [k, v] of Object.entries(fileIcons)) {
      if (tipo.startsWith(k)) return v;
    }
    return "📎";
  }

  function formatSize(bytes?: number | null) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError("");
    setUploading(true);
    const added: AN[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-doc", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Falha ao anexar arquivo");
        continue;
      }
      const j = await res.json();
      added.push({
        nome: j.nome || file.name,
        url: j.url,
        tipo: j.tipo,
        tamanho: j.tamanho,
      });
    }
    setUploading(false);
    if (added.length) onChange([...values, ...added]);
  }

  return (
    <div className="space-y-2">
      {values.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {values.map((a, idx) => (
            <li
              key={idx}
              className="flex items-center gap-2 px-3 py-2 text-sm"
            >
              <span className="text-lg">{iconFor(a.tipo)}</span>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate font-medium text-orange-600 hover:underline"
                title={a.nome}
              >
                {a.nome}
              </a>
              {a.tamanho ? (
                <span className="text-xs text-slate-400">
                  {formatSize(a.tamanho)}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => onChange(values.filter((_, j) => j !== idx))}
                className="rounded px-1.5 text-slate-400 hover:text-red-500"
                title="Remover anexo"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          📎 <span>Anexar documento</span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
        </label>
        {uploading && (
          <span className="text-xs text-slate-500">Enviando...</span>
        )}
        {values.length > 0 && (
          <span className="ml-auto text-xs text-slate-400">
            {values.length} anexo(s)
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-lg border border-slate-200 px-2 text-slate-400 hover:border-red-300 hover:text-red-500"
      title="Remover"
    >
      ✕
    </button>
  );
}

function PhotosInput({
  values,
  onChange,
}: {
  values: string[];
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // permite reenviar o mesmo arquivo
    if (files.length === 0) return;
    setError("");
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Falha ao enviar foto");
        continue;
      }
      const { url } = await res.json();
      uploaded.push(url);
    }
    setUploading(false);
    if (uploaded.length) onChange([...values, ...uploaded]);
  }

  return (
    <div className="space-y-2">
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((url, idx) => (
            <div key={idx} className="group relative">
              <a href={url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Foto ${idx + 1}`}
                  className="h-20 w-20 rounded-md object-cover ring-1 ring-slate-200"
                />
              </a>
              <button
                type="button"
                onClick={() => onChange(values.filter((_, j) => j !== idx))}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow ring-2 ring-white hover:bg-red-600"
                title="Remover foto"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <label
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100"
          title="Usar a câmera do dispositivo"
        >
          📷 <span>Tirar foto</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFiles}
          />
        </label>
        <label
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          title="Anexar uma ou mais fotos do dispositivo"
        >
          📎 <span>Anexar foto</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
        </label>
        {uploading && (
          <span className="text-xs text-slate-500">Enviando...</span>
        )}
        {values.length > 0 && (
          <span className="ml-auto text-xs text-slate-400">
            {values.length} foto(s)
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

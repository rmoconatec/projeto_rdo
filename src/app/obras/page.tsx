"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STATUS_OBRA, formatDate } from "@/lib/labels";

type Obra = {
  id: number;
  nome: string;
  cliente: string | null;
  endereco: string | null;
  responsavel: string | null;
  status: string;
  dataInicio: string | null;
  previsaoTermino: string | null;
  totalRdos: number;
};

const empty = {
  nome: "",
  cliente: "",
  endereco: "",
  responsavel: "",
  descricao: "",
  status: "em_andamento",
  dataInicio: "",
  previsaoTermino: "",
};

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  async function load() {
    setObras(await fetch("/api/obras").then((r) => r.json()));
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/obras")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setObras(data);
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) return;
    setSaving(true);
    await fetch("/api/obras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm(empty);
    setShowForm(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Obras</h1>
          <p className="text-sm text-slate-500">
            Cadastre e acompanhe suas obras.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-orange-600"
        >
          {showForm ? "Fechar" : "+ Nova obra"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2"
        >
          <Field label="Nome da obra *" className="sm:col-span-2">
            <input
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="inp"
              placeholder="Ex.: Edifício Aurora"
            />
          </Field>
          <Field label="Cliente">
            <input
              value={form.cliente}
              onChange={(e) => setForm({ ...form, cliente: e.target.value })}
              className="inp"
            />
          </Field>
          <Field label="Responsável técnico">
            <input
              value={form.responsavel}
              onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
              className="inp"
            />
          </Field>
          <Field label="Endereço" className="sm:col-span-2">
            <input
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
              className="inp"
            />
          </Field>
          <Field label="Data de início">
            <input
              type="date"
              value={form.dataInicio}
              onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
              className="inp"
            />
          </Field>
          <Field label="Previsão de término">
            <input
              type="date"
              value={form.previsaoTermino}
              onChange={(e) =>
                setForm({ ...form, previsaoTermino: e.target.value })
              }
              className="inp"
            />
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="inp"
            >
              {Object.entries(STATUS_OBRA).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Descrição" className="sm:col-span-2">
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="inp min-h-20"
            />
          </Field>
          <div className="sm:col-span-2">
            <button
              disabled={saving}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Cadastrar obra"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : obras.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Nenhuma obra cadastrada. Clique em “Nova obra” para começar.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {obras.map((o) => (
            <Link
              key={o.id}
              href={`/obras/${o.id}`}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900 group-hover:text-orange-600">
                  {o.nome}
                </h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_OBRA[o.status]?.cls ?? "bg-slate-100"
                  }`}
                >
                  {STATUS_OBRA[o.status]?.label ?? o.status}
                </span>
              </div>
              {o.cliente && (
                <p className="mt-1 text-sm text-slate-500">👤 {o.cliente}</p>
              )}
              {o.endereco && (
                <p className="text-sm text-slate-500">📍 {o.endereco}</p>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>Início: {formatDate(o.dataInicio)}</span>
                <span className="font-semibold text-orange-600">
                  {o.totalRdos} RDO(s)
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style jsx global>{`
        .inp {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #cbd5e1;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          background: white;
        }
        .inp:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

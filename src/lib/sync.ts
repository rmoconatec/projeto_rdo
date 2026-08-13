import { localDb, type DexieObra, type DexieRdo } from "@/db/dexie";

export type SyncEvent = "start" | "progress" | "done" | "error";
export type SyncListener = (event: SyncEvent, message?: string) => void;

const listeners = new Set<SyncListener>();

export function onSync(fn: SyncListener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function notify(event: SyncEvent, message?: string) {
  listeners.forEach((fn) => fn(event, message));
}

async function pullAllFromServer() {
  const obrasRes = await fetch("/api/obras");
  if (!obrasRes.ok) throw new Error("Falha ao buscar obras do servidor");
  const obras: any[] = await obrasRes.json();

  for (const o of obras) {
    const localId = o.id.toString();
    const existing = await localDb.obras.get(localId);
    if (existing?.syncStatus === "synced") continue;

    await localDb.obras.put({
      id: localId,
      nome: o.nome,
      cliente: o.cliente,
      endereco: o.endereco,
      responsavel: o.responsavel,
      descricao: o.descricao,
      status: o.status,
      dataInicio: o.dataInicio,
      previsaoTermino: o.previsaoTermino,
      createdAt: o.createdAt,
      serverId: o.id,
      syncStatus: "synced",
    });

    const detailRes = await fetch(`/api/obras/${o.id}`);
    if (!detailRes.ok) continue;
    const detail: any = await detailRes.json();
    const rdos: any[] = detail.rdos ?? [];

    for (const r of rdos) {
      await syncRdoFromServer(r.id, localId, r.numero);
    }
  }
}

async function syncRdoFromServer(serverId: number, obraLocalId: string, numero: number) {
  const res = await fetch(`/api/rdos/${serverId}`);
  if (!res.ok) return;
  const d: any = await res.json();

  const localId = serverId.toString();
  await localDb.rdos.put({
    id: localId,
    obraId: obraLocalId,
    numero,
    data: d.data,
    status: d.status,
    climaManha: d.climaManha ?? "bom",
    climaTarde: d.climaTarde ?? "bom",
    climaNoite: d.climaNoite ?? "bom",
    condicaoManha: d.condicaoManha ?? "praticavel",
    condicaoTarde: d.condicaoTarde ?? "praticavel",
    condicaoNoite: d.condicaoNoite ?? "praticavel",
    observacoes: d.observacoes ?? null,
    createdAt: d.createdAt,
    serverId,
    syncStatus: "synced",
  });

  const childOpts = { rdoId: localId, serverId: null, syncStatus: "synced" as const };

  await localDb.maoDeObra.bulkPut(
    (d.maoDeObra || []).map((r: any) => ({
      ...childOpts, id: crypto.randomUUID(),
      funcao: r.funcao, quantidade: r.quantidade,
    }))
  );
  await localDb.equipamentos.bulkPut(
    (d.equipamentos || []).map((r: any) => ({
      ...childOpts, id: crypto.randomUUID(),
      nome: r.nome, quantidade: r.quantidade,
      situacao: r.situacao ?? "operando", fotos: r.fotos ?? [],
    }))
  );
  await localDb.atividades.bulkPut(
    (d.atividades || []).map((r: any) => ({
      ...childOpts, id: crypto.randomUUID(),
      descricao: r.descricao, unidade: r.unidade ?? "un",
      quantidadeTotal: r.quantidadeTotal ?? 0, quantidadeExecutada: r.quantidadeExecutada ?? 0,
      progresso: r.progresso ?? 0, status: r.status ?? "em_andamento",
      fotos: r.fotos ?? [],
    }))
  );
  await localDb.ocorrencias.bulkPut(
    (d.ocorrencias || []).map((r: any) => ({
      ...childOpts, id: crypto.randomUUID(),
      tipo: r.tipo ?? "geral", descricao: r.descricao,
    }))
  );
  await localDb.comentarios.bulkPut(
    (d.comentarios || []).map((r: any) => ({
      ...childOpts, id: crypto.randomUUID(),
      autor: r.autor, texto: r.texto, createdAt: r.createdAt,
    }))
  );
  await localDb.anexos.bulkPut(
    (d.anexos || []).map((r: any) => ({
      ...childOpts, id: crypto.randomUUID(),
      nome: r.nome, url: r.url, tipo: r.tipo ?? null, tamanho: r.tamanho ?? null,
    }))
  );
  await localDb.materiais.bulkPut(
    (d.materiais || []).map((r: any) => ({
      ...childOpts, id: crypto.randomUUID(),
      nome: r.nome, unidade: r.unidade ?? "un",
      qtdEntrada: r.qtdEntrada ?? 0, qtdUtilizada: r.qtdUtilizada ?? 0,
      observacao: r.observacao ?? null,
    }))
  );
}

function stripMeta<T extends { id?: string; rdoId?: string; serverId?: number | null; syncStatus?: string }>(obj: T) {
  const { id: _id, rdoId: _r, serverId: _s, syncStatus: _ss, ...rest } = obj;
  return rest;
}

async function pushObra(obra: DexieObra) {
  const body = stripMeta(obra);
  if (obra.serverId) {
    const res = await fetch(`/api/obras/${obra.serverId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Falha ao atualizar obra "${obra.nome}"`);
  } else {
    const res = await fetch("/api/obras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Falha ao criar obra "${obra.nome}"`);
    const created = await res.json();
    const serverIdStr = created.id.toString();
    obra.serverId = created.id;
    obra.id = serverIdStr;
    obra.syncStatus = "synced";
    await localDb.obras.put(obra);
    await localDb.rdos.where("obraId").equals(obra.id).modify({ obraId: serverIdStr });
  }
}

async function pushRdo(rdo: DexieRdo) {
  const obra = await localDb.obras.get(rdo.obraId);
  if (!obra) throw new Error(`Obra não encontrada para o RDO #${rdo.numero}`);

  const [mo, eqp, at, oc, an, mt] = await Promise.all([
    localDb.maoDeObra.where("rdoId").equals(rdo.id).toArray(),
    localDb.equipamentos.where("rdoId").equals(rdo.id).toArray(),
    localDb.atividades.where("rdoId").equals(rdo.id).toArray(),
    localDb.ocorrencias.where("rdoId").equals(rdo.id).toArray(),
    localDb.anexos.where("rdoId").equals(rdo.id).toArray(),
    localDb.materiais.where("rdoId").equals(rdo.id).toArray(),
  ]);

  const payload: Record<string, any> = {
    data: rdo.data,
    status: rdo.status,
    climaManha: rdo.climaManha,
    climaTarde: rdo.climaTarde,
    climaNoite: rdo.climaNoite,
    condicaoManha: rdo.condicaoManha,
    condicaoTarde: rdo.condicaoTarde,
    condicaoNoite: rdo.condicaoNoite,
    observacoes: rdo.observacoes,
    maoDeObra: mo.map(stripMeta),
    equipamentos: eqp.map(stripMeta),
    atividades: at.map(stripMeta),
    ocorrencias: oc.map(stripMeta),
    anexos: an.map(({ ...a }) => ({ nome: a.nome, url: a.url, tipo: a.tipo, tamanho: a.tamanho })),
    materiais: mt.map(stripMeta),
  };

  if (rdo.serverId) {
    const res = await fetch(`/api/rdos/${rdo.serverId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Falha ao sincronizar RDO #${rdo.numero}`);
  } else {
    const mappedObraId = obra.serverId ?? obra.id;
    const res = await fetch(`/api/obras/${mappedObraId}/rdos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: rdo.data }),
    });
    if (!res.ok) throw new Error(`Falha ao criar RDO #${rdo.numero}`);
    const created = await res.json();
    rdo.serverId = created.id;

    const putRes = await fetch(`/api/rdos/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, data: created.data }),
    });
    if (!putRes.ok) throw new Error(`Falha ao enviar dados do RDO #${rdo.numero}`);
  }

  rdo.syncStatus = "synced";
  await localDb.rdos.put(rdo);

  const tables = [
    localDb.maoDeObra, localDb.equipamentos, localDb.atividades,
    localDb.ocorrencias, localDb.anexos, localDb.materiais,
  ];
  for (const t of tables) {
    await (t as any).where("rdoId").equals(rdo.id).modify({ syncStatus: "synced" });
  }
}

export async function runSync() {
  if (!navigator.onLine) {
    notify("error", "Sem conexão com a internet");
    return;
  }

  notify("start", "Iniciando sincronização...");

  try {
    const pendingObras = await localDb.obras.where("syncStatus").equals("pending").count();
    const pendingRdos = await localDb.rdos.where("syncStatus").equals("pending").count();
    const total = pendingObras + pendingRdos;

    if (total === 0) {
      notify("progress", "Verificando dados no servidor...");
      await pullAllFromServer();
      notify("done", "Todos os dados estão sincronizados!");
      return;
    }

    if (pendingObras > 0) {
      notify("progress", `Sincronizando ${pendingObras} obra(s)...`);
      const obras = await localDb.obras.where("syncStatus").equals("pending").toArray();
      for (const obra of obras) await pushObra(obra);
    }

    if (pendingRdos > 0) {
      notify("progress", `Sincronizando ${pendingRdos} RDO(s)...`);
      const rdos = await localDb.rdos.where("syncStatus").equals("pending").toArray();
      for (const rdo of rdos) await pushRdo(rdo);
    }

    notify("done", "Sincronização concluída!");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    notify("error", msg);
  }
}

export async function pullFromServer() {
  if (!navigator.onLine) return;
  notify("start", "Baixando dados do servidor...");
  try {
    await pullAllFromServer();
    notify("done", "Dados baixados com sucesso!");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    notify("error", msg);
  }
}

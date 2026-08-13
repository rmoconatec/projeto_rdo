import Dexie, { type Table } from "dexie";

export type SyncStatus = "pending" | "synced";

export interface DexieObra {
  id: string;
  nome: string;
  cliente: string | null;
  endereco: string | null;
  responsavel: string | null;
  descricao: string | null;
  status: string;
  dataInicio: string | null;
  previsaoTermino: string | null;
  createdAt: string;
  serverId: number | null;
  syncStatus: SyncStatus;
}

export interface DexieRdo {
  id: string;
  obraId: string;
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
  createdAt: string;
  serverId: number | null;
  syncStatus: SyncStatus;
}

export interface DexieMaoDeObra {
  id?: string;
  rdoId: string;
  funcao: string;
  quantidade: number;
  serverId: number | null;
  syncStatus: SyncStatus;
}

export interface DexieEquipamento {
  id?: string;
  rdoId: string;
  nome: string;
  quantidade: number;
  situacao: string;
  fotos: string[];
  serverId: number | null;
  syncStatus: SyncStatus;
}

export interface DexieAtividade {
  id?: string;
  rdoId: string;
  descricao: string;
  unidade: string;
  quantidadeTotal: number;
  quantidadeExecutada: number;
  progresso: number;
  status: string;
  fotos: string[];
  serverId: number | null;
  syncStatus: SyncStatus;
}

export interface DexieOcorrencia {
  id?: string;
  rdoId: string;
  tipo: string;
  descricao: string;
  serverId: number | null;
  syncStatus: SyncStatus;
}

export interface DexieComentario {
  id?: string;
  rdoId: string;
  autor: string;
  texto: string;
  createdAt: string;
  serverId: number | null;
  syncStatus: SyncStatus;
}

export interface DexieAnexo {
  id?: string;
  rdoId: string;
  nome: string;
  url: string;
  tipo: string | null;
  tamanho: number | null;
  serverId: number | null;
  syncStatus: SyncStatus;
}

export interface DexieMaterial {
  id?: string;
  rdoId: string;
  nome: string;
  unidade: string;
  qtdEntrada: number;
  qtdUtilizada: number;
  observacao: string | null;
  serverId: number | null;
  syncStatus: SyncStatus;
}

class LocalDB extends Dexie {
  obras!: Table<DexieObra, string>;
  rdos!: Table<DexieRdo, string>;
  maoDeObra!: Table<DexieMaoDeObra, string>;
  equipamentos!: Table<DexieEquipamento, string>;
  atividades!: Table<DexieAtividade, string>;
  ocorrencias!: Table<DexieOcorrencia, string>;
  comentarios!: Table<DexieComentario, string>;
  anexos!: Table<DexieAnexo, string>;
  materiais!: Table<DexieMaterial, string>;

  constructor() {
    super("projeto_rdo");
    this.version(1).stores({
      obras: "id, nome, status, syncStatus, serverId",
      rdos: "id, obraId, numero, syncStatus, serverId",
      maoDeObra: "id, rdoId, syncStatus",
      equipamentos: "id, rdoId, syncStatus",
      atividades: "id, rdoId, syncStatus",
      ocorrencias: "id, rdoId, syncStatus",
      comentarios: "id, rdoId, syncStatus",
      anexos: "id, rdoId, syncStatus",
      materiais: "id, rdoId, syncStatus",
    });
  }
}

export const localDb = new LocalDB();

export function genId(): string {
  return crypto.randomUUID();
}

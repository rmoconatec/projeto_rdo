import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  date,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";

// Obras (construction projects / sites)
export const obras = pgTable("obras", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  cliente: text("cliente"),
  endereco: text("endereco"),
  responsavel: text("responsavel"),
  descricao: text("descricao"),
  status: varchar("status", { length: 30 }).notNull().default("em_andamento"),
  dataInicio: date("data_inicio"),
  previsaoTermino: date("previsao_termino"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// RDO - Relatório Diário de Obra
export const rdos = pgTable("rdos", {
  id: serial("id").primaryKey(),
  obraId: integer("obra_id")
    .notNull()
    .references(() => obras.id, { onDelete: "cascade" }),
  numero: integer("numero").notNull(),
  data: date("data").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("rascunho"),
  // Clima por período: manha / tarde / noite -> bom | nublado | chuvoso | impraticavel
  climaManha: varchar("clima_manha", { length: 20 }).default("bom"),
  climaTarde: varchar("clima_tarde", { length: 20 }).default("bom"),
  climaNoite: varchar("clima_noite", { length: 20 }).default("bom"),
  // Condição de trabalho por período: praticavel | impraticavel
  condicaoManha: varchar("condicao_manha", { length: 20 }).default("praticavel"),
  condicaoTarde: varchar("condicao_tarde", { length: 20 }).default("praticavel"),
  condicaoNoite: varchar("condicao_noite", { length: 20 }).default("praticavel"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Mão de obra / efetivo
export const maoDeObra = pgTable("mao_de_obra", {
  id: serial("id").primaryKey(),
  rdoId: integer("rdo_id")
    .notNull()
    .references(() => rdos.id, { onDelete: "cascade" }),
  funcao: text("funcao").notNull(),
  quantidade: integer("quantidade").notNull().default(1),
});

// Equipamentos
export const equipamentos = pgTable("equipamentos", {
  id: serial("id").primaryKey(),
  rdoId: integer("rdo_id")
    .notNull()
    .references(() => rdos.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  quantidade: integer("quantidade").notNull().default(1),
  situacao: varchar("situacao", { length: 20 }).default("operando"),
  fotos: jsonb("fotos").$type<string[]>().default([]).notNull(),
});

// Atividades executadas
export const atividades = pgTable("atividades", {
  id: serial("id").primaryKey(),
  rdoId: integer("rdo_id")
    .notNull()
    .references(() => rdos.id, { onDelete: "cascade" }),
  descricao: text("descricao").notNull(),
  unidade: varchar("unidade", { length: 10 }).default("un"),
  quantidadeTotal: integer("quantidade_total").notNull().default(0),
  quantidadeExecutada: integer("quantidade_executada").notNull().default(0),
  progresso: integer("progresso").notNull().default(0),
  status: varchar("status", { length: 20 }).default("em_andamento"),
  fotos: jsonb("fotos").$type<string[]>().default([]).notNull(),
});

// Ocorrências / observações relevantes
export const ocorrencias = pgTable("ocorrencias", {
  id: serial("id").primaryKey(),
  rdoId: integer("rdo_id")
    .notNull()
    .references(() => rdos.id, { onDelete: "cascade" }),
  tipo: varchar("tipo", { length: 30 }).notNull().default("geral"),
  descricao: text("descricao").notNull(),
});

// Comentários / colaboração
export const comentarios = pgTable("comentarios", {
  id: serial("id").primaryKey(),
  rdoId: integer("rdo_id")
    .notNull()
    .references(() => rdos.id, { onDelete: "cascade" }),
  autor: text("autor").notNull(),
  texto: text("texto").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Anexos / documentos do RDO
export const anexos = pgTable("anexos", {
  id: serial("id").primaryKey(),
  rdoId: integer("rdo_id")
    .notNull()
    .references(() => rdos.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  url: text("url").notNull(),
  tipo: varchar("tipo", { length: 60 }),
  tamanho: integer("tamanho"),
});

// Controle de materiais (chegada e utilização)
export const materiais = pgTable("materiais", {
  id: serial("id").primaryKey(),
  rdoId: integer("rdo_id")
    .notNull()
    .references(() => rdos.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  unidade: varchar("unidade", { length: 10 }).default("un"),
  qtdEntrada: integer("qtd_entrada").notNull().default(0),
  qtdUtilizada: integer("qtd_utilizada").notNull().default(0),
  observacao: text("observacao"),
});

export type Obra = typeof obras.$inferSelect;
export type NewObra = typeof obras.$inferInsert;
export type Rdo = typeof rdos.$inferSelect;
export type MaoDeObra = typeof maoDeObra.$inferSelect;
export type Equipamento = typeof equipamentos.$inferSelect;
export type Atividade = typeof atividades.$inferSelect;
export type Ocorrencia = typeof ocorrencias.$inferSelect;
export type Comentario = typeof comentarios.$inferSelect;

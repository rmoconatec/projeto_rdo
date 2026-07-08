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
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rdoId = Number(id);
  const [rdo] = await db.select().from(rdos).where(eq(rdos.id, rdoId));
  if (!rdo) {
    return Response.json({ error: "RDO não encontrado" }, { status: 404 });
  }
  const [obra] = await db.select().from(obras).where(eq(obras.id, rdo.obraId));
  const [mo, eq_, at, oc, co, an, mt] = await Promise.all([
    db.select().from(maoDeObra).where(eq(maoDeObra.rdoId, rdoId)),
    db.select().from(equipamentos).where(eq(equipamentos.rdoId, rdoId)),
    db.select().from(atividades).where(eq(atividades.rdoId, rdoId)),
    db.select().from(ocorrencias).where(eq(ocorrencias.rdoId, rdoId)),
    db
      .select()
      .from(comentarios)
      .where(eq(comentarios.rdoId, rdoId))
      .orderBy(asc(comentarios.createdAt)),
    db.select().from(anexos).where(eq(anexos.rdoId, rdoId)),
    db.select().from(materiais).where(eq(materiais.rdoId, rdoId)),
  ]);

  return Response.json({
    ...rdo,
    obra,
    maoDeObra: mo,
    equipamentos: eq_,
    atividades: at,
    ocorrencias: oc,
    comentarios: co,
    anexos: an,
    materiais: mt,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rdoId = Number(id);
  const body = await req.json();

  await db
    .update(rdos)
    .set({
      data: body.data,
      status: body.status,
      climaManha: body.climaManha,
      climaTarde: body.climaTarde,
      climaNoite: body.climaNoite,
      condicaoManha: body.condicaoManha,
      condicaoTarde: body.condicaoTarde,
      condicaoNoite: body.condicaoNoite,
      observacoes: body.observacoes ?? null,
    })
    .where(eq(rdos.id, rdoId));

  // Substitui itens filhos
  await Promise.all([
    db.delete(maoDeObra).where(eq(maoDeObra.rdoId, rdoId)),
    db.delete(equipamentos).where(eq(equipamentos.rdoId, rdoId)),
    db.delete(atividades).where(eq(atividades.rdoId, rdoId)),
    db.delete(ocorrencias).where(eq(ocorrencias.rdoId, rdoId)),
    db.delete(anexos).where(eq(anexos.rdoId, rdoId)),
    db.delete(materiais).where(eq(materiais.rdoId, rdoId)),
  ]);

  const mo = (body.maoDeObra || []).filter((r: { funcao?: string }) => r.funcao?.trim());
  const eqp = (body.equipamentos || []).filter((r: { nome?: string }) => r.nome?.trim());
  const at = (body.atividades || []).filter((r: { descricao?: string }) => r.descricao?.trim());
  const oc = (body.ocorrencias || []).filter((r: { descricao?: string }) => r.descricao?.trim());
  const an = (body.anexos || []).filter((r: { nome?: string; url?: string }) => r.nome?.trim() && r.url?.trim());
  const mt = (body.materiais || []).filter((r: { nome?: string }) => r.nome?.trim());

  if (mo.length)
    await db.insert(maoDeObra).values(
      mo.map((r: { funcao: string; quantidade?: number }) => ({
        rdoId,
        funcao: r.funcao,
        quantidade: Number(r.quantidade) || 1,
      }))
    );
  if (eqp.length)
    await db.insert(equipamentos).values(
      eqp.map(
        (r: {
          nome: string;
          quantidade?: number;
          situacao?: string;
          fotos?: string[] | null;
        }) => ({
          rdoId,
          nome: r.nome,
          quantidade: Number(r.quantidade) || 1,
          situacao: r.situacao || "operando",
          fotos: Array.isArray(r.fotos) ? r.fotos : [],
        })
      )
    );
  if (at.length)
    await db.insert(atividades).values(
      at.map(
        (r: {
          descricao: string;
          unidade?: string | null;
          quantidadeTotal?: number | null;
          quantidadeExecutada?: number | null;
          progresso?: number;
          status?: string;
          fotos?: string[] | null;
        }) => {
          const total = Math.max(0, Number(r.quantidadeTotal) || 0);
          const exec = Math.max(0, Number(r.quantidadeExecutada) || 0);
          const pct = total > 0 ? Math.round((exec / total) * 100) : 0;
          // define status automaticamente baseado no percentual
          let st = r.status || "em_andamento";
          if (!r.status || ["em_andamento", "concluida", "paralisada"].includes(r.status)) {
            if (pct >= 100) st = "concluida";
            else if (pct === 0 && exec === 0 && total > 0) st = "paralisada";
            else st = "em_andamento";
          }
          return {
            rdoId,
            descricao: r.descricao,
            unidade: r.unidade || "un",
            quantidadeTotal: total,
            quantidadeExecutada: exec,
            progresso: Math.max(0, Math.min(100, pct)),
            status: st,
            fotos: Array.isArray(r.fotos) ? r.fotos : [],
          };
        }
      )
    );
  if (oc.length)
    await db.insert(ocorrencias).values(
      oc.map((r: { tipo?: string; descricao: string }) => ({
        rdoId,
        tipo: r.tipo || "geral",
        descricao: r.descricao,
      }))
    );
  if (an.length)
    await db.insert(anexos).values(
      an.map(
        (r: {
          nome: string;
          url: string;
          tipo?: string | null;
          tamanho?: number | null;
        }) => ({
          rdoId,
          nome: r.nome,
          url: r.url,
          tipo: r.tipo || null,
          tamanho: Number(r.tamanho) || null,
        })
      )
    );
  if (mt.length)
    await db.insert(materiais).values(
      mt.map(
        (r: {
          nome: string;
          unidade?: string | null;
          qtdEntrada?: number | null;
          qtdUtilizada?: number | null;
          observacao?: string | null;
        }) => ({
          rdoId,
          nome: r.nome,
          unidade: r.unidade || "un",
          qtdEntrada: Math.max(0, Number(r.qtdEntrada) || 0),
          qtdUtilizada: Math.max(0, Number(r.qtdUtilizada) || 0),
          observacao: r.observacao || null,
        })
      )
    );

  return Response.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(rdos).where(eq(rdos.id, Number(id)));
  return Response.json({ ok: true });
}

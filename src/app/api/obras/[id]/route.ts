import { db } from "@/db";
import { obras, rdos } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const obraId = Number(id);
  const [obra] = await db.select().from(obras).where(eq(obras.id, obraId));
  if (!obra) {
    return Response.json({ error: "Obra não encontrada" }, { status: 404 });
  }
  const listaRdos = await db
    .select()
    .from(rdos)
    .where(eq(rdos.obraId, obraId))
    .orderBy(desc(rdos.data), desc(rdos.numero));
  return Response.json({ ...obra, rdos: listaRdos });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(obras)
    .set({
      nome: body.nome,
      cliente: body.cliente || null,
      endereco: body.endereco || null,
      responsavel: body.responsavel || null,
      descricao: body.descricao || null,
      status: body.status,
      dataInicio: body.dataInicio || null,
      previsaoTermino: body.previsaoTermino || null,
    })
    .where(eq(obras.id, Number(id)))
    .returning();
  return Response.json(row);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(obras).where(eq(obras.id, Number(id)));
  return Response.json({ ok: true });
}

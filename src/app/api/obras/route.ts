import { db } from "@/db";
import { obras, rdos } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({
      id: obras.id,
      nome: obras.nome,
      cliente: obras.cliente,
      endereco: obras.endereco,
      responsavel: obras.responsavel,
      descricao: obras.descricao,
      status: obras.status,
      dataInicio: obras.dataInicio,
      previsaoTermino: obras.previsaoTermino,
      createdAt: obras.createdAt,
      totalRdos: sql<number>`count(${rdos.id})::int`,
    })
    .from(obras)
    .leftJoin(rdos, eq(rdos.obraId, obras.id))
    .groupBy(obras.id)
    .orderBy(desc(obras.createdAt));

  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.nome) {
    return Response.json({ error: "Nome é obrigatório" }, { status: 400 });
  }
  const [row] = await db
    .insert(obras)
    .values({
      nome: body.nome,
      cliente: body.cliente || null,
      endereco: body.endereco || null,
      responsavel: body.responsavel || null,
      descricao: body.descricao || null,
      status: body.status || "em_andamento",
      dataInicio: body.dataInicio || null,
      previsaoTermino: body.previsaoTermino || null,
    })
    .returning();
  return Response.json(row, { status: 201 });
}

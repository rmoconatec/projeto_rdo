import { db } from "@/db";
import { rdos } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const obraId = Number(id);
  const body = await req.json().catch(() => ({}));

  // Próximo número sequencial do RDO para a obra
  const [{ maxNum }] = await db
    .select({ maxNum: sql<number>`coalesce(max(${rdos.numero}), 0)::int` })
    .from(rdos)
    .where(eq(rdos.obraId, obraId));

  const [row] = await db
    .insert(rdos)
    .values({
      obraId,
      numero: (maxNum ?? 0) + 1,
      data: body?.data || new Date().toISOString().slice(0, 10),
      status: "rascunho",
    })
    .returning();

  return Response.json(row, { status: 201 });
}

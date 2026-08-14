import { db } from "@/db";
import { obras, rdos } from "@/db/schema";
import { sql, eq, desc } from "drizzle-orm";
import { NextRequest } from "next/server";
import { checkApiKey, unauthorized } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!checkApiKey(req)) return unauthorized();
  const [obraCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(obras);
  const [obraAtivas] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(obras)
    .where(eq(obras.status, "em_andamento"));
  const [rdoCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(rdos);
  const [rdoHoje] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(rdos)
    .where(sql`${rdos.data} = current_date`);

  const recentes = await db
    .select({
      id: rdos.id,
      numero: rdos.numero,
      data: rdos.data,
      status: rdos.status,
      obraId: rdos.obraId,
      obraNome: obras.nome,
    })
    .from(rdos)
    .leftJoin(obras, eq(obras.id, rdos.obraId))
    .orderBy(desc(rdos.createdAt))
    .limit(6);

  return Response.json({
    totalObras: obraCount?.total ?? 0,
    obrasAtivas: obraAtivas?.total ?? 0,
    totalRdos: rdoCount?.total ?? 0,
    rdosHoje: rdoHoje?.total ?? 0,
    recentes,
  });
}

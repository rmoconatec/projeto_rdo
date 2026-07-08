import { db } from "@/db";
import { comentarios } from "@/db/schema";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  if (!body?.texto?.trim()) {
    return Response.json({ error: "Comentário vazio" }, { status: 400 });
  }
  const [row] = await db
    .insert(comentarios)
    .values({
      rdoId: Number(id),
      autor: body.autor?.trim() || "Anônimo",
      texto: body.texto.trim(),
    })
    .returning();
  return Response.json(row, { status: 201 });
}

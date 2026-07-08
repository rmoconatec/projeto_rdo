import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");

  if (!file || !(file instanceof File)) {
    return Response.json({ error: "Arquivo ausente" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return Response.json(
      { error: "Arquivo maior que 25MB" },
      { status: 400 }
    );
  }

  const original = file.name || "documento";
  const ext = original.includes(".")
    ? original.split(".").pop()!.toLowerCase()
    : "bin";
  const safeName = original.replace(/[^\wÀ-ÿ.\- ]/g, "_").slice(0, 80);
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return Response.json(
    {
      url: `/uploads/${filename}`,
      nome: safeName,
      tipo: file.type || "application/octet-stream",
      tamanho: file.size,
    },
    { status: 201 }
  );
}

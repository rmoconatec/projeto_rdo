import { NextRequest } from "next/server";

// Chave exigida no header X-API-Key. Defina em .env.local.
// Se não configurada, a API funciona sem autenticação (modo dev).
const EXPECTED = process.env.API_KEY;

export function checkApiKey(req: NextRequest): boolean {
  if (!EXPECTED) return true; // sem chave configurada => aceita tudo
  const key = req.headers.get("x-api-key");
  return key === EXPECTED;
}

export function unauthorized() {
  return Response.json({ error: "Não autorizado" }, { status: 401 });
}
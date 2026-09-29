import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { answerSchema } from "@/features/Vocabulary/Model";
import { submitWordAnswer } from "@/repositories/vocabulary";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ success: false, data: null, error: { code: "INVALID_ORIGIN", message: "Origem inválida." } }, { status: 403 });
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ success: false, data: null, error: { code: "UNAUTHORIZED", message: "Entre na sua conta." } }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, data: null, error: { code: "INVALID_JSON", message: "Dados inválidos." } }, { status: 400 }); }
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, data: null, error: { code: "INVALID_INPUT", message: "Resposta inválida." } }, { status: 400 });
  try { const result = await submitWordAnswer(client, parsed.data); return NextResponse.json({ success: true, data: result, error: null }, { headers: { "Cache-Control": "private, no-store" } }); }
  catch { return NextResponse.json({ success: false, data: null, error: { code: "ANSWER_ERROR", message: "Não foi possível registrar a resposta." } }, { status: 500 }); }
}

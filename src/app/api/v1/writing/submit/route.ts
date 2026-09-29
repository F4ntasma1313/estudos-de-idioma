import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writingSubmissionSchema } from "@/features/Writing/Model";
import { submitWriting } from "@/repositories/content";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ success: false, data: null, error: { message: "Origem inválida." } }, { status: 403 });
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ success: false, data: null, error: { message: "Entre na sua conta." } }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, data: null, error: { message: "Dados inválidos." } }, { status: 400 }); }
  const parsed = writingSubmissionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, data: null, error: { message: "Texto inválido." } }, { status: 400 });
  try { const result = await submitWriting(client, parsed.data.challengeId, parsed.data.bodyEn); return NextResponse.json({ success: true, data: result, error: null }, { headers: { "Cache-Control": "private, no-store" } }); }
  catch { return NextResponse.json({ success: false, data: null, error: { message: "Não foi possível salvar o texto. Confira o número mínimo de palavras." } }, { status: 400 }); }
}

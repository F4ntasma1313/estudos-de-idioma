import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchSchema } from "@/features/Vocabulary/Model";
import { findWords } from "@/repositories/vocabulary";

export async function GET(request: NextRequest) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ success: false, data: null, error: { code: "UNAUTHORIZED", message: "Entre na sua conta." } }, { status: 401 });
  const parsed = searchSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ success: false, data: null, error: { code: "INVALID_INPUT", message: "Busca inválida." } }, { status: 400 });
  try {
    const words = await findWords(client, parsed.data);
    return NextResponse.json({ success: true, data: { words, nextCursor: words.length === 20 ? words.at(-1)?.id : null }, error: null });
  } catch { return NextResponse.json({ success: false, data: null, error: { code: "DATABASE_ERROR", message: "Não foi possível buscar palavras." } }, { status: 500 }); }
}

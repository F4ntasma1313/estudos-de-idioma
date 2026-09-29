import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cefrLevels } from "@/features/Vocabulary/Model";
import { createStudyDeck } from "@/services/vocabulary";

export async function GET(request: NextRequest) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ success: false, data: null, error: { code: "UNAUTHORIZED", message: "Entre na sua conta." } }, { status: 401 });
  const levelParam = request.nextUrl.searchParams.get("level") ?? "A1";
  if (!cefrLevels.some((level) => level === levelParam)) return NextResponse.json({ success: false, data: null, error: { code: "INVALID_LEVEL", message: "Nível inválido." } }, { status: 400 });
  try { const cards = await createStudyDeck(client, user.id, levelParam, request.nextUrl.searchParams.get("mode") === "review"); return NextResponse.json({ success: true, data: { cards }, error: null }, { headers: { "Cache-Control": "private, no-store" } }); }
  catch { return NextResponse.json({ success: false, data: null, error: { code: "DATABASE_ERROR", message: "Não foi possível carregar os exercícios." } }, { status: 500 }); }
}

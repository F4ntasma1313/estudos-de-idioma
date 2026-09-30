import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getLesson, getLessonWords } from "@/repositories/lessons";
import { createLessonDeck } from "@/services/vocabulary";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ success: false, data: null, error: { code: "INVALID_ID", message: "Lição inválida." } }, { status: 400 });
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ success: false, data: null, error: { code: "UNAUTHORIZED", message: "Entre na sua conta." } }, { status: 401 });
  try {
    const lesson = await getLesson(client, id);
    if (!lesson) return NextResponse.json({ success: false, data: null, error: { code: "NOT_FOUND", message: "Lição não encontrada." } }, { status: 404 });
    const words = await getLessonWords(client, id);
    return NextResponse.json({ success: true, data: { cards: await createLessonDeck(client, words) }, error: null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ success: false, data: null, error: { code: "DATABASE_ERROR", message: "Não foi possível carregar a lição." } }, { status: 500 }); }
}

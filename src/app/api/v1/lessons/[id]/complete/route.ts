import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { completeLesson } from "@/repositories/lessons";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ success: false, data: null, error: { code: "INVALID_ORIGIN", message: "Origem inválida." } }, { status: 403 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ success: false, data: null, error: { code: "INVALID_ID", message: "Lição inválida." } }, { status: 400 });
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ success: false, data: null, error: { code: "UNAUTHORIZED", message: "Entre na sua conta." } }, { status: 401 });
  try { return NextResponse.json({ success: true, data: await completeLesson(client, id), error: null }); }
  catch { return NextResponse.json({ success: false, data: null, error: { code: "DATABASE_ERROR", message: "Não foi possível concluir a lição." } }, { status: 500 }); }
}

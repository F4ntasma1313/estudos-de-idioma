import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActivityProfile, insertActivityCompletion, listActivityCompletions } from "@/repositories/activities";
import { findActivity, localActivityDate } from "@/features/Activities/Controller";

export async function GET() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta." }, { status: 401 });
  const profile = await getActivityProfile(client, user.id);
  if (!profile) return NextResponse.json({ error: "Conclua seu perfil." }, { status: 403 });
  try {
    const completed = await listActivityCompletions(client, user.id, localActivityDate(profile.timezone));
    return NextResponse.json({ completed }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Progresso online indisponível." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Entre na sua conta." }, { status: 401 });
  const profile = await getActivityProfile(client, user.id);
  if (!profile) return NextResponse.json({ error: "Conclua seu perfil." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  const slug = typeof body === "object" && body !== null && "slug" in body ? body.slug : null;
  if (typeof slug !== "string" || !findActivity(slug)) return NextResponse.json({ error: "Atividade inválida." }, { status: 400 });
  try {
    await insertActivityCompletion(client, user.id, localActivityDate(profile.timezone), slug, profile.level);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Progresso online indisponível." }, { status: 503 }); }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { subscriptionSchema, unsubscribeSchema } from "@/features/Push/Model";
import { saveSubscription, removeSubscription } from "@/repositories/push";

function error(code: string, message: string, status: number) { return NextResponse.json({ success: false, data: null, error: { code, message } }, { status }); }
function trustedOrigin(request: NextRequest) { const origin = request.headers.get("origin"); return !origin || origin === request.nextUrl.origin; }

export async function POST(request: NextRequest) {
  if (!trustedOrigin(request)) return error("INVALID_ORIGIN", "Origem inválida.", 403);
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return error("UNAUTHORIZED", "Entre na sua conta.", 401);
  let body: unknown; try { body = await request.json(); } catch { return error("INVALID_JSON", "Dados inválidos.", 400); }
  const parsed = subscriptionSchema.safeParse(body);
  if (!parsed.success) return error("INVALID_SUBSCRIPTION", "Inscrição inválida.", 400);
  try { await saveSubscription(client, user.id, parsed.data, request.headers.get("user-agent")); return NextResponse.json({ success: true, data: { subscribed: true }, error: null }); }
  catch { return error("DATABASE_ERROR", "Não foi possível salvar a inscrição.", 500); }
}

export async function DELETE(request: NextRequest) {
  if (!trustedOrigin(request)) return error("INVALID_ORIGIN", "Origem inválida.", 403);
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return error("UNAUTHORIZED", "Entre na sua conta.", 401);
  let body: unknown; try { body = await request.json(); } catch { return error("INVALID_JSON", "Dados inválidos.", 400); }
  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) return error("INVALID_SUBSCRIPTION", "Inscrição inválida.", 400);
  try { await removeSubscription(client, user.id, parsed.data.endpoint); return NextResponse.json({ success: true, data: { subscribed: false }, error: null }); }
  catch { return error("DATABASE_ERROR", "Não foi possível remover a inscrição.", 500); }
}

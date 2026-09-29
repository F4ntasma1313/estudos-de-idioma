import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/auth?error=missing_code", request.url));
  const client = await createClient();
  const { error } = await client.auth.exchangeCodeForSession(code);
  const next = request.nextUrl.searchParams.get("next") === "/auth/update-password" ? "/auth/update-password" : "/dashboard";
  return NextResponse.redirect(new URL(error ? "/auth?error=callback" : next, request.url));
}

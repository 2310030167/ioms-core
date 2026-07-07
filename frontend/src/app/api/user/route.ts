import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { em, pw, rl } = await req.json();
    const s = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: u, error: e1 } = await s.auth.admin.createUser({
      email: em,
      password: pw,
      email_confirm: true
    });
    if (e1) return NextResponse.json({ ok: false, err: e1.message });
    if (u?.user) {
      const { error: e2 } = await s.from("user_roles").insert([{ id: u.user.id, email: em, role: rl }]);
      if (e2) return NextResponse.json({ ok: false, err: e2.message });
    }
    return NextResponse.json({ ok: true });
  } catch (ex: any) {
    return NextResponse.json({ ok: false, err: ex.message });
  }
}
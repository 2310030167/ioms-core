import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const res = await fetch("https://notification-engine-v2.onrender.com/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.WHATSAPP_API_KEY || "notification-engine-super-secret-key-2026",
      },
      body: JSON.stringify({
        recipient_phone: b.phone,
        recipient_email: b.email,
        notification_type: b.type,
        title: b.ttl,
        data: b.dt,
      }),
    });
    const d = await res.json();
    return NextResponse.json({ ok: res.ok, data: d });
  } catch (e) {
    return NextResponse.json({ ok: false, err: "Routing exception" }, { status: 500 });
  }
}
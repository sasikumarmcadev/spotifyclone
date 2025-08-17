import { createSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state" },
      { status: 400 }
    );
  }

  const callbackUrl = new URL('/api/auth/callback', new URL(request.url).origin).toString()

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: callbackUrl,
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
  });

  try {
    const r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const tokens = await r.json();

    if (!r.ok) {
        return NextResponse.json(tokens, {status: r.status})
    }
    
    await createSession(tokens);

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

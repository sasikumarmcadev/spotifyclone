import { createSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ error: "Spotify returned an error: " + error }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json(
      { error: "Missing code from Spotify" },
      { status: 400 }
    );
  }

  const callbackUrl = new URL('/api/auth/callback', new URL(request.url).origin).toString()

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: callbackUrl,
  });

  try {
    const r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET).toString("base64"),
      },
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

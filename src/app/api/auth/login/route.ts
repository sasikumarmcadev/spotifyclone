import { redirect } from "next/navigation";
import {NextRequest} from 'next/server';

export async function GET(req: NextRequest) {
  const state = crypto.randomBytes(16).toString("hex");

  const scopes = [
    "user-top-read",
    "playlist-modify-private",
    "playlist-modify-public",
  ].join(" ");
  
  const callbackUrl = new URL('/api/auth/callback', new URL(req.url).origin).toString()

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: "code",
    redirect_uri: callbackUrl,
    scope: scopes,
    state: state,
  });

  redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
}

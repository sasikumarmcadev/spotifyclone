import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Session } from "./types";
import { sFetch } from "./spotify";

const secretKey = process.env.COOKIE_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = ""): Promise<any> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    // console.log("Failed to verify session");
    return null;
  }
}

export async function createSession(tokens: any) {
  const me = await sFetch<{ id: string }>(tokens.access_token, "/me");
  if (!me) {
    // Unable to fetch user, something is wrong with the token
    return;
  }
  const expiresAt = Date.now() + tokens.expires_in * 1000;
  const session = {
    user: me,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt,
  };

  const encryptedSession = await encrypt(session);

  cookies().set("session", encryptedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    path: "/",
  });
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = cookies();
  const cookie = cookieStore.get("session")?.value;
  const session = await decrypt(cookie);

  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    return refreshSession(session);
  }

  return session;
}

async function refreshSession(session: Session): Promise<Session | null> {
  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
    });

    const r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const tokens = await r.json();

    if (!r.ok) {
      throw new Error(tokens.error_description);
    }
    
    // Refresh token might not be returned, re-use old one
    if (!tokens.refresh_token) {
        tokens.refresh_token = session.refreshToken;
    }

    await createSession(tokens);
    return getSession();
  } catch (error) {
    console.error("Error refreshing session:", error);
    await deleteSession();
    return null;
  }
}

export async function deleteSession() {
  cookies().delete("session");
}

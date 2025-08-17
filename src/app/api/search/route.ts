import { getSession } from "@/lib/auth";
import { sFetch } from "@/lib/spotify";
import { SearchResults } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }
  
  const types = 'track,artist';
  const limit = 10;
  
  try {
    const results = await sFetch<SearchResults>(
      session.accessToken,
      `/search?q=${encodeURIComponent(q)}&type=${types}&limit=${limit}`
    );
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

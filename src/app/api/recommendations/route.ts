import { getSession } from "@/lib/auth";
import { sFetch } from "@/lib/spotify";
import { generateMusicRecommendations } from "@/ai/flows/generate-music-recommendations";
import { improveMusicRecommendationsWithTags } from "@/ai/flows/improve-music-recommendations-with-tags";
import { NextRequest, NextResponse } from "next/server";
import { SpotifyTrack } from "@/lib/types";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const lastFmApiKey = process.env.LASTFM_API_KEY;
  if (!lastFmApiKey) {
    return NextResponse.json({ error: "Last.fm API key not configured." }, { status: 500 });
  }

  const { seedId, seedType, seedName, artistName } = await request.json();

  if (!seedId || !seedType) {
    return NextResponse.json({ error: "Seed ID and type are required" }, { status: 400 });
  }
  
  try {
    const result = await generateMusicRecommendations({
        seedId,
        seedType,
        accessToken: session.accessToken,
        lastFmApiKey: lastFmApiKey,
        userId: session.user.id,
    });
    
    let trackUris = result.trackUris || [];

    if (trackUris.length === 0 && artistName) {
        console.log("Initial recommendations empty, trying fallback with tags for artist:", artistName);
        const fallbackResult = await improveMusicRecommendationsWithTags({
            artist: artistName,
            accessToken: session.accessToken,
            lastFmApiKey: lastFmApiKey,
        });
        trackUris = [...new Set(fallbackResult.uris || [])];
    }

    if (trackUris.length === 0) {
        return NextResponse.json({ tracks: [] });
    }

    // Fetch full track objects from Spotify
    const trackIds = trackUris.map(uri => uri.split(':')[2]);
    const tracksData = await sFetch<{ tracks: SpotifyTrack[] }>(
        session.accessToken,
        `/tracks?ids=${trackIds.slice(0, 50).join(',')}` // Limit to 50 tracks
    );
    
    // Filter out null tracks in case some IDs were invalid
    const validTracks = tracksData?.tracks.filter(t => t) || [];

    return NextResponse.json({ tracks: validTracks });

  } catch (error: any) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json({ error: "Failed to generate recommendations." }, { status: 500 });
  }
}

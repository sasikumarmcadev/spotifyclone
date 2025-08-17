// src/ai/flows/generate-music-recommendations.ts
'use server';
/**
 * @fileOverview A music recommendation AI agent.
 * 
 * - generateMusicRecommendations - A function that handles the music recommendation process.
 * - GenerateMusicRecommendationsInput - The input type for the generateMusicRecommendations function.
 * - GenerateMusicRecommendationsOutput - The return type for the generateMusicRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMusicRecommendationsInputSchema = z.object({
  seedType: z.enum(['track', 'artist']).describe('The type of seed for recommendations (track or artist).'),
  seedId: z.string().describe('The Spotify ID of the seed track or artist.'),
  accessToken: z.string().describe('The Spotify access token for the user.'),
  lastFmApiKey: z.string().describe('The Last.fm API key.'),
  userId: z.string().describe('The Spotify user ID.'),
});
export type GenerateMusicRecommendationsInput = z.infer<typeof GenerateMusicRecommendationsInputSchema>;

const GenerateMusicRecommendationsOutputSchema = z.object({
  trackUris: z.array(z.string()).describe('An array of Spotify track URIs for recommended tracks.'),
});
export type GenerateMusicRecommendationsOutput = z.infer<typeof GenerateMusicRecommendationsOutputSchema>;

export async function generateMusicRecommendations(input: GenerateMusicRecommendationsInput): Promise<GenerateMusicRecommendationsOutput> {
  return generateMusicRecommendationsFlow(input);
}

const getSimilarTracks = ai.defineTool({
  name: 'getSimilarTracks',
  description: 'Gets similar tracks from Last.fm based on a seed track.',
  inputSchema: z.object({
    artist: z.string().describe('The artist of the seed track.'),
    track: z.string().describe('The name of the seed track.'),
    lastFmApiKey: z.string().describe('The Last.fm API key.'),
  }),
  outputSchema: z.array(z.object({
    artist: z.string(),
    track: z.string(),
  })),
}, async (input) => {
  const lfmApiKey = input.lastFmApiKey;
  const artist = encodeURIComponent(input.artist);
  const track = encodeURIComponent(input.track);

  const lastFmUrl = `http://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=${artist}&track=${track}&api_key=${lfmApiKey}&format=json`;
  const response = await fetch(lastFmUrl);
  const data = await response.json();
  const items = (data.similartracks?.track || []).slice(0, 30);

  const similarTracks = items.map((t: any) => ({
    artist: t.artist?.name ?? '',
    track: t.name,
  }));

  return similarTracks;
});

const getSpotifyTrackUri = ai.defineTool({
  name: 'getSpotifyTrackUri',
  description: 'Gets the Spotify track URI for a given track and artist.',
  inputSchema: z.object({
    artist: z.string().describe('The artist of the track.'),
    track: z.string().describe('The name of the track.'),
    accessToken: z.string().describe('The Spotify access token.'),
  }),
  outputSchema: z.string().optional().describe('The Spotify track URI, if found.'),
}, async (input) => {
  const { artist, track, accessToken } = input;
  const query = `${track} ${artist}`.trim();
  const spotifySearchUrl = `/search?q=${encodeURIComponent(query)}&type=track&limit=1`;

  const sFetch = async (accessToken: string, path: string, init: any = {}) => {
    const res = await fetch(`https://api.spotify.com/v1${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init.headers || {})
      }
    });
    if (res.status === 429) {
      const retry = parseInt(res.headers.get("Retry-After") || "1", 10);
      await new Promise(r => setTimeout(r, (retry + 1) * 1000));
      return sFetch(accessToken, path, init);
    }
    if (!res.ok) {
        console.error(`Spotify ${res.status}`);
        return null
    };
    return res.json();
  };

  const data = await sFetch(accessToken, spotifySearchUrl);
  return data?.tracks?.items?.[0]?.uri;
});

const getSimilarArtists = ai.defineTool({
  name: 'getSimilarArtists',
  description: 'Gets similar artists from Last.fm based on a seed artist.',
  inputSchema: z.object({
    artist: z.string().describe('The name of the seed artist.'),
    lastFmApiKey: z.string().describe('The Last.fm API key.'),
  }),
  outputSchema: z.array(z.object({
    artist: z.string(),
  })),
}, async (input) => {
    const lfmApiKey = input.lastFmApiKey;
    const artist = encodeURIComponent(input.artist);
  
    const lastFmUrl = `http://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=${artist}&api_key=${lfmApiKey}&format=json`;
    const response = await fetch(lastFmUrl);
    const data = await response.json();
    const items = (data.similarartists?.artist || []).slice(0, 30);
  
    const similarArtists = items.map((a: any) => ({
      artist: a.name,
    }));
  
    return similarArtists;
});

const getTopTracksForArtist = ai.defineTool({
    name: 'getTopTracksForArtist',
    description: 'Gets the top tracks for a given artist from Spotify.',
    inputSchema: z.object({
      artist: z.string().describe('The name of the artist.'),
      accessToken: z.string().describe('The Spotify access token.'),
    }),
    outputSchema: z.array(z.object({
      artist: z.string(),
      track: z.string(),
    })),
  }, async (input) => {
    const { artist, accessToken } = input;

    const spotifySearchUrl = `/search?q=${encodeURIComponent(artist)}&type=track&limit=10`;
  
    const sFetch = async (accessToken: string, path: string, init: any = {}) => {
      const res = await fetch(`https://api.spotify.com/v1${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          ...(init.headers || {})
        }
      });
      if (res.status === 429) {
        const retry = parseInt(res.headers.get("Retry-After") || "1", 10);
        await new Promise(r => setTimeout(r, (retry + 1) * 1000));
        return sFetch(accessToken, path, init);
      }
      if (!res.ok) {
          console.error(`Spotify ${res.status}`);
          return null
      };
      return res.json();
    };
  
    const data = await sFetch(accessToken, spotifySearchUrl);
    const topTracks = data?.tracks?.items?.map((item: any) => ({
        artist: artist,
        track: item.name,
    })) || [];

    return topTracks;
});

const getUserTopTracks = ai.defineTool({
  name: 'getUserTopTracks',
  description: 'Gets the user top tracks from Spotify.',
  inputSchema: z.object({
    accessToken: z.string().describe('The Spotify access token.'),
  }),
  outputSchema: z.array(z.object({
    artist: z.string(),
    track: z.string(),
  })),
}, async (input) => {
  const accessToken = input.accessToken;

  const sFetch = async (accessToken: string, path: string, init: any = {}) => {
    const res = await fetch(`https://api.spotify.com/v1${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init.headers || {})
      }
    });
    if (res.status === 429) {
      const retry = parseInt(res.headers.get("Retry-After") || "1", 10);
      await new Promise(r => setTimeout(r, (retry + 1) * 1000));
      return sFetch(accessToken, path, init);
    }
    if (!res.ok) {
        console.error(`Spotify ${res.status}`);
        return null
    };
    return res.json();
  };

  const data = await sFetch(accessToken, '/me/top/tracks?time_range=medium_term&limit=50');
  const topTracks = data?.items?.map((item: any) => ({
    artist: item.artists[0].name,
    track: item.name,
  })) || [];

  return topTracks;
});

const prompt = ai.definePrompt({
  name: 'generateMusicRecommendationsPrompt',
  tools: [getSimilarTracks, getSpotifyTrackUri, getSimilarArtists, getTopTracksForArtist, getUserTopTracks],
  input: {schema: GenerateMusicRecommendationsInputSchema},
  output: {schema: GenerateMusicRecommendationsOutputSchema},
  prompt: `You are a music recommendation expert.

  The user is looking for music recommendations based on a seed {{seedType}} with ID {{seedId}}.

  First, identify if the seed is a track or an artist, and call the appropriate tools to get similar tracks or artists from Last.fm.

  If the seed is a track, call getSimilarTracks with the artist and track name to get a list of similar tracks.
  If the seed is an artist, call getSimilarArtists with the artist name to get a list of similar artists, then call getTopTracksForArtist for each artist.

  Then, map the similar tracks to Spotify URIs by calling getSpotifyTrackUri for each track and artist.

  Also, call the getUserTopTracks to get the user's top tracks from Spotify, use this to boost results that share the same artists.

  Return a list of Spotify track URIs for the recommended tracks.
  Make sure to deduplicate the track URIs.

  The Last.fm API key is: {{{lastFmApiKey}}}.

  Here's the Spotify access token: {{{accessToken}}}.
  `,
});

const generateMusicRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateMusicRecommendationsFlow',
    inputSchema: GenerateMusicRecommendationsInputSchema,
    outputSchema: GenerateMusicRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Deduplicate track URIs
    const uniqueTrackUris = [...new Set(output!.trackUris)];
    return { trackUris: uniqueTrackUris };
  }
);


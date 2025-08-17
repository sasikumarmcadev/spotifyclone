// src/ai/flows/improve-music-recommendations-with-tags.ts
'use server';

/**
 * @fileOverview Flow to improve music recommendations with tags from Last.fm when similar lists are empty.
 *
 * - improveMusicRecommendationsWithTags - A function that enhances music recommendations using tags.
 * - ImproveMusicRecommendationsWithTagsInput - The input type for the improveMusicRecommendationsWithTags function.
 * - ImproveMusicRecommendationsWithTagsOutput - The return type for the improveMusicRecommendationsWithTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveMusicRecommendationsWithTagsInputSchema = z.object({
  artist: z.string().describe('The artist to find similar music for.'),
  accessToken: z.string().describe('Spotify access token for making API calls.'),
  lastFmApiKey: z.string().describe('Last.fm API key for fetching similar tracks and tags.'),
});
export type ImproveMusicRecommendationsWithTagsInput = z.infer<
  typeof ImproveMusicRecommendationsWithTagsInputSchema
>;

const ImproveMusicRecommendationsWithTagsOutputSchema = z.object({
  uris: z.array(z.string()).describe('An array of Spotify track URIs.'),
});
export type ImproveMusicRecommendationsWithTagsOutput = z.infer<
  typeof ImproveMusicRecommendationsWithTagsOutputSchema
>;

export async function improveMusicRecommendationsWithTags(
  input: ImproveMusicRecommendationsWithTagsInput
): Promise<ImproveMusicRecommendationsWithTagsOutput> {
  return improveMusicRecommendationsWithTagsFlow(input);
}

const getSimilarTracks = ai.defineTool({
  name: 'getSimilarTracks',
  description: 'Retrieves similar tracks from Last.fm based on the artist and track provided.',
  inputSchema: z.object({
    artist: z.string().describe('The artist name.'),
    track: z.string().describe('The track name.'),
    lastFmApiKey: z.string().describe('The Last.fm API key.'),
  }),
  outputSchema: z.array(z.object({
    name: z.string(),
    artist: z.object({
      name: z.string(),
    }).optional(),
  })),
},
async (input) => {
  const lfmResponse = await fetch(
    `http://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=${encodeURIComponent(input.artist)}&track=${encodeURIComponent(input.track)}&api_key=${input.lastFmApiKey}&format=json`
  );
  const lfmData = await lfmResponse.json();
  return (lfmData.similartracks?.track || []).slice(0, 30);
});

const getTopTags = ai.defineTool({
  name: 'getTopTags',
  description: 'Retrieves the top tags for a given artist from Last.fm.',
  inputSchema: z.object({
    artist: z.string().describe('The artist name.'),
    lastFmApiKey: z.string().describe('The Last.fm API key.'),
  }),
  outputSchema: z.array(z.object({
    name: z.string(),
  })),
},
async (input) => {
  const lfmResponse = await fetch(
    `http://ws.audioscrobbler.com/2.0/?method=artist.getTopTags&artist=${encodeURIComponent(input.artist)}&api_key=${input.lastFmApiKey}&format=json`
  );
  const lfmData = await lfmResponse.json();
  return (lfmData.toptags?.tag || []).slice(0, 5);
});

const spotifySearch = ai.defineTool({
  name: 'spotifySearch',
  description: 'Searches for a track on Spotify and returns the Spotify URI.',
  inputSchema: z.object({
    query: z.string().describe('The search query (track name and artist).'),
    accessToken: z.string().describe('The Spotify access token.'),
  }),
  outputSchema: z.string().optional().describe('The Spotify track URI, if found.'),
},
async (input) => {
  const sResponse = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(input.query)}&type=track&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
      },
    }
  );
  const sData = await sResponse.json();
  return sData?.tracks?.items?.[0]?.uri;
});

const improveMusicRecommendationsWithTagsFlow = ai.defineFlow(
  {
    name: 'improveMusicRecommendationsWithTagsFlow',
    inputSchema: ImproveMusicRecommendationsWithTagsInputSchema,
    outputSchema: ImproveMusicRecommendationsWithTagsOutputSchema,
  },
  async input => {
    const similarTracks = await getSimilarTracks({
      artist: input.artist,
      track: '', // Empty track to get similar artists
      lastFmApiKey: input.lastFmApiKey,
    });

    let uris: string[] = [];

    if (similarTracks.length === 0) {
      // If no similar tracks, use tags to broaden the pool
      const topTags = await getTopTags({
        artist: input.artist,
        lastFmApiKey: input.lastFmApiKey,
      });

      for (const tag of topTags) {
        const query = `${input.artist} ${tag.name}`.trim();
        const uri = await spotifySearch({
          query: query,
          accessToken: input.accessToken,
        });
        if (uri) {
          uris.push(uri);
        }
      }
    } else {
      // Map Last.fm results to Spotify URIs via Search
      for (const t of similarTracks) {
        const query = `${t.name} ${t.artist?.name ?? ''}`.trim();
        const uri = await spotifySearch({
          query: query,
          accessToken: input.accessToken,
        });
        if (uri) {
          uris.push(uri);
        }
      }
    }

    return { uris };
  }
);


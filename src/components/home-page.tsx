"use client";

import { useState } from "react";
import type { Session, SpotifyArtist, SpotifyTrack, SearchResults } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo, SpotifyIcon } from "./icons";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface HomePageProps {
  session: Session | null;
}

type Seed = { type: "artist"; item: SpotifyArtist } | { type: "track"; item: SpotifyTrack };

export function HomePage({ session: initialSession }: HomePageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [session, setSession] = useState(initialSession);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [seed, setSeed] = useState<Seed | null>(null);
  const [recommendations, setRecommendations] = useState<SpotifyTrack[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);

  const [selectedTrackUris, setSelectedTrackUris] = useState<string[]>([]);
  const [playlistName, setPlaylistName] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !session) return;
    setIsSearching(true);
    setSearchResults(null);
    setSeed(null);
    setRecommendations([]);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not perform search." });
    } finally {
      setIsSearching(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!seed || !session) return;
    setIsRecommending(true);
    setRecommendations([]);
    setSelectedTrackUris([]);
    setPlaylistName(seed.type === 'track' ? `Mix based on ${seed.item.name}` : `Mix based on ${seed.item.name}`);


    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seedId: seed.item.id,
          seedType: seed.type,
          seedName: seed.item.name,
          artistName: seed.type === 'track' ? seed.item.artists[0].name : seed.item.name,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get recommendations");
      }
      const data = await response.json();
      setRecommendations(data.tracks);
      setSelectedTrackUris(data.tracks.map((t: SpotifyTrack) => t.uri));
    } catch (error: any) {
      toast({ variant: "destructive", title: "Recommendation Error", description: error.message });
    } finally {
      setIsRecommending(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (selectedTrackUris.length === 0 || !playlistName.trim() || !session) return;
    setIsCreatingPlaylist(true);

    try {
      const response = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: playlistName, uris: selectedTrackUris }),
      });
      if (!response.ok) throw new Error("Failed to create playlist.");
      const data = await response.json();
      toast({
        title: "Playlist created!",
        description: `"${playlistName}" was added to your Spotify library.`,
        action: (
          <a href={data.playlistUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">Open Playlist</Button>
          </a>
        ),
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not create the playlist." });
    } finally {
      setIsCreatingPlaylist(false);
    }
  };
  
  const handleLogout = async () => {
    await fetch("/api/auth/logout");
    setSession(null);
    router.refresh();
  };

  const handleTrackSelection = (uri: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTrackUris((prev) => [...prev, uri]);
    } else {
      setSelectedTrackUris((prev) => prev.filter((item) => item !== uri));
    }
  };


  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
        <h1 className="flex items-center gap-2 text-lg font-semibold md:text-2xl font-headline">
          <Logo className="h-6 w-6 text-primary" />
          Harmonic Discoveries
        </h1>
        <div className="ml-auto">
          {session?.user ? (
            <div className="flex items-center gap-4">
               <span className="text-sm hidden sm:inline">{session.user.display_name}</span>
               <Avatar className="h-8 w-8">
                 <AvatarImage src={session.user.images?.[0]?.url} alt={session.user.display_name} />
                 <AvatarFallback>{session.user.display_name?.[0]}</AvatarFallback>
               </Avatar>
               <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
            </div>
          ) : (
            <Button asChild>
              <a href="/api/auth/login">
                <SpotifyIcon className="mr-2 h-4 w-4" /> Login with Spotify
              </a>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {!session ? (
          <div className="flex flex-col items-center justify-center text-center h-full max-w-2xl mx-auto">
              <div className="p-10 bg-card rounded-xl border">
                <h2 className="text-3xl font-bold tracking-tight font-headline mb-4">Welcome to Harmonic Discoveries</h2>
                <p className="text-muted-foreground mb-6">
                    Connect your Spotify account to start discovering new music. Find a song or artist, and we'll generate a personalized playlist for you based on similar sounds and your listening history.
                </p>
                <Button asChild size="lg">
                    <a href="/api/auth/login">
                        <SpotifyIcon className="mr-2 h-5 w-5" /> Connect Spotify
                    </a>
                </Button>
              </div>
          </div>
        ) : (
          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">1. Find a seed for your mix</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    placeholder="Search for a track or artist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {(isSearching || searchResults) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline">Search Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {isSearching && Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-md" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                    {searchResults?.artists.items.length > 0 && (
                        <>
                        <h3 className="font-semibold text-muted-foreground">Artists</h3>
                        {searchResults.artists.items.map((artist) => (
                            <div
                            key={artist.id}
                            className={cn("flex items-center gap-4 p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted", seed?.type === 'artist' && seed.item.id === artist.id && "bg-muted ring-2 ring-primary")}
                            onClick={() => setSeed({ type: "artist", item: artist })}
                            >
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={artist.images?.[0]?.url} alt={artist.name}/>
                                <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{artist.name}</a>
                            </div>
                            </div>
                        ))}
                        <Separator/>
                        </>
                    )}
                    {searchResults?.tracks.items.length > 0 && (
                        <>
                        <h3 className="font-semibold text-muted-foreground">Tracks</h3>
                        {searchResults.tracks.items.map((track) => (
                            <div
                            key={track.id}
                            className={cn("flex items-center gap-4 p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted", seed?.type === 'track' && seed.item.id === track.id && "bg-muted ring-2 ring-primary")}
                            onClick={() => setSeed({ type: "track", item: track })}
                            >
                                <Image
                                    src={track.album.images?.[0]?.url || 'https://placehold.co/64x64'}
                                    alt={track.album.name}
                                    width={48}
                                    height={48}
                                    className="rounded-md"
                                />
                                <div>
                                    <a href={track.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>{track.name}</a>
                                    <div className="text-sm text-muted-foreground">
                                        {track.artists.map((a, i) => (
                                            <span key={a.id}>
                                                <a href={a.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="hover:underline" onClick={(e) => e.stopPropagation()}>{a.name}</a>
                                                {i < track.artists.length - 1 && ", "}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                        </>
                    )}
                    {!isSearching && !searchResults?.tracks.items.length && !searchResults?.artists.items.length && (
                        <p className="text-muted-foreground text-center py-4">No results found.</p>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-headline">2. Generate Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center text-center h-48">
                      {seed ? (
                        <>
                          <p className="mb-4">
                            You've selected{" "}
                            <span className="font-bold text-primary">{seed.item.name}</span>. Ready to discover similar music?
                          </p>
                          <Button onClick={handleGetRecommendations} disabled={isRecommending}>
                            {isRecommending ? "Generating..." : "Get Recommendations"}
                          </Button>
                        </>
                      ) : (
                        <p className="text-muted-foreground">Select a track or artist from the search results to get started.</p>
                      )}
                    </CardContent>
                  </Card>

                   {(isRecommending || recommendations.length > 0) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-headline">3. Create Your Playlist</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Input
                          placeholder="Playlist Name"
                          value={playlistName}
                          onChange={(e) => setPlaylistName(e.target.value)}
                        />
                         <div className="space-y-2 max-h-[40vh] overflow-y-auto p-1">
                            {isRecommending && Array.from({length: 7}).map((_, i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-10 w-10 rounded-md" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[200px]" />
                                        <Skeleton className="h-4 w-[150px]" />
                                    </div>
                                </div>
                            ))}
                            {recommendations.map((track) => (
                                <div key={track.uri} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
                                <Checkbox
                                    id={track.uri}
                                    checked={selectedTrackUris.includes(track.uri)}
                                    onCheckedChange={(checked) => handleTrackSelection(track.uri, !!checked)}
                                    className="mr-2"
                                />
                                <Image
                                    src={track.album.images?.[0]?.url  || 'https://placehold.co/64x64'}
                                    alt={track.album.name}
                                    width={40}
                                    height={40}
                                    className="rounded-md"
                                />
                                <div className="flex-1">
                                    <div className="font-medium">
                                        <a href={track.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            {track.name}
                                        </a>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {track.artists.map((a,i) => (
                                            <span key={a.id}>
                                                <a href={a.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                    {a.name}
                                                </a>
                                                {i < track.artists.length - 1 && ', '}
                                            </span>
                                        ))}
                                    </p>
                                </div>
                                </div>
                            ))}
                         </div>
                         <Button
                            onClick={handleCreatePlaylist}
                            disabled={isCreatingPlaylist || selectedTrackUris.length === 0 || !playlistName.trim()}
                            className="w-full"
                          >
                            {isCreatingPlaylist ? "Creating..." : `Create Playlist & Add ${selectedTrackUris.length} Tracks`}
                          </Button>
                      </CardContent>
                    </Card>
                   )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

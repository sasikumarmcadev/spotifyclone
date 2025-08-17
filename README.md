# Harmonic Discoveriesss

A web app where users can search for songs/artists, get smart music recommendations, and create a playlist on their Spotify account with one click.

This project is built with Next.js, TypeScript, Tailwind CSS, Spotify API, and Last.fm API.

## Getting Started

First, you'll need to set up your environment variables. Copy the `.env.local.example` file to a new file named `.env.local` and fill in the required values:

```bash
cp .env.local.example .env.local
```

You will need to create:
1. A Spotify application: [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
   - Get your Client ID and Client Secret.
   - In your Spotify App settings, add a Redirect URI. For local development, this is typically `http://localhost:9002/api/auth/callback`. Make sure the port matches the one you use.
2. A Last.fm API key: [Last.fm API Accounts](https://www.last.fm/api/account/create)
3. A secret for session encryption. You can generate one with: `openssl rand -base64 32`.

Then, install the dependencies:

```bash
npm install
```

Finally, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.
# spotifyclone

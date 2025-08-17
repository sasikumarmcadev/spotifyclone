# **App Name**: Harmonic Discoveries

## Core Features:

- Spotify Authentication: User authentication and authorization using Spotify OAuth2 (Authorization Code or PKCE) to securely access user data.
- Music Search: Allow users to search for songs and artists using the Spotify Search API to find a seed track/artist for recommendations.
- AI Recommendations: Implement a hybrid recommendation system.  As a tool, pull similar tracks from Last.fm and map these results to Spotify URIs using the Spotify Search API. Then use user's listening history via Spotify API to filter/boost results. Use top tags to get relevant music via the tag.getSimilar and call Spotify search to incorporate into recommendations if similar list is empty
- Playlist Creation: Enable users to create a new playlist on their Spotify account, add recommended tracks to the playlist using the Spotify API.
- Track Preview and Selection: Display a clear and intuitive UI for previewing the list of recommended tracks, with options to exclude specific artists or genres before adding to the playlist.

## Style Guidelines:

- Primary color: #57A773 (a saturated green) to evoke feelings of growth and harmony, drawing inspiration from the concepts of musical exploration and personalized discovery.
- Background color: #F0FAF4 (a light, desaturated green) to maintain a clean and fresh feel, providing a backdrop that complements the primary color.
- Accent color: #A75789 (a vibrant, contrasting pink) for highlighting interactive elements, such as CTAs and selected tracks, to draw the user's eye and indicate actions.
- Headline font: 'Space Grotesk' sans-serif. Body font: 'Inter' sans-serif. 'Space Grotesk' will give a bold tech feeling for headlines, with 'Inter' offering a clean and readable aesthetic for body text.
- Use clean, minimalist icons to represent different music genres, artists, and playlist actions, enhancing usability and visual appeal.
- Employ a responsive, card-based layout to present music recommendations and search results in an organized and visually engaging manner.
- Incorporate subtle animations, such as fade-in effects, when displaying recommendations or transitioning between sections to provide a smooth and engaging user experience.
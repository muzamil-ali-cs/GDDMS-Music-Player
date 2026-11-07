# GDDMS Music Player

**A DSA-Powered Web Music Player**

GDDMS is a browser-based music player built with React, JavaScript, and custom data structures.

## Features

- Import audio files from a folder on your computer.
- Read available MP3 metadata and embedded cover artwork.
- Play, pause, skip, seek, adjust volume, and repeat tracks.
- Browse the imported collection from the Song List dropdown.
- Search and sort songs in the My Library page component.
- Keep a Recently Played history.
- Responsive sidebar and mobile layout.

## Data Structures and Algorithms

- **Doubly Linked List:** maintains the playlist and supports previous/next navigation.
- **Queue:** manages the internal Up Next sequence without a separate visible queue panel.
- **HashMap:** indexes song titles and artists for search.
- **Merge Sort:** sorts songs by title.
- **Stack:** stores recently played songs.

## Tech Stack

- React
- JavaScript
- Vite
- CSS
- jsmediatags
- lucide-react

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in your browser.

## Notes

- Music files are selected locally in the browser; the app does not upload them to a server.
- Re-importing a folder adds new tracks and skips files already in the collection.

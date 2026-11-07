import { useEffect, useRef, useState } from "react";
import jsmediatags from "jsmediatags";

import DoublyLinkedList from "../structures/DoublyLinkedList.js";
import Queue from "../structures/Queue.js";
import HashMap from "../structures/HashMap.js";
import MergeSort from "../structures/MergeSort.js";

import {
  FolderOpen,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music2,
  Rewind,
  FastForward,
  Repeat,
  Repeat1,
  Search,
  ListMusic,
  X,
  Upload,
  Headphones,
} from "lucide-react";

function Player({ onSongPlayed, activePage }) {
  const audioRef = useRef(null);
  const objectUrlsRef = useRef(new Set());

  // DSA: Doubly Linked List
  const playlistRef = useRef(new DoublyLinkedList());

  // DSA: Queue
  const queueRef = useRef(new Queue());

  // DSA: HashMap
  const searchIndexRef = useRef(new HashMap());

  const [songs, setSongs] = useState([]);
  const [sortOrder, setSortOrder] = useState("default");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [repeatMode, setRepeatMode] = useState("off");
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  const currentSong = songs[currentIndex];

  // DSA: rebuild the internal Up Next queue after the selected song.
  // The queue is intentionally not shown as a separate panel/button.
  const rebuildQueue = (startIndex) => {
    const nextQueue = new Queue();

    for (let index = startIndex + 1; index < songs.length; index++) {
      nextQueue.enqueue(songs[index]);
    }

    queueRef.current = nextQueue;
  };

  // Read MP3 metadata and artwork
  const getSongMetadata = (file) => {
    return new Promise((resolve) => {
      jsmediatags.read(file, {
        onSuccess: (result) => {
          const tags = result.tags;
          let cover = null;

          if (tags.picture?.data) {
            try {
              const imageData = new Uint8Array(tags.picture.data);

              const blob = new Blob([imageData], {
                type: tags.picture.format || "image/jpeg",
              });

              cover = URL.createObjectURL(blob);
            } catch (error) {
              console.error("Cover extraction failed:", error);
            }
          }

          resolve({
            title: tags.title || file.name.replace(/\.[^/.]+$/, ""),
            artist: tags.artist || "Unknown Artist",
            cover,
          });
        },

        onError: () => {
          resolve({
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: "Unknown Artist",
            cover: null,
          });
        },
      });
    });
  };

  // Import songs from a selected folder and add them to the existing collection.
  const uploadSongs = async (event) => {
    const files = Array.from(event.target.files || []);

    const audioFiles = files.filter(
      (file) =>
        /\\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name) ||
        file.type?.startsWith("audio/")
    );

    if (audioFiles.length === 0) {
      setImportMessage("No supported audio files were found in that folder.");
      event.target.value = "";
      return;
    }

    const existingFileKeys = new Set(
      songs.map((song) =>
        `${song.file?.name || ""}-${song.file?.size || 0}-${song.file?.lastModified || 0}`
      )
    );

    const newFiles = audioFiles.filter((file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      return !existingFileKeys.has(key);
    });

    if (newFiles.length === 0) {
      setImportMessage("These songs are already in your collection.");
      event.target.value = "";
      return;
    }

    setImportMessage(`Importing ${newFiles.length} song(s)...`);

    const importedSongs = await Promise.all(
      newFiles.map(async (file) => {
        const metadata = await getSongMetadata(file);
        const url = URL.createObjectURL(file);

        objectUrlsRef.current.add(url);

        if (metadata.cover) {
          objectUrlsRef.current.add(metadata.cover);
        }

        return {
          id: crypto.randomUUID(),
          title: metadata.title,
          artist: metadata.artist,
          cover: metadata.cover,
          file,
          url,
        };
      })
    );

    const combinedSongs = [...songs, ...importedSongs];

    // Rebuild the Doubly Linked List with the complete collection.
    const newPlaylist = new DoublyLinkedList();
    combinedSongs.forEach((song) => newPlaylist.append(song));

    const selectedIndex = currentSong
      ? combinedSongs.findIndex((song) => song.id === currentSong.id)
      : 0;

    const safeSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0;
    newPlaylist.select(safeSelectedIndex);
    playlistRef.current = newPlaylist;

    // Rebuild the HashMap search index for all imported songs.
    const newSearchIndex = new HashMap();

    combinedSongs.forEach((song) => {
      const words = new Set(
        `${song.title} ${song.artist}`
          .toLowerCase()
          .match(/[a-z0-9]+/g) || []
      );

      words.forEach((word) => {
        const existingSongs = newSearchIndex.get(word) || [];
        newSearchIndex.set(word, [...existingSongs, song]);
      });
    });

    searchIndexRef.current = newSearchIndex;

    // Queue keeps the songs after the current selection as internal Up Next.
    const nextQueue = new Queue();
    combinedSongs
      .slice(safeSelectedIndex + 1)
      .forEach((song) => nextQueue.enqueue(song));
    queueRef.current = nextQueue;

    setSongs(combinedSongs);
    setCurrentIndex(safeSelectedIndex);
    if (!currentSong) {
      setIsPlaying(false);
      setProgress(0);
      setDuration(0);
    }
    setSearchTerm("");
    setDrawerOpen(false);
    setImportMessage(`${importedSongs.length} new song(s) added successfully.`);

    event.target.value = "";
  };

  // Play or pause
  const togglePlay = async () => {
    if (!currentSong || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Playback failed:", error);
      }
    }
  };

  // Play selected song
  const selectSong = (index) => {
    const selectedNode = playlistRef.current.select(index);
    if (!selectedNode) return;

    rebuildQueue(index);
    setCurrentIndex(index);
    setIsPlaying(true);
    setProgress(0);
  };

  // Play selected song from Queue
  const playQueuedSong = () => {
    const nextSong = queueRef.current.dequeue();

    if (!nextSong) return false;

    const nextIndex = songs.findIndex(
      (song) => song.id === nextSong.id
    );

    if (nextIndex === -1) return false;

    playlistRef.current.select(nextIndex);
    setCurrentIndex(nextIndex);
    setIsPlaying(true);
    setProgress(0);

    console.log("Playing from Queue:", nextSong.title);

    return true;
  };

  // Next song
  const playNext = () => {
    if (songs.length === 0) return;

    if (!queueRef.current.isEmpty()) {
      const played = playQueuedSong();
      if (played) return;
    }

    if (currentIndex === songs.length - 1) {
      if (repeatMode === "all") {
        playlistRef.current.select(0);
        rebuildQueue(0);
        setCurrentIndex(0);
        setIsPlaying(true);
        setProgress(0);
      } else {
        setIsPlaying(false);
      }

      return;
    }

    const nextNode = playlistRef.current.next();

    if (nextNode) {
      const nextIndex = songs.findIndex(
        (song) => song.id === nextNode.data.id
      );

      setCurrentIndex(nextIndex);
      setIsPlaying(true);
      setProgress(0);
    }
  };

  // Previous song
  const playPrevious = () => {
    if (!audioRef.current || songs.length === 0) return;

    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      return;
    }

    const previousNode = playlistRef.current.previous();

    if (previousNode) {
      const previousIndex = songs.findIndex(
        (song) => song.id === previousNode.data.id
      );

      rebuildQueue(previousIndex);
      setCurrentIndex(previousIndex);
      setIsPlaying(true);
      setProgress(0);
    } else if (repeatMode === "all") {
      const lastIndex = playlistRef.current.size - 1;
      const lastNode = playlistRef.current.select(lastIndex);

      if (lastNode) {
        rebuildQueue(lastIndex);
        setCurrentIndex(lastIndex);
        setIsPlaying(true);
        setProgress(0);
      }
    }
  };

  // Seek forward or backward
  const seekAudio = (seconds) => {
    if (!audioRef.current) return;

    const nextTime = Math.min(
      Math.max(audioRef.current.currentTime + seconds, 0),
      duration
    );

    audioRef.current.currentTime = nextTime;
    setProgress(nextTime);
  };

  // Repeat modes
  const changeRepeatMode = () => {
    setRepeatMode((mode) => {
      if (mode === "off") return "all";
      if (mode === "all") return "one";
      return "off";
    });
  };

  // Handle song ending
  const handleSongEnd = () => {
    if (repeatMode === "one" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
      return;
    }

    playNext();
  };

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Load and play selected song
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !currentSong) return;

    audio.load();

    if (isPlaying) {
      audio.play().catch((error) => {
        console.error("Playback failed:", error);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [currentSong?.url]);

  // Play or pause when state changes
  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !currentSong) return;

    if (isPlaying) {
      audio.play().catch((error) => {
        console.error("Playback failed:", error);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Release generated audio/artwork URLs only when the player unmounts.
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, []);

  // Format time
  const formatTime = (time) => {
    if (!Number.isFinite(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  // Search songs using HashMap
  const filteredSongs = (() => {
    const query = searchTerm.toLowerCase().trim();

    if (!query) return songs;

    const matchingSongs = new Set();
    const allEntries = searchIndexRef.current.getAll();

    allEntries.forEach(({ key, value }) => {
      if (key.startsWith(query)) {
        value.forEach((song) => matchingSongs.add(song.id));
      }
    });

    return songs.filter((song) => matchingSongs.has(song.id));
  })();

  // DSA: Merge Sort
  const sortedSongs =
    sortOrder === "default"
      ? filteredSongs
      : MergeSort.sort(filteredSongs, (a, b) => {
          const comparison = a.title.localeCompare(
            b.title,
            undefined,
            { sensitivity: "base" }
          );

          return sortOrder === "asc" ? comparison : -comparison;
        });

  return (
    <section className="player-section">

      {/* IMPORT MUSIC PAGE */}
      {activePage === "import" && (
        <section className="page-content import-page">
          <div className="import-hero">
            <div className="import-icon">
              <Upload size={34} />
            </div>

            <span className="drawer-label">
              BUILD YOUR COLLECTION
            </span>

            <h1>Bring Your Music In.</h1>

            <p>
              Select a folder from your computer and add your
              favorite music to your personal library.
            </p>

            <label className="folder-button import-folder-button">
              <FolderOpen size={20} />
              <span>Choose Music Folder</span>

              <input
                type="file"
                accept="audio/*"
                webkitdirectory=""
                directory=""
                multiple
                onChange={uploadSongs}
              />
            </label>

            <div className="import-supported">
              Supported formats: MP3, WAV, OGG, M4A, AAC, FLAC
            </div>
          </div>

          <div className="import-stats">
            <div>
              <Music2 size={22} />
              <span>Imported Songs</span>
              <strong>{songs.length}</strong>
            </div>

            <div>
              <Headphones size={22} />
              <span>Now Playing</span>
              <strong>{currentSong ? "1" : "0"}</strong>
            </div>
          </div>

          {importMessage && (
            <div className="import-success">
              <span className="status-dot" />
              <span>{importMessage}</span>
              {songs.length > 0 && (
                <strong>{songs.length} songs in your collection</strong>
              )}
            </div>
          )}
        </section>
      )}

      {/* MY LIBRARY PAGE */}
      {activePage === "library" && (
        <section className="library-panel page-content" id="music-library">
          <div className="library-top">
            <div>
              <h2>My Music</h2>
              <p>{songs.length} songs in your library</p>
            </div>
          </div>

          <div className="library-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search songs or artists..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <button
              className="sort-button"
              onClick={() =>
                setSortOrder((current) =>
                  current === "asc" ? "desc" : "asc"
                )
              }
              title="Sort songs"
            >
              {sortOrder === "asc"
                ? "A–Z"
                : sortOrder === "desc"
                ? "Z–A"
                : "Sort"}
            </button>
          </div>

          <div className="song-list">
            {songs.length === 0 ? (
              <div className="empty-library">
                <Music2 size={42} />
                <h3>Your library is waiting</h3>
                <p>Import a music folder to see your songs here.</p>
              </div>
            ) : filteredSongs.length === 0 ? (
              <div className="empty-library">
                <Search size={32} />
                <p>No matching songs found.</p>
              </div>
            ) : (
              sortedSongs.map((song) => {
                const index = songs.findIndex(
                  (item) => item.id === song.id
                );

                return (
                  <div className="track-row-wrapper" key={song.id}>
                    <button
                      className={`track-row ${
                        currentIndex === index ? "active-track" : ""
                      }`}
                      onClick={() => selectSong(index)}
                    >
                      {song.cover ? (
                        <img
                          src={song.cover}
                          alt=""
                          className="track-cover"
                        />
                      ) : (
                        <span className="track-icon">
                          <Music2 size={20} />
                        </span>
                      )}

                      <span className="track-details">
                        <span className="track-name">{song.title}</span>
                        <span className="track-artist">{song.artist}</span>
                      </span>

                      {currentIndex === index && (
                        <span className="playing-label">
                          {isPlaying ? "PLAYING" : "SELECTED"}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* HOME PAGE - NOW PLAYING */}
      {activePage === "home" && (
        <section className="now-playing-panel" id="music-player">
          <div className="now-playing-heading">

            {/* SINGLE SONG LIST ICON + DROPDOWN */}
            <div
              className="song-list-dropdown"
              onMouseEnter={() => setDrawerOpen(true)}
              onMouseLeave={() => setDrawerOpen(false)}
            >
              <button
                type="button"
                className={`song-drawer-trigger ${
                  drawerOpen ? "dropdown-active" : ""
                }`}
                onClick={() => setDrawerOpen(true)}
                title="Song List"
                aria-label="Open Song List"
                aria-expanded={drawerOpen}
              >
                <ListMusic size={20} />
              </button>

              {drawerOpen && (
                <div
                  className="song-drawer"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="drawer-header">
                    <div>
                      <span className="drawer-label">
                        YOUR COLLECTION
                      </span>

                      <h2>Music Library</h2>
                      <p>{songs.length} songs available</p>
                    </div>

                    <button
                      type="button"
                      className="drawer-close"
                      onClick={() => setDrawerOpen(false)}
                      aria-label="Close song list"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="drawer-now-playing">
                    {currentSong?.cover ? (
                      <img
                        src={currentSong.cover}
                        alt=""
                        className="drawer-current-cover"
                      />
                    ) : (
                      <span className="drawer-current-icon">
                        <Music2 size={22} />
                      </span>
                    )}

                    <div className="drawer-current-details">
                      <span>NOW PLAYING</span>

                      <strong>
                        {currentSong?.title || "Nothing playing"}
                      </strong>

                      <p>
                        {currentSong?.artist || "Select a song"}
                      </p>
                    </div>

                    <span className="drawer-live-status">
                      {isPlaying ? "PLAYING" : "PAUSED"}
                    </span>
                  </div>

                  <div className="drawer-song-list">
                    {songs.length === 0 ? (
                      <div className="empty-library">
                        <Music2 size={30} />
                        <p>Your library is empty.</p>
                      </div>
                    ) : (
                      sortedSongs.map((song) => {
                        const index = songs.findIndex(
                          (item) => item.id === song.id
                        );

                        return (
                          <button
                            type="button"
                            key={song.id}
                            className={`drawer-track ${
                              currentIndex === index ? "active-track" : ""
                            }`}
                            onClick={() => {
                              selectSong(index);
                              setDrawerOpen(false);
                            }}
                          >
                            {song.cover ? (
                              <img src={song.cover} alt="" />
                            ) : (
                              <span className="drawer-track-icon">
                                <Music2 size={20} />
                              </span>
                            )}

                            <span className="track-details">
                              <span className="track-name">
                                {song.title}
                              </span>

                              <span className="track-artist">
                                {song.artist}
                              </span>
                            </span>

                            {currentIndex === index && (
                              <span className="playing-label">
                                {isPlaying ? "PLAYING" : "SELECTED"}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="album-art-container">
            {currentSong?.cover ? (
              <img
                src={currentSong.cover}
                alt={`${currentSong.title} cover`}
                className="giant-cover"
              />
            ) : (
              <div className="giant-cover default-artwork">
                <Music2 size={90} />
              </div>
            )}
          </div>

          <div className="song-information">
            <div>
              <h2>{currentSong?.title || "No song selected"}</h2>
              <p>{currentSong?.artist || "Choose a song to begin"}</p>
            </div>
          </div>

          <div className="progress-area">
            <span>{formatTime(progress)}</span>

            <input
              type="range"
              min="0"
              max={duration || 0}
              value={progress}
              style={{
                "--progress": duration
                  ? `${(progress / duration) * 100}%`
                  : "0%",
              }}
              onChange={(event) => {
                const time = Number(event.target.value);

                if (audioRef.current) {
                  audioRef.current.currentTime = time;
                  setProgress(time);
                }
              }}
              disabled={!currentSong}
              aria-label="Song progress"
            />

            <span>{formatTime(duration)}</span>
          </div>

          <div className="player-bottom-controls">
            <div className="secondary-controls">
              <button
                className={`control-button repeat-button ${
                  repeatMode !== "off" ? "control-active" : ""
                }`}
                onClick={changeRepeatMode}
                aria-label={`Repeat ${repeatMode}`}
                title={`Repeat: ${repeatMode}`}
                disabled={!currentSong}
              >
                {repeatMode === "one" ? (
                  <Repeat1 size={20} />
                ) : (
                  <Repeat size={20} />
                )}

                {repeatMode === "all" && (
                  <span className="repeat-all-dot" />
                )}
              </button>
            </div>

            <div className="playback-buttons">
              <button
                className="control-button"
                onClick={playPrevious}
                aria-label="Previous song"
                title="Previous song"
                disabled={!currentSong}
              >
                <SkipBack size={23} />
              </button>

              <button
                className="control-button"
                onClick={() => seekAudio(-10)}
                aria-label="Backward 10 seconds"
                title="Backward 10 seconds"
                disabled={!currentSong}
              >
                <Rewind size={21} />
              </button>

              <button
                className="main-play-button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                disabled={!currentSong}
              >
                {isPlaying ? (
                  <Pause size={27} fill="currentColor" />
                ) : (
                  <Play size={27} fill="currentColor" />
                )}
              </button>

              <button
                className="control-button"
                onClick={() => seekAudio(10)}
                aria-label="Forward 10 seconds"
                title="Forward 10 seconds"
                disabled={!currentSong}
              >
                <FastForward size={21} />
              </button>

              <button
                className="control-button"
                onClick={playNext}
                aria-label="Next song"
                title="Next song"
                disabled={!currentSong}
              >
                <SkipForward size={23} />
              </button>
            </div>

            <div className="volume-area">
              <div className="volume-control">
                <button
                  className="control-button volume-button"
                  aria-label="Volume"
                  title="Volume"
                >
                  {volume === 0 ? (
                    <VolumeX size={21} />
                  ) : (
                    <Volume2 size={21} />
                  )}
                </button>

                <div className="volume-popup">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    style={{
                      "--volume": `${volume * 100}%`,
                    }}
                    onChange={(event) =>
                      setVolume(Number(event.target.value))
                    }
                    aria-label="Volume level"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* AUDIO ENGINE - ALWAYS MOUNTED */}
      <audio
        ref={audioRef}
        src={currentSong?.url || undefined}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setProgress(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={handleSongEnd}
        onPlay={() => {
          setIsPlaying(true);
          onSongPlayed?.(currentSong);
        }}
        onPause={() => setIsPlaying(false)}
      />
    </section>
  );
}

export default Player;
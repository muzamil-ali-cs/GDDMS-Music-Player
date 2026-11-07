import { useCallback, useEffect, useRef, useState } from "react";

import {
  Home,
  Clock,
  FolderPlus,
  PanelLeftClose,
  PanelLeftOpen,
  Music2,
} from "lucide-react";

import Player from "./components/Player";
import Stack from "./structures/Stack.js";
import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("home");

  const [recentlyPlayed, setRecentlyPlayed] = useState([]);

  // Desktop: sidebar open
  // Mobile: sidebar closed
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return window.innerWidth > 700;
  });

  const historyRef = useRef(new Stack());

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 700);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Navigation handler
  const handleNavigation = (page) => {
    setActivePage(page);

    // Mobile par page select hone ke baad sidebar close
    if (window.innerWidth <= 700) {
      setSidebarOpen(false);
    }
  };

  // Recently Played using Stack
  const handleSongPlayed = useCallback((song) => {
    if (!song) return;

    const currentHistory = historyRef.current.getAll();

    if (currentHistory[0]?.id === song.id) return;

    const newHistory = new Stack();

    currentHistory
      .filter((item) => item.id !== song.id)
      .reverse()
      .forEach((item) => newHistory.push(item));

    newHistory.push(song);

    historyRef.current = newHistory;

    setRecentlyPlayed(newHistory.getAll());
  }, []);

  // Sidebar navigation
  const navigation = [
    {
      id: "home",
      label: "Home",
      icon: Home,
    },
    {
      id: "import",
      label: "Import Music",
      icon: FolderPlus,
    },
    {
      id: "recentlyPlayed",
      label: "Recently Played",
      icon: Clock,
    },
  ];

  // Page titles
  const pageTitles = {
    home: "Now Playing",
    import: "Import Your Music",
    recentlyPlayed: "Recently Played",
  };

  return (
    <div className={`app ${sidebarOpen ? "" : "sidebar-collapsed"}`}>

      {/* SIDEBAR */}
      <aside className="sidebar">

        {/* SIDEBAR HEADING */}
        <div className="sidebar-heading">

          <h2 className="logo">
            GDDMS<span>.</span>
          </h2>

          {/* MOBILE CLOSE BUTTON */}
          <button
            className="mobile-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <PanelLeftClose size={21} />
          </button>

        </div>

        <p className="menu-title">WORKSPACE</p>

        {/* NAVIGATION */}
        <nav className="sidebar-navigation">

          {navigation.map(({ id, label, icon: Icon }) => (

            <button
              key={id}
              className={`nav-item ${
                activePage === id ? "active" : ""
              }`}
              onClick={() => handleNavigation(id)}
              title={label}
            >
              <Icon size={19} />

              <span>{label}</span>

            </button>

          ))}

        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="sidebar-footer">

          <span className="status-dot" />

          Your personal music space

        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* TOP BAR */}
        <header className="topbar">

          <div className="topbar-left">

            {/* SIDEBAR TOGGLE */}
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen((open) => !open)}
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >

              {sidebarOpen ? (
                <PanelLeftClose size={21} />
              ) : (
                <PanelLeftOpen size={21} />
              )}

            </button>

            {/* PAGE TITLE */}
            <div>

              <span className="topbar-label">
                GDDMS MUSIC
              </span>

              <h2>{pageTitles[activePage]}</h2>

            </div>

          </div>

          {/* PROFILE */}
          <div className="profile">
            <Music2 size={20} />
          </div>

        </header>

        {/* PLAYER REMAINS MOUNTED ON EVERY PAGE */}
        <div className="app-player-container">

          {/* MUSIC PLAYER */}
          <Player
            activePage={activePage}
            onSongPlayed={handleSongPlayed}
          />

        </div>

        {/* RECENTLY PLAYED PAGE */}
        {activePage === "recentlyPlayed" && (

          <section className="page-content library-panel">

            <div className="library-top">

              <div>

                <h2>Recently Played</h2>

                <p>
                  {recentlyPlayed.length} songs in your history
                </p>

              </div>

            </div>

            {/* RECENT SONGS */}
            <div className="song-list">

              {recentlyPlayed.length === 0 ? (

                <div className="empty-library">

                  <Clock size={35} />

                  <h3>
                    Your listening history is empty
                  </h3>

                  <p>
                    Play some songs to see them here.
                  </p>

                </div>

              ) : (

                recentlyPlayed.map((song, index) => (

                  <div className="track-row" key={song.id}>

                    {song.cover ? (

                      <img
                        src={song.cover}
                        alt=""
                        className="track-cover"
                      />

                    ) : (

                      <span className="track-icon">
                        ♫
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

                    <span className="playing-label">
                      #{index + 1}
                    </span>

                  </div>

                ))

              )}

            </div>

          </section>

        )}

      </main>

    </div>
  );
}

export default App;

import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ThreadFlowLogo from "@/components/ui/ThreadFlowLogo";
import { Settings, Menu, X, Search as SearchIcon } from "lucide-react";
import { SearchProvider, useSearch } from "@/context/SearchContext";

function HeaderSearch({ className }: { className?: string }) {
  const { query, setQuery } = useSearch();
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      {!open ? (
        <button
          aria-label="Open search"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border p-1"
        >
          <SearchIcon className="h-5 w-5" />
        </button>
      ) : (
        <div className="flex items-center">
          <input
            aria-label="Header search"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setQuery("");
                setOpen(false);
              }
            }}
            className="w-64 rounded-md border px-2 py-1"
            autoFocus
          />
          <button
            aria-label="Close search"
            onClick={() => {
              setOpen(false);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border p-1 ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const checkPrompt = () => {
      setCanInstall(!!(window as any).deferredPrompt);
    };
    checkPrompt();
    window.addEventListener("pwa-beforeinstallprompt", checkPrompt);
    window.addEventListener("pwa-appinstalled", checkPrompt);
    return () => {
      window.removeEventListener("pwa-beforeinstallprompt", checkPrompt);
      window.removeEventListener("pwa-appinstalled", checkPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) return;
    try {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      // hide the prompt after user choice
      (window as any).deferredPrompt = null;
      setCanInstall(false);
      console.log("PWA install choice", choice);
    } catch (err) {
      console.warn("Install prompt failed", err);
    }
  };

  return (
    <SearchProvider>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-3 sm:px-0">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white"
              aria-hidden
            >
              <ThreadFlowLogo className="h-6 w-6" />
            </span>
            <span className="tracking-tight">ThreadFlow</span>
          </Link>

          <nav className="flex items-center gap-1">
            {/* Desktop links */}
            <div className="hidden sm:flex items-center gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/models/all"
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                All Models
              </NavLink>

              <NavLink
                to="/job-work"
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                Job Work
              </NavLink>

              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm font-medium",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                <span className="inline-flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Settings
                </span>
              </NavLink>

              <Button asChild size="sm" className="ml-2">
                <Link to="/models/new">New Model</Link>
              </Button>
            </div>

            {/* Install button (shows when PWA install available) */}
            {canInstall && (
              <div className="hidden sm:block mr-2">
                <Button onClick={handleInstallClick} size="sm">
                  Install
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((s) => !s)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border p-1"
              >
                {menuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </nav>

          {/* Mobile dropdown */}
          <div
            className={cn(
              "absolute left-0 right-0 top-14 z-50 sm:hidden",
              menuOpen ? "block" : "hidden",
            )}
          >
            <div className="mx-3 rounded-md border bg-popover p-3 shadow-sm">
              <nav className="flex flex-col gap-2">
                <NavLink
                  to="/"
                  end
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-2 text-sm font-medium w-full text-left",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/models/all"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-2 text-sm font-medium w-full text-left",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )
                  }
                >
                  All Models
                </NavLink>
                <NavLink
                  to="/job-work"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-2 text-sm font-medium w-full text-left",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )
                  }
                >
                  Job Work
                </NavLink>
                <NavLink
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-2 text-sm font-medium w-full text-left",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )
                  }
                >
                  Settings
                </NavLink>
                <Button asChild size="sm" className="mt-2">
                  <Link to="/models/new" onClick={() => setMenuOpen(false)}>
                    New Model
                  </Link>
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <SearchProvider>
          <Outlet />
        </SearchProvider>
      </main>
      </div>
    </SearchProvider>
  );
}

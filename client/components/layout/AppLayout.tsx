import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ThreadFlowLogo from "@/components/ui/ThreadFlowLogo";
import { Settings, Menu, X, Search as SearchIcon } from "lucide-react";
import { SearchProvider, useSearch } from "@/context/SearchContext";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

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
            className="w-64 sm:w-64 rounded-md border px-2 py-1 max-w-80"
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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden">
        {/* Mobile sidebar backdrop */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 sm:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        {/* Mobile sidebar */}
        <div
          className={cn(
            "fixed left-0 top-0 h-screen w-64 z-40 bg-background border-r transform transition-transform duration-200 ease-in-out sm:hidden",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar header */}
            <div className="flex items-center justify-between h-14 border-b px-4">
              <div className="flex items-center gap-2 font-semibold">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white"
                  aria-hidden
                >
                  <ThreadFlowLogo className="h-6 w-6" />
                </span>
                <span className="tracking-tight">ThreadFlow</span>
              </div>
              <button
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sidebar navigation */}
            <nav className="flex-1 overflow-y-auto px-2 py-4">
              <div className="flex flex-col gap-2">
                <NavLink
                  to="/"
                  end
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-2 text-sm font-medium w-full text-left",
                      isActive
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
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
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                    )
                  }
                >
                  All Models
                </NavLink>
                <NavLink
                  to="/roadmap"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-2 text-sm font-medium w-full text-left",
                      isActive
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                    )
                  }
                >
                  Roadmap
                </NavLink>
                <NavLink
                  to="/job-work"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-2 text-sm font-medium w-full text-left",
                      isActive
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
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
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                    )
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Settings
                  </span>
                </NavLink>

                <div className="pt-4 mt-5 border-t text-center text-xs text-gray-400">
                  Created by{" "}
                  <span className="font-semibold text-gray-600">
                    Sabarish Arjunan
                  </span>
                </div>
              </div>
            </nav>

            {/* Sidebar footer */}
            <div className="border-t p-4 flex flex-col gap-4">
              <Button asChild size="sm" className="w-full">
                <Link to="/models/new" onClick={() => setMenuOpen(false)}>
                  New Model
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur overflow-x-hidden">
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
                  to="/roadmap"
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-2 text-sm font-medium",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )
                  }
                >
                  Roadmap
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
                <div className="mr-2">
                  <Button onClick={handleInstallClick} size="sm">
                    Install
                  </Button>
                </div>
              )}

              {/* Header search icon */}
              <div className="mr-2 hidden sm:block">
                <HeaderSearch />
              </div>

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
          </div>
        </header>

        <main className="container py-3 sm:py-6 overflow-x-hidden">
          <SearchProvider>
            <Outlet />
          </SearchProvider>
        </main>
      </div>
    </SearchProvider>
  );
}

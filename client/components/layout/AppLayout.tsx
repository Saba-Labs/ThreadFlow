import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Settings, Menu, X } from "lucide-react";

export default function AppLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-3 sm:px-0">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Scissors className="h-4 w-4" />
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
        <Outlet />
      </main>
    </div>
  );
}

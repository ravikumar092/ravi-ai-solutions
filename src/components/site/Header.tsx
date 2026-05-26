import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, User, LogOut, LayoutDashboard, ChevronDown, Sun, Moon } from "lucide-react";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BookCallModal } from "./BookCallModal";
import { getSettings } from "@/lib/settings.functions";
import { getMe } from "@/routes/api/me";
import { toast } from "sonner";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    if (theme === "dark") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  const fetchSettings = useServerFn(getSettings);
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchSettings(),
    staleTime: 5 * 60 * 1000,
  });

  const fetchMe = useServerFn(getMe);
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => fetchMe(),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = () => setUserMenuOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [userMenuOpen]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const siteName = settings?.site_name || "Ravi Kumar AI Lab";
  const words = siteName.split(" ");
  const firstPart = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  const lastPart = words.slice(Math.ceil(words.length / 2)).join(" ");

  const isLoggedIn = !!currentUser;
  const displayName = (currentUser as any)?.firstName || (currentUser as any)?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/tools", label: "Tools" },
    { to: "/products", label: "Store" },
    { to: "/automations", label: "Automations" },
    { to: "/courses", label: "Courses" },
    { to: "/community", label: "Community" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled
            ? "backdrop-blur-xl bg-background/70 border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="font-display text-base font-semibold tracking-tight flex items-center gap-2 flex-shrink-0">
            <span className="neon-text font-bold">{firstPart}</span>
            {lastPart && <span className="text-foreground font-bold">{lastPart}</span>}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden xl:flex items-center gap-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                activeProps={{ className: "text-foreground font-semibold neon-text" }}
                className="hover:text-foreground transition"
              >
                {label}
              </Link>
            ))}
            {isLoggedIn && (
              <Link
                to="/dashboard"
                activeProps={{ className: "text-foreground font-semibold neon-text" }}
                className="hover:text-foreground transition"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden xl:flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border/60 bg-card/40 hover:bg-card/85 text-muted-foreground hover:text-foreground transition-colors cursor-pointer mr-1"
              aria-label="Toggle Theme"
              type="button"
            >
              {theme === "dark" ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-400" />}
            </button>

            <Button
              variant="hero"
              onClick={() => setModal(true)}
              className="text-xs uppercase tracking-wider px-4 py-1.5 h-8"
            >
              Book a Call
            </Button>

            {isLoggedIn ? (
              /* User Avatar Dropdown */
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 hover:bg-card/80 px-2.5 py-1.5 text-xs font-medium transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-bold text-primary">
                    {initials}
                  </div>
                  <span className="max-w-[80px] truncate text-foreground">{displayName}</span>
                  <ChevronDown size={12} className={`text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-xl py-1 z-50">
                    <div className="px-3 py-2 border-b border-border/30">
                      <p className="text-[11px] font-semibold text-foreground truncate">{displayName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{(currentUser as any)?.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted/30 transition-colors"
                    >
                      <LayoutDashboard size={13} className="text-primary" /> My Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/20 transition-colors"
                    >
                      <LogOut size={13} /> Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Sign In / Sign Up */
              <div className="flex items-center gap-2">
                <Link
                  to="/signin"
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground transition px-3 py-1.5 rounded-lg border border-transparent hover:border-border"
                >
                  Sign In
                </Link>
                <Link to="/signup">
                  <Button variant="outlineNeon" size="sm" className="text-xs h-8 px-3">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="xl:hidden text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="xl:hidden border-t border-border bg-background/95 backdrop-blur-xl">
            <nav className="px-6 py-4 flex flex-col gap-4 text-sm font-medium uppercase tracking-wider">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  activeProps={{ className: "text-foreground font-semibold neon-text" }}
                >
                  {label}
                </Link>
              ))}
              {isLoggedIn && (
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  activeProps={{ className: "text-foreground font-semibold neon-text" }}
                >
                  Dashboard
                </Link>
              )}

              <div className="border-t border-border/30 pt-3 mt-1 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-border/20 mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Appearance</span>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card/45 text-xs font-semibold text-foreground cursor-pointer"
                    type="button"
                  >
                    {theme === "dark" ? (
                      <><Sun size={13} className="text-amber-400" /> Light Mode</>
                    ) : (
                      <><Moon size={13} className="text-indigo-400" /> Dark Mode</>
                    )}
                  </button>
                </div>

                {isLoggedIn ? (
                  <>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-bold text-primary">
                        {initials}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{displayName}</p>
                        <p className="text-[10px]">{(currentUser as any)?.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full text-xs justify-start text-rose-400 gap-2"
                    >
                      <LogOut size={13} /> Log Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/signin" onClick={() => setOpen(false)}>
                      <Button variant="outlineNeon" size="sm" className="w-full text-xs gap-2">
                        <User size={13} /> Sign In
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setOpen(false)}>
                      <Button variant="hero" size="sm" className="w-full text-xs gap-2">
                        Create Free Account
                      </Button>
                    </Link>
                  </>
                )}
                <Button variant="hero" onClick={() => { setModal(true); setOpen(false); }} className="text-xs uppercase tracking-wider w-full mt-1">
                  Book a Call
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <BookCallModal open={modal} onOpenChange={setModal} />
    </>
  );
}

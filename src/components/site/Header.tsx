import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookCallModal } from "./BookCallModal";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled
            ? "backdrop-blur-xl bg-background/70 border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-base font-semibold tracking-tight flex items-center gap-2">
            <span className="neon-text font-bold">The Solo</span>
            <span className="text-foreground font-bold">Entrepreneur</span>
            <span className="text-[9px] bg-muted border border-border px-1.5 py-0.5 rounded text-muted-foreground font-sans font-normal uppercase tracking-wider hidden sm:inline-block">by Ravi Kumar</span>
          </Link>

          <nav className="hidden xl:flex items-center gap-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Link to="/" activeProps={{ className: "text-foreground font-semibold neon-text" }} className="hover:text-foreground transition">Home</Link>
            <Link to="/tools" activeProps={{ className: "text-foreground font-semibold neon-text" }} className="hover:text-foreground transition">Tools</Link>
            <Link to="/products" activeProps={{ className: "text-foreground font-semibold neon-text" }} className="hover:text-foreground transition">Store</Link>
            <Link to="/automations" activeProps={{ className: "text-foreground font-semibold neon-text" }} className="hover:text-foreground transition">Automations</Link>
            <Link to="/courses" activeProps={{ className: "text-foreground font-semibold neon-text" }} className="hover:text-foreground transition">Courses</Link>
            <Link to="/community" activeProps={{ className: "text-foreground font-semibold neon-text" }} className="hover:text-foreground transition">Community</Link>
            <Link to="/dashboard" activeProps={{ className: "text-foreground font-semibold neon-text" }} className="hover:text-foreground transition">Dashboard</Link>
          </nav>

          <div className="hidden xl:block">
            <Button variant="hero" onClick={() => setModal(true)} className="text-xs uppercase tracking-wider px-4 py-1.5 h-8">Book a Call</Button>
          </div>

          <button
            className="xl:hidden text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="xl:hidden border-t border-border bg-background/95 backdrop-blur-xl">
            <nav className="px-6 py-4 flex flex-col gap-4 text-sm font-medium uppercase tracking-wider">
              <Link to="/" onClick={() => setOpen(false)} activeProps={{ className: "text-foreground font-semibold neon-text" }}>Home</Link>
              <Link to="/tools" onClick={() => setOpen(false)} activeProps={{ className: "text-foreground font-semibold neon-text" }}>Tools</Link>
              <Link to="/products" onClick={() => setOpen(false)} activeProps={{ className: "text-foreground font-semibold neon-text" }}>Store</Link>
              <Link to="/automations" onClick={() => setOpen(false)} activeProps={{ className: "text-foreground font-semibold neon-text" }}>Automations</Link>
              <Link to="/courses" onClick={() => setOpen(false)} activeProps={{ className: "text-foreground font-semibold neon-text" }}>Courses</Link>
              <Link to="/community" onClick={() => setOpen(false)} activeProps={{ className: "text-foreground font-semibold neon-text" }}>Community</Link>
              <Link to="/dashboard" onClick={() => setOpen(false)} activeProps={{ className: "text-foreground font-semibold neon-text" }}>Dashboard</Link>
              <Button variant="hero" onClick={() => { setModal(true); setOpen(false); }} className="text-xs uppercase tracking-wider w-full mt-2">
                Book a Call
              </Button>
            </nav>
          </div>
        )}
      </header>

      <BookCallModal open={modal} onOpenChange={setModal} />
    </>
  );
}

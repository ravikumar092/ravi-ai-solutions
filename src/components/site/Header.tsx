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
          <Link to="/" className="font-display text-base font-semibold tracking-tight">
            <span className="neon-text">Ravi Kumar</span>
            <span className="text-foreground"> AI Lab</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#services" className="hover:text-foreground transition">Services</a>
            <a href="#tutorials" className="hover:text-foreground transition">Tutorials</a>
            <a href="#about" className="hover:text-foreground transition">About</a>
            <a href="#schedule" className="hover:text-foreground transition">Schedule</a>
            <a
              href="https://www.youtube.com/@RaviKumarAILab"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition"
            >
              YouTube
            </a>
          </nav>

          <div className="hidden md:block">
            <Button variant="hero" onClick={() => setModal(true)}>Book a Call</Button>
          </div>

          <button
            className="md:hidden text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
            <nav className="px-6 py-4 flex flex-col gap-4 text-sm">
              <a href="#services" onClick={() => setOpen(false)}>Services</a>
              <a href="#tutorials" onClick={() => setOpen(false)}>Tutorials</a>
              <a href="#about" onClick={() => setOpen(false)}>About</a>
              <a href="#schedule" onClick={() => setOpen(false)}>Schedule</a>
              <a href="https://www.youtube.com/@RaviKumarAILab" target="_blank" rel="noreferrer">YouTube</a>
              <Button variant="hero" onClick={() => { setModal(true); setOpen(false); }}>
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

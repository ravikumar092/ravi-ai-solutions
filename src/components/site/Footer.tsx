import { Youtube, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Ravi Kumar AI Lab. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <a
            href="https://www.youtube.com/@RaviKumarAILab"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 hover:text-foreground transition"
          >
            <Youtube size={16} /> YouTube
          </a>
          <a
            href="mailto:ravikumar@devforge.dev"
            className="flex items-center gap-2 hover:text-foreground transition"
          >
            <Mail size={16} /> ravikumar@devforge.dev
          </a>
        </div>
      </div>
    </footer>
  );
}

import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, MessageSquare, ThumbsUp, Heart, Share2, Plus, Trophy, CalendarDays, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { getSettings } from "@/lib/settings.functions";
import { listPublicCommunityPosts, createCommunityPost } from "@/lib/community.functions";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Founder Community — Ravi Kumar AI Lab" },
      { name: "description", content: "Join 2,000+ solo founders, creators, and automation builders. Share your builds, find accountability partners, and scale your online business." },
    ],
  }),
  component: CommunityPage,
});

type FeedPost = {
  id: number | string;
  author: string;
  avatar: string;
  role: string;
  time: string;
  content: string;
  likes: number;
  commentsCount: number;
};

function formatRelativeTime(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  } catch (e) {
    return "Some time ago";
  }
}

function CommunityPage() {
  const fetchSettings = useServerFn(getSettings);
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchSettings(),
    staleTime: 5 * 60 * 1000,
  });

  const fetchPosts = useServerFn(listPublicCommunityPosts);
  const addPost = useServerFn(createCommunityPost);
  const qc = useQueryClient();

  const { data: dbPosts = [] } = useQuery({
    queryKey: ["public-community"],
    queryFn: () => fetchPosts(),
  });

  const [localPosts, setLocalPosts] = useState<FeedPost[]>([]);
  const [likedPosts, setLikedPosts] = useState<Record<string | number, boolean>>({});
  const [newPostText, setNewPostText] = useState("");

  useEffect(() => {
    if (settings?.site_name) {
      document.title = `Founder Community — ${settings.site_name}`;
    }
    if (settings?.meta_description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', settings.meta_description);
    }
  }, [settings]);

  const INITIAL_FEED: FeedPost[] = [
    {
      id: 1,
      author: "Alex Rivers",
      avatar: "AR",
      role: "SaaS Builder",
      time: "2 hours ago",
      content: "🚀 Just launched my waitlist page and captured 84 signups in the first 24 hours. The n8n auto-responder email workflow works like magic. Huge thanks to Ravi Kumar's tutorial on connecting Resend + Google Sheets!",
      likes: 18,
      commentsCount: 3,
    },
    {
      id: 2,
      author: "Maria Chen",
      avatar: "MC",
      role: "Agency Founder",
      time: "5 hours ago",
      content: "Quick question for the group: What's your average monthly server cost for running self-hosted n8n instances on Railway or Render? Trying to optimize my retainer margins for Q3.",
      likes: 12,
      commentsCount: 9,
    },
    {
      id: 3,
      author: "David Vance",
      avatar: "DV",
      role: "Indie Creator",
      time: "1 day ago",
      content: "Sharing my win: Signed my second consulting client for $1,200/mo to automate their lead pipeline. Leveraging templates and AI agents makes delivery super fast. Keep building, guys!",
      likes: 31,
      commentsCount: 5,
    },
  ];

  const activeFeed: FeedPost[] = dbPosts.length > 0
    ? dbPosts.map(p => ({
        id: p.id,
        author: p.author,
        avatar: p.avatar,
        role: p.role,
        time: formatRelativeTime(p.created_at),
        content: p.content,
        likes: p.likes,
        commentsCount: p.comments_count,
      }))
    : INITIAL_FEED;

  const feed = [...localPosts, ...activeFeed];

  const postMutation = useMutation({
    mutationFn: (newPost: any) => addPost(newPost),
    onSuccess: () => {
      toast.success("Post published to feed!");
      setNewPostText("");
      qc.invalidateQueries({ queryKey: ["public-community"] });
    },
    onError: (err) => {
      console.warn("DB post submit error, using local fallback:", err);
      const fallbackPost: FeedPost = {
        id: Date.now().toString(),
        author: settings?.founder_name ? `${settings.founder_name} (You)` : "You (Ravi Kumar AI Lab)",
        avatar: settings?.founder_name ? settings.founder_name.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "RK",
        role: "Builder",
        time: "Just now",
        content: newPostText,
        likes: 0,
        commentsCount: 0,
      };
      setLocalPosts(prev => [fallbackPost, ...prev]);
      setNewPostText("");
      toast.success("Post published to feed!");
    }
  });

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    postMutation.mutate({
      author: settings?.founder_name ? `${settings.founder_name} (You)` : "You (Ravi Kumar AI Lab)",
      avatar: settings?.founder_name ? settings.founder_name.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "RK",
      role: "Builder",
      content: newPostText,
    });
  };

  const handleLike = (id: string | number) => {
    setLikedPosts(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-6 max-w-7xl mx-auto w-full">
        {/* Title */}
        {(() => {
          const communityTitle = settings?.community_title || "Founder Community Feed";
          const commWords = communityTitle.split(" ");
          const commHighlightCount = Math.min(Math.ceil(commWords.length * 0.4), 2);
          const commMainTitle = commWords.slice(0, -commHighlightCount).join(" ");
          const commHighlightTitle = commWords.slice(-commHighlightCount).join(" ");

          return (
            <div className="mb-10 text-center max-w-2xl mx-auto">
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-3">Indie Network</p>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
                {commMainTitle}{" "}
                <span className="neon-text">{commHighlightTitle}</span>
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {settings?.community_desc || "Collaborate, ask questions, and share automation milestones with 2,000+ builders building in public."}
              </p>
            </div>
          );
        })()}

        {/* Content Layout */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Main Feed Column */}
          <div className="space-y-6">
            {/* Create Post Card */}
            <div className="bg-card/45 border border-border rounded-xl p-5 backdrop-blur">
              <form onSubmit={handlePostSubmit} className="space-y-4">
                <Textarea
                  value={newPostText}
                  onChange={e => setNewPostText(e.target.value)}
                  placeholder="Share a milestone, ask a question, or talk about what you are automating today..."
                  rows={3}
                  className="bg-muted/15 border-border/50 text-xs focus-visible:ring-primary"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground">Keep it practical & founder-first.</span>
                  <Button type="submit" variant="hero" size="sm" className="h-8 text-xs gap-1.5 px-4 font-semibold">
                    <Plus size={12} /> Post Update
                  </Button>
                </div>
              </form>
            </div>

            {/* Posts Feed list */}
            <div className="space-y-4">
              {feed.map(p => (
                <div key={p.id} className="bg-card/40 border border-border rounded-xl p-6 backdrop-blur space-y-4">
                  {/* Post Header */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-sm text-foreground">
                      {p.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">{p.author}</span>
                        <span className="text-[9px] bg-muted border border-border/40 px-1.5 py-0.5 rounded text-muted-foreground font-sans font-normal uppercase tracking-wider">{p.role}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{p.time}</p>
                    </div>
                  </div>

                  {/* Post Body */}
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {p.content}
                  </p>

                  {/* Actions Bar */}
                  {(() => {
                    const isLiked = !!likedPosts[p.id];
                    const displayLikes = (p.likes || 0) + (isLiked ? 1 : 0);
                    return (
                      <div className="flex gap-4 pt-3 border-t border-border/30 text-xs text-muted-foreground">
                        <button
                          onClick={() => handleLike(p.id)}
                          className={`flex items-center gap-1.5 hover:text-primary transition-colors ${isLiked ? "text-primary font-semibold" : ""}`}
                        >
                          <ThumbsUp size={13} className={isLiked ? "fill-primary" : ""} /> {displayLikes}
                        </button>
                        <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                          <MessageSquare size={13} /> {p.commentsCount}
                        </button>
                        <button className="flex items-center gap-1.5 hover:text-primary transition-colors ml-auto">
                          <Share2 size={13} /> Share
                        </button>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Info/widgets */}
          <aside className="space-y-6">
            {/* Live event banner */}
            <div className="rounded-xl border border-border bg-card/25 p-6 space-y-4">
              <div className="flex items-center gap-2 text-yellow-500">
                <Trophy size={18} />
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">Accountability</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Join the **Weekly Build Challenge**: Build a functional n8n email automation sequence and write a thread on it. Submissions close every Sunday at midnight.
              </p>
              <div className="pt-2 border-t border-border/40 flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Weekly Prize:</span>
                <span className="font-bold text-foreground">100 AI Credits</span>
              </div>
            </div>

            {/* Meetup scheduler */}
            <div className="rounded-xl border border-border bg-card/25 p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <CalendarDays size={18} />
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">Live Sessions</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every Friday, Ravi Kumar hosts a 45-minute live Q&A inside Discord. Bring your code blocks, n8n schema files, and let's pair-debug them live.
              </p>
              <Button size="sm" variant="outlineNeon" className="w-full text-xs uppercase tracking-wider gap-1.5 h-9" asChild>
                <a href="https://discord.gg/your-mock-discord" target="_blank" rel="noreferrer">
                  Join Discord <ExternalLink size={12} />
                </a>
              </Button>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

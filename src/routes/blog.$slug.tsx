import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { marked } from "marked";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { supabaseAdmin } from "@/integrations/supabase/admin-client";

const fetchPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("blog_posts")
      .select("id,title,slug,excerpt,content,is_published,published_at,created_at,updated_at")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) { console.warn("[blog/slug]", error.message); return null; }
    return row ?? null;
  });

export const Route = createFileRoute("/blog/$slug")({
  head: ({ loaderData }: any) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.title} — Ravi Kumar AI Lab` },
            { name: "description", content: loaderData.excerpt ?? loaderData.title },
            { property: "og:title", content: loaderData.title },
            { property: "og:description", content: loaderData.excerpt ?? "" },
          ],
        }
      : {},
  loader: async ({ params }) => {
    const post = await fetchPostBySlug({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return post;
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-6xl font-bold text-primary mb-4">404</p>
          <h1 className="text-xl font-semibold mb-2">Article not found</h1>
          <p className="text-muted-foreground text-sm mb-6">
            This post may have been removed or the URL is incorrect.
          </p>
          <Link to="/" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  ),
  component: ArticlePage,
});

function estimateReadTime(content: string): number {
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function renderContent(content: string): string {
  if (!content) return "";
  if (content.trimStart().startsWith("<")) return content;
  try {
    return marked.parse(content) as string;
  } catch {
    return `<p>${content}</p>`;
  }
}

function ArticlePage() {
  const post = Route.useLoaderData();
  const html = renderContent(post.content);
  const readTime = estimateReadTime(post.content);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero banner */}
        <div className="border-b border-border bg-card/20">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
            <Link
              to="/"
              hash="blog"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft size={13} /> All articles
            </Link>
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-[-0.025em] leading-[1.1] mb-6">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {post.excerpt}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {post.published_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {new Date(post.published_at).toLocaleDateString("en", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock size={12} />
                {readTime} min read
              </span>
            </div>
          </div>
        </div>

        {/* Article body */}
        <div className="mx-auto max-w-3xl px-6 py-14">
          <div
            className="
              prose prose-invert prose-sm md:prose-base max-w-none
              prose-headings:font-display prose-headings:tracking-tight prose-headings:text-foreground
              prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground
              prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5
              prose-code:rounded prose-code:text-sm prose-code:font-mono
              prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-card prose-pre:border prose-pre:border-border
              prose-pre:rounded-xl prose-pre:overflow-x-auto
              prose-blockquote:border-l-primary/50 prose-blockquote:text-muted-foreground
              prose-blockquote:not-italic prose-blockquote:bg-muted/20 prose-blockquote:py-0.5
              prose-ul:text-muted-foreground prose-ol:text-muted-foreground
              prose-li:marker:text-primary
              prose-hr:border-border prose-hr:my-10
              prose-img:rounded-xl prose-img:border prose-img:border-border
            "
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* CTA footer */}
          <div className="mt-16 pt-10 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm">Ready to build with AI?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Let's talk about your automation goals.
              </p>
            </div>
            <Link
              to="/"
              hash="schedule"
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Book a call
            </Link>
          </div>

          <div className="mt-8">
            <Link
              to="/"
              hash="blog"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft size={13} /> Back to all articles
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { PlayCircle, CheckCircle2, Lock, ArrowLeft, BookOpen, Layers, Clock } from "lucide-react";
import { toast } from "sonner";
import { getSettings } from "@/lib/settings.functions";
import { listPublicCourses } from "@/lib/courses.functions";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Courses — Ravi Kumar AI Lab" },
      { name: "description", content: "Learn n8n automation, AI agent architectures, and solopreneur workflows. Practical step-by-step masterclasses." },
    ],
  }),
  component: CoursesPage,
});

type Lesson = {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
  content: string;
};

type Course = {
  id: string;
  title: string;
  desc: string;
  level: string;
  duration: string;
  lessonsCount: number;
  lessons: Lesson[];
};

function CoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  const fetchSettings = useServerFn(getSettings);
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchSettings(),
    staleTime: 5 * 60 * 1000,
  });

  const fetchCourses = useServerFn(listPublicCourses);
  const { data: dbCourses = [] } = useQuery({
    queryKey: ["public-courses"],
    queryFn: () => fetchCourses(),
  });

  useEffect(() => {
    if (settings?.site_name) {
      document.title = `Courses — ${settings.site_name}`;
    }
    if (settings?.meta_description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', settings.meta_description);
    }
  }, [settings]);

  const COURSES_STATIC: Course[] = [
    {
      id: "n8n-mastery",
      title: "n8n Automation Mastery",
      desc: "Learn to build self-healing backend workflows, sync custom databases, and connect APIs like a professional software engineer without writing complex code.",
      level: "Intermediate",
      duration: "4h 15m",
      lessonsCount: 4,
      lessons: [
        {
          id: "n8n-1",
          title: "Introduction to n8n & Node Architecture",
          duration: "15 mins",
          completed: true,
          locked: false,
          content: "In this lesson, you will learn the fundamental anatomy of an n8n node, triggers, actions, and how data schemas are passed from step to step in JSON format. We will set up your first local Docker instance of n8n."
        },
        {
          id: "n8n-2",
          title: "Connecting Third-Party APIs (Notion, Slack)",
          duration: "45 mins",
          completed: false,
          locked: false,
          content: "Learn how to configure OAuth credentials, save API authorization keys, and write simple JSON payloads to trigger Slack notifications and Notion database page creation automatically on webhook events."
        },
        {
          id: "n8n-3",
          title: "Advanced Error Handling & Webhooks",
          duration: "50 mins",
          completed: false,
          locked: false,
          content: "Master error-catch nodes in n8n. If an external API fails, learn how to configure automated retry logic, save logs to Supabase, and send alert emails to keep your business workflows self-healing."
        },
        {
          id: "n8n-4",
          title: "Deploying n8n to Production (Self-Hosted Docker)",
          duration: "1h 10m",
          completed: false,
          locked: true,
          content: "Locked Content. Upgrade to Pro in our Store tab to unlock deployment secrets using Docker Compose, SSL certification setup, and database backup scripts on digital servers."
        }
      ]
    },
    {
      id: "ai-agents",
      title: "AI Agents & Custom LLM Orchestration",
      desc: "Architect custom multi-agent networks using LangChain and CrewAI. Implement sequential reasoning, planning modules, and autonomous research cycles.",
      level: "Advanced",
      duration: "5h 40m",
      lessonsCount: 3,
      lessons: [
        {
          id: "ai-1",
          title: "Introduction to LLM Agent Reasonings",
          duration: "30 mins",
          completed: false,
          locked: false,
          content: "Learn about the ReAct framework, structured prompting, and configuring agent memory buffers. Understand when to use simple linear pipelines vs. dynamic agent loops."
        },
        {
          id: "ai-2",
          title: "Building Multi-Agent Teams with CrewAI",
          duration: "1h 20m",
          completed: false,
          locked: true,
          content: "Locked Content. Upgrade to Pro to learn how to assign distinct roles, backstories, and specific toolsets to separate collaborative AI agents to solve complex developer research tasks."
        },
        {
          id: "ai-3",
          title: "Deploying Custom Agents to Slack & Discord",
          duration: "1h 45m",
          completed: false,
          locked: true,
          content: "Locked Content. Complete guide on hosting your Python agentic backend, listening to Slack events, and replying asynchronously with formatting."
        }
      ]
    },
    {
      id: "solo-founder",
      title: "The Ravi Kumar AI Lab System",
      desc: "Learn to build landing pages that convert, capture leads into CRM pipelines, configure waitlists, and setup Stripe monetization for zero overhead.",
      level: "Beginner",
      duration: "2h 50m",
      lessonsCount: 3,
      lessons: [
        {
          id: "solo-1",
          title: "Designing Landing Pages that Convert",
          duration: "40 mins",
          completed: true,
          locked: false,
          content: "Step-by-step analysis of landing page structure. We cover visual branding, credibility components, Bento grid styling, and embedding waitlist call-to-actions to capture user emails immediately."
        },
        {
          id: "solo-2",
          title: "Setting up Waitlists & Leads Capture CRM",
          duration: "35 mins",
          completed: true,
          locked: false,
          content: "We create a Supabase database client, set up custom public API handlers, and route submissions to the admin dashboard, verifying database schemas and configurations."
        },
        {
          id: "solo-3",
          title: "Integrating Stripe Checkout & Monetization",
          duration: "55 mins",
          completed: false,
          locked: false,
          content: "Setup Stripe developer keys, configure product line items, launch customer portal access, and handle paid webhook events to automatically deliver downloads to buyers."
        }
      ]
    }
  ];

  const COURSES = dbCourses.length > 0
    ? dbCourses.map((c) => ({
        id: c.id,
        title: c.title,
        desc: c.desc,
        level: c.level,
        duration: c.duration,
        lessonsCount: c.lessons?.length || 0,
        lessons: c.lessons?.map((l) => ({
          id: l.id,
          title: l.title,
          duration: l.duration,
          content: l.content,
          locked: l.locked,
          completed: false,
        })) || [],
      }))
    : COURSES_STATIC;

  const handleStartCourse = (course: Course) => {
    setSelectedCourse(course);
    // Find first unlocked lesson
    const firstUnlocked = course.lessons.find(l => !l.locked) || null;
    setActiveLesson(firstUnlocked);
  };

  const handleLessonSelect = (lesson: Lesson) => {
    if (lesson.locked) {
      toast.error("Upgrade to Pro to unlock this lesson!");
      return;
    }
    setActiveLesson(lesson);
  };

  const handleMarkComplete = (lessonId: string) => {
    if (!selectedCourse) return;
    const updatedLessons = selectedCourse.lessons.map(l =>
      l.id === lessonId ? { ...l, completed: true } : l
    );
    setSelectedCourse({ ...selectedCourse, lessons: updatedLessons });
    toast.success("Lesson completed!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-6 max-w-7xl mx-auto w-full">
        {selectedCourse ? (
          /* Inline Course Viewer */
          <div className="space-y-6">
            <button
              onClick={() => { setSelectedCourse(null); setActiveLesson(null); }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={13} /> Back to Courses
            </button>

            <div className="grid lg:grid-cols-[280px_1fr] gap-8 items-start">
              {/* Course Lessons Sidebar */}
              <div className="bg-card/40 border border-border rounded-xl p-4 backdrop-blur space-y-4">
                <div>
                  <h2 className="font-display text-sm font-bold text-foreground truncate">{selectedCourse.title}</h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{selectedCourse.level} · {selectedCourse.duration}</p>
                </div>
                <div className="space-y-2">
                  {selectedCourse.lessons.map((l) => {
                    const isActive = activeLesson?.id === l.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => handleLessonSelect(l)}
                        className={`w-full flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all duration-150 ${
                          isActive
                            ? "border-primary/50 bg-primary/5 text-foreground"
                            : "border-border/30 bg-muted/5 text-muted-foreground hover:border-border/60 hover:text-foreground"
                        }`}
                      >
                        {l.locked ? (
                          <Lock size={12} className="mt-0.5 flex-shrink-0 text-muted-foreground/50" />
                        ) : l.completed ? (
                          <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0 text-primary" />
                        ) : (
                          <PlayCircle size={12} className="mt-0.5 flex-shrink-0 text-muted-foreground/80" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium leading-snug line-clamp-2">{l.title}</p>
                          <p className="text-[9px] text-muted-foreground/70 mt-1">{l.duration}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lesson Workspace */}
              <div className="bg-card/40 border border-border rounded-xl p-6 md:p-8 backdrop-blur space-y-6">
                {activeLesson ? (
                  <>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary">Lesson Workspace</span>
                      <h3 className="font-display text-2xl font-bold mt-1 text-foreground">{activeLesson.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Lesson Duration: {activeLesson.duration}</p>
                    </div>

                    {/* Mock Video Stream Player */}
                    <div className="aspect-video w-full rounded-xl border border-border/80 bg-muted/30 overflow-hidden relative flex flex-col justify-center items-center text-center p-6">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(74,222,128,0.06),transparent_70%)]" />
                      <PlayCircle size={48} className="text-primary mb-3 hover:scale-105 transition-transform cursor-pointer" />
                      <p className="text-xs font-semibold">Mock Video Streaming Server</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Video documentation matches instructions below.</p>
                    </div>

                    {/* Written Material */}
                    <div className="space-y-4 border-t border-border/50 pt-6">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Written Guide</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {activeLesson.content}
                      </p>
                    </div>

                    {/* Lesson Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-border/40">
                      <span className="text-[10px] text-muted-foreground">Make sure you complete writing your workflow exercises.</span>
                      <div className="flex gap-2">
                        {!activeLesson.completed && (
                          <Button
                            size="sm"
                            variant="hero"
                            className="text-xs h-8 uppercase tracking-wider"
                            onClick={() => handleMarkComplete(activeLesson.id)}
                          >
                            Mark as Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground">Select an unlocked lesson on the sidebar to start learning.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Course Catalog Listing */
          <div className="space-y-10">
            {(() => {
              const coursesTitle = settings?.courses_title || "Ravi Kumar AI Lab Learning Platform";
              const coursesWords = coursesTitle.split(" ");
              const coursesHighlightCount = Math.min(Math.ceil(coursesWords.length * 0.4), 2);
              const coursesMainTitle = coursesWords.slice(0, -coursesHighlightCount).join(" ");
              const coursesHighlightTitle = coursesWords.slice(-coursesHighlightCount).join(" ");

              return (
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-3">LMS Academy</p>
                  <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
                    {coursesMainTitle}{" "}
                    <span className="neon-text">{coursesHighlightTitle}</span>
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {settings?.courses_desc || "Unlock actionable, no-nonsense tutorials. Learn how to construct self-healing systems and scale your earnings as a solo builder."}
                  </p>
                </div>
              );
            })()}

            <div className="grid md:grid-cols-3 gap-6">
              {COURSES.map((c) => (
                <div key={c.id} className="bg-card/40 border border-border rounded-xl p-6 backdrop-blur flex flex-col justify-between hover:border-border/80 transition-all duration-200">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary font-semibold uppercase tracking-wider rounded-md px-2 py-0.5">{c.level}</span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock size={11} /> {c.duration}</span>
                    </div>

                    <h3 className="font-display text-xl font-bold text-foreground">{c.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{c.desc}</p>

                    <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-border/40 text-muted-foreground">
                      <div className="flex items-center gap-1.5"><Layers size={13} /> {c.lessonsCount} lessons</div>
                      <div className="flex items-center gap-1.5"><BookOpen size={13} /> Self-paced</div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleStartCourse(c)}
                    variant="outlineNeon"
                    className="w-full text-xs uppercase tracking-wider mt-6 h-9"
                  >
                    Start Learning →
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

import { useState, useEffect } from "react";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, AlertCircle, Sparkles, BookOpen, Layers, Clock, Lock, Unlock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAllCourses, upsertCourse, deleteCourse, upsertLesson, deleteLesson, type Course, type Lesson } from "@/lib/courses.functions";
import { TabLoader } from "./AdminSkeletons";

export function CoursesTab() {
  const fetchAll = useServerFn(listAllCourses);
  const upsertC = useServerFn(upsertCourse);
  const removeC = useServerFn(deleteCourse);
  
  const qc = useQueryClient();

  const { data: courses = [], isLoading, error, isError } = useQuery({ 
    queryKey: ["admin-courses"], 
    queryFn: () => fetchAll() 
  });
  
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    if (isError) {
      console.error("admin-courses query error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load courses");
    }
  }, [isError, error]);

  const saveCourse = useMutation({
    mutationFn: (v: any) => upsertC(v),
    onSuccess: () => { 
      toast.success("Course saved successfully"); 
      qc.invalidateQueries({ queryKey: ["admin-courses"] }); 
      qc.invalidateQueries({ queryKey: ["public-courses"] }); 
      setEditing(null); 
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save course"),
  });

  const delCourse = useMutation({
    mutationFn: (id: string) => removeC({ id }),
    onSuccess: () => { 
      toast.success("Course deleted successfully"); 
      qc.invalidateQueries({ queryKey: ["admin-courses"] }); 
      qc.invalidateQueries({ queryKey: ["public-courses"] }); 
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to delete course"),
  });

  return (
    <div className="grid lg:grid-cols-[1fr_450px] gap-6 items-start">
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            Courses Academy
          </h2>
          <Button size="sm" variant="outlineNeon" onClick={() => setEditing({})} className="h-8 text-xs gap-1.5">
            <Plus size={13} /> Add Course
          </Button>
        </div>

        {isLoading && <TabLoader label="Loading courses…" />}
        {isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3 text-destructive">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium mb-1">Failed to load courses</p>
              <p className="opacity-80">{(error as any)?.message ?? "An error occurred"}</p>
            </div>
          </div>
        )}
        {!isLoading && !isError && courses.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No courses in database. Add your first course to display on the courses catalog.
          </div>
        )}

        {courses.map((c) => (
          <div key={c.id} className={`flex gap-4 rounded-xl border p-4 bg-card/40 ${editing?.id === c.id ? "border-primary/40 bg-card/60" : "border-border hover:border-border/80"} transition-all duration-150`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-semibold text-sm text-foreground">{c.title}</span>
                <Badge variant="outline" className="text-[10px] uppercase font-semibold text-primary/80 border-primary/20 bg-primary/5">
                  {c.level}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={11} /> {c.duration}
                </span>
                <span className="text-[10px] font-mono text-indigo-300">
                  {c.lessons?.length || 0} lessons
                </span>
                {!c.is_active && (
                  <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                    Hidden
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">{c.desc}</p>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span>Order: {c.sort_order}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0 justify-center">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-muted/50" onClick={() => setEditing(c)} title="Edit course">
                <Pencil size={12} className="text-muted-foreground hover:text-foreground" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-destructive/10 text-destructive/70 hover:text-destructive" onClick={() => { if (confirm(`Delete the course "${c.title}" and all its lessons?`)) delCourse.mutate(c.id); }} title="Delete course">
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6 h-fit sticky top-24">
        <CourseForm 
          key={editing?.id ?? "new"} 
          initial={editing} 
          onCancel={() => setEditing(null)} 
          onSave={(v: any) => saveCourse.mutate(v)} 
          saving={saveCourse.isPending} 
        />

        {editing?.id && (
          <LessonsManager 
            course={editing} 
            onRefresh={() => qc.invalidateQueries({ queryKey: ["admin-courses"] })} 
          />
        )}
      </div>
    </div>
  );
}

function CourseForm({ initial, onSave, onCancel, saving }: { initial: any, onSave: (v: any) => void, onCancel: () => void, saving: boolean }) {
  const isNew = !initial?.id;
  const [form, setForm] = useState({
    id: initial?.id,
    title: initial?.title ?? "",
    desc: initial?.desc ?? "",
    level: initial?.level ?? "Beginner",
    duration: initial?.duration ?? "",
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: form.id,
      title: form.title,
      desc: form.desc,
      level: form.level,
      duration: form.duration,
      sort_order: form.sort_order,
      is_active: form.is_active,
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card/40 p-5 backdrop-blur">
      <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-3">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Sparkles size={14} className="text-primary animate-pulse" />
          {isNew ? "New Course Info" : "Modify Course Info"}
        </h3>
        {!isNew && (
          <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs px-2">
            Cancel Edit
          </Button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Title">
          <Input required placeholder="e.g. n8n Automation Mastery" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </Field>
        
        <Field label="Description">
          <Textarea required placeholder="Describe what the student will build, integrate, and master in this course..." rows={3} value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Level">
            <Select value={form.level} onValueChange={(val) => setForm({ ...form, level: val })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Total Duration">
            <Input required placeholder="e.g. 4h 15m" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3 items-center border-t border-border/20 pt-3">
          <Field label="Sort Order">
            <Input type="number" min="0" max="9999" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} />
          </Field>
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Visibility Status</Label>
            <div className="flex items-center gap-2 h-10">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} id="course-visibility-switch" />
              <Label htmlFor="course-visibility-switch" className="text-xs cursor-pointer select-none">
                {form.is_active ? (
                  <span className="flex items-center gap-1 text-emerald-400"><Eye size={13} /> Active</span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground"><EyeOff size={13} /> Hidden</span>
                )}
              </Label>
            </div>
          </div>
        </div>

        <Button variant="hero" type="submit" disabled={saving} className="w-full mt-2">
          {saving ? "Saving Course…" : isNew ? "Add Course" : "Apply Course Updates"}
        </Button>
      </form>
    </div>
  );
}

function LessonsManager({ course, onRefresh }: { course: Course, onRefresh: () => void }) {
  const saveL = useServerFn(upsertLesson);
  const removeL = useServerFn(deleteLesson);
  
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  
  const lessons: Lesson[] = course.lessons ?? [];

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson.title || !editingLesson.duration || !editingLesson.content) {
      toast.error("Please fill in all required lesson fields");
      return;
    }
    
    try {
      await saveL({
        id: editingLesson.id,
        course_id: course.id,
        title: editingLesson.title,
        duration: editingLesson.duration,
        content: editingLesson.content,
        locked: editingLesson.locked ?? false,
        sort_order: editingLesson.sort_order ?? 0
      });
      toast.success("Lesson saved successfully");
      setEditingLesson(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save lesson");
    }
  };

  const handleDeleteLesson = async (id: string, title: string) => {
    if (!confirm(`Delete the lesson "${title}"?`)) return;
    try {
      await removeL({ id });
      toast.success("Lesson deleted successfully");
      if (editingLesson?.id === id) {
        setEditingLesson(null);
      }
      onRefresh();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete lesson");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card/40 p-5 backdrop-blur space-y-4">
      <div className="flex items-center justify-between border-b border-border/30 pb-3">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <BookOpen size={14} className="text-primary" />
          Lessons for: <span className="text-indigo-300 font-mono text-[11px] truncate max-w-[150px]">{course.title}</span>
        </h3>
        {!editingLesson && (
          <Button size="sm" variant="outline" onClick={() => setEditingLesson({ sort_order: lessons.length * 10 })} className="h-6 text-[10px] px-2 gap-1">
            <Plus size={10} /> Add Lesson
          </Button>
        )}
      </div>

      {editingLesson ? (
        <form onSubmit={handleSaveLesson} className="space-y-3 bg-muted/10 p-3 rounded-lg border border-border/30">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-foreground">
              {editingLesson.id ? "Edit Lesson" : "New Lesson"}
            </span>
            <Button size="sm" variant="ghost" type="button" onClick={() => setEditingLesson(null)} className="h-6 text-[10px] px-1.5">
              Cancel
            </Button>
          </div>

          <Field label="Lesson Title">
            <Input required size={30} value={editingLesson.title ?? ""} onChange={e => setEditingLesson({ ...editingLesson, title: e.target.value })} placeholder="e.g. 1. Introduction to nodes" className="h-8 text-xs" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Duration">
              <Input required placeholder="e.g. 15 mins" value={editingLesson.duration ?? ""} onChange={e => setEditingLesson({ ...editingLesson, duration: e.target.value })} className="h-8 text-xs" />
            </Field>
            <Field label="Sort Order">
              <Input type="number" min="0" max="9999" value={editingLesson.sort_order ?? 0} onChange={e => setEditingLesson({ ...editingLesson, sort_order: Number(e.target.value) })} className="h-8 text-xs" />
            </Field>
          </div>

          <Field label="Lesson Written Guide Content">
            <Textarea required placeholder="Write guidelines or locked prompt instructions here..." rows={4} value={editingLesson.content ?? ""} onChange={e => setEditingLesson({ ...editingLesson, content: e.target.value })} className="text-xs" />
          </Field>

          <div className="flex items-center gap-2 py-1.5">
            <Switch checked={editingLesson.locked ?? false} onCheckedChange={v => setEditingLesson({ ...editingLesson, locked: v })} id="lesson-locked-switch" />
            <Label htmlFor="lesson-locked-switch" className="text-xs cursor-pointer select-none flex items-center gap-1.5">
              {editingLesson.locked ? (
                <span className="text-amber-400 flex items-center gap-1"><Lock size={12} /> Locked (Pro only)</span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1"><Unlock size={12} /> Unlocked (Free preview)</span>
              )}
            </Label>
          </div>

          <Button type="submit" variant="outlineNeon" className="w-full h-8 text-xs">
            Save Lesson
          </Button>
        </form>
      ) : lessons.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-4">No lessons added yet. Click "Add Lesson" above.</p>
      ) : (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
          {lessons.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-3 p-2 rounded bg-muted/20 border border-border/20 text-xs">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-foreground truncate">{l.title}</span>
                  <span className="text-[9px] text-muted-foreground font-mono">{l.duration}</span>
                  {l.locked ? (
                    <Lock size={10} className="text-amber-400" title="Locked" />
                  ) : (
                    <Unlock size={10} className="text-emerald-400" title="Unlocked" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-muted/40" onClick={() => setEditingLesson(l)} title="Edit Lesson">
                  <Pencil size={11} className="text-muted-foreground" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-destructive/10 text-destructive/70 hover:text-destructive" onClick={() => handleDeleteLesson(l.id, l.title)} title="Delete Lesson">
                  <Trash2 size={11} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

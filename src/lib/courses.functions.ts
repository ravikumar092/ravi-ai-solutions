import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "../integrations/supabase/admin-client";
import { requireAdminAuth } from "../integrations/supabase/auth-middleware";

export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  duration: string;
  content: string;
  locked: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Course = {
  id: string;
  title: string;
  desc: string;
  level: string;
  duration: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  lessons?: Lesson[];
};

export const listPublicCourses = createServerFn({ method: "GET" }).handler(
  async (): Promise<Course[]> => {
    const { data, error } = await supabaseAdmin
      .from("courses")
      .select(`
        id,
        title,
        desc,
        level,
        duration,
        sort_order,
        is_active,
        created_at,
        updated_at,
        lessons (
          id,
          course_id,
          title,
          duration,
          content,
          locked,
          sort_order,
          created_at,
          updated_at
        )
      `)
      .eq("is_active", true)
      .order("sort_order");

    if (error) {
      console.warn("[courses] listPublicCourses db error:", error.message);
      return [];
    }

    const courses = (data ?? []) as Course[];
    // Sort lessons for each course
    courses.forEach((c) => {
      if (c.lessons) {
        c.lessons.sort((a, b) => a.sort_order - b.sort_order);
      }
    });
    return courses;
  }
);

export const listAllCourses = createServerFn({ method: "GET" }).handler(
  async (): Promise<Course[]> => {
    await requireAdminAuth();
    const { data, error } = await supabaseAdmin
      .from("courses")
      .select(`
        id,
        title,
        desc,
        level,
        duration,
        sort_order,
        is_active,
        created_at,
        updated_at,
        lessons (
          id,
          course_id,
          title,
          duration,
          content,
          locked,
          sort_order,
          created_at,
          updated_at
        )
      `)
      .order("sort_order");

    if (error) {
      console.warn("[courses] listAllCourses db error:", error.message);
      return [];
    }

    const courses = (data ?? []) as Course[];
    courses.forEach((c) => {
      if (c.lessons) {
        c.lessons.sort((a, b) => a.sort_order - b.sort_order);
      }
    });
    return courses;
  }
);

const courseInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(120),
  desc: z.string().min(1).max(2000),
  level: z.string().min(1).max(60),
  duration: z.string().min(1).max(60),
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_active: z.boolean().default(true),
});

export const upsertCourse = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => courseInput.parse(d))
  .handler(async ({ data }) => {
    await requireAdminAuth();
    const payload = {
      title: data.title,
      desc: data.desc,
      level: data.level,
      duration: data.duration,
      sort_order: data.sort_order,
      is_active: data.is_active,
    };

    if (data.id) {
      const { error } = await supabaseAdmin
        .from("courses")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await supabaseAdmin
        .from("courses")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdminAuth();
    const { error } = await supabaseAdmin
      .from("courses")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const lessonInput = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  title: z.string().min(1).max(120),
  duration: z.string().min(1).max(60),
  content: z.string().min(1).max(5000),
  locked: z.boolean().default(false),
  sort_order: z.number().int().min(0).max(9999).default(0),
});

export const upsertLesson = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => lessonInput.parse(d))
  .handler(async ({ data }) => {
    await requireAdminAuth();
    const payload = {
      course_id: data.course_id,
      title: data.title,
      duration: data.duration,
      content: data.content,
      locked: data.locked,
      sort_order: data.sort_order,
    };

    if (data.id) {
      const { error } = await supabaseAdmin
        .from("lessons")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await supabaseAdmin
        .from("lessons")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const deleteLesson = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdminAuth();
    const { error } = await supabaseAdmin
      .from("lessons")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

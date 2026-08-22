import type { Workout } from "../types/domain";
import { isSupabaseConfigured, supabase } from "./supabase";

const LOCAL_KEY = "pgDunkSavedWorkouts";

function readLocal(): Workout[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "[]") as Workout[]; } catch { return []; }
}

function writeLocal(workouts: Workout[]) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(workouts));
}

function fromDatabase(row: Record<string, unknown>): Workout {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || "",
    focusArea: (row.focus_area as string) || "",
    difficulty: (row.difficulty as string) || "intermediate",
    durationMinutes: Number(row.duration_minutes || 0),
    exercises: (row.exercises || []) as Workout["exercises"],
    is_favorite: Boolean(row.is_favorite),
    created_at: row.created_at as string | undefined,
  };
}

async function getUserId(): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function listWorkouts(): Promise<Workout[]> {
  const userId = await getUserId();
  if (userId && supabase) {
    const { data, error } = await supabase.from("workouts").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => fromDatabase(row as Record<string, unknown>));
  }
  return readLocal();
}

export async function saveWorkout(workout: Workout): Promise<Workout> {
  const userId = await getUserId();
  if (userId && supabase) {
    const { data, error } = await supabase.from("workouts").insert({
      user_id: userId,
      title: workout.title,
      description: workout.description,
      focus_area: workout.focusArea,
      difficulty: workout.difficulty,
      duration_minutes: workout.durationMinutes,
      exercises: workout.exercises,
      is_favorite: workout.is_favorite ?? false,
    }).select().single();
    if (error) throw error;
    return fromDatabase(data as Record<string, unknown>);
  }
  const saved = { ...workout, id: workout.id || crypto.randomUUID(), created_at: new Date().toISOString() };
  writeLocal([saved, ...readLocal()]);
  return saved;
}

export async function updateWorkout(workout: Workout): Promise<Workout> {
  if (!workout.id) throw new Error("Un workout doit avoir un identifiant pour être modifié.");
  const userId = await getUserId();
  if (userId && supabase) {
    const { data, error } = await supabase.from("workouts").update({ title: workout.title, description: workout.description, focus_area: workout.focusArea, difficulty: workout.difficulty, duration_minutes: workout.durationMinutes, exercises: workout.exercises, is_favorite: workout.is_favorite ?? false }).eq("id", workout.id).select().single();
    if (error) throw error;
    return fromDatabase(data as Record<string, unknown>);
  }
  const updated = { ...workout, id: workout.id, created_at: workout.created_at || new Date().toISOString() };
  writeLocal(readLocal().map((item) => item.id === workout.id ? updated : item));
  return updated;
}

export async function deleteWorkout(id: string): Promise<void> {
  const userId = await getUserId();
  if (userId && supabase) {
    const { error } = await supabase.from("workouts").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  writeLocal(readLocal().filter((workout) => workout.id !== id));
}

export async function setWorkoutFavorite(id: string, isFavorite: boolean): Promise<void> {
  const userId = await getUserId();
  if (userId && supabase) {
    const { error } = await supabase.from("workouts").update({ is_favorite: isFavorite }).eq("id", id);
    if (error) throw error;
    return;
  }
  writeLocal(readLocal().map((workout) => workout.id === id ? { ...workout, is_favorite: isFavorite } : workout));
}

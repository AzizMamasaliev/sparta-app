import type { PlayerItem } from "./store";
import type { Key } from "./i18n";

/** Program day (API shape) → items for the workout player. */
export function dayToItems(day: any): PlayerItem[] {
  return [...(day?.program_day_exercises ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((x) => ({
      exercise_id: x.exercises.id,
      slug: x.exercises.slug,
      name_uz: x.exercises.name_uz,
      name_ru: x.exercises.name_ru,
      primary_muscle: x.exercises.primary_muscle,
      unit: x.duration_sec ? "time" : "reps",
      sets: x.sets,
      reps_min: x.reps_min,
      reps_max: x.reps_max,
      duration_sec: x.duration_sec,
      rest_sec: x.rest_sec,
    }));
}

export function dose(x: { sets: number; reps_min: number | null; reps_max: number | null; duration_sec: number | null }, t: (k: Key) => string) {
  const per = x.duration_sec ? `${x.duration_sec} ${t("sec")}` : x.reps_min === x.reps_max ? `${x.reps_min}` : `${x.reps_min}–${x.reps_max}`;
  return `${x.sets} × ${per}`;
}

export const RANKS = ["recruit", "warrior", "veteran", "champion", "legend"] as const;
export const RANK_XP = [0, 800, 3000, 8000, 20000];
export function rankInfo(xp: number) {
  let i = 0;
  while (i < 4 && xp >= RANK_XP[i + 1]) i++;
  const next = RANK_XP[i + 1] ?? RANK_XP[4];
  return { idx: i, key: `rank_${i}` as Key, from: RANK_XP[i], next, pct: i === 4 ? 1 : (xp - RANK_XP[i]) / (next - RANK_XP[i]) };
}

export const MUSCLE_EMOJI: Record<string, string> = {
  chest: "🛡", back: "🦅", shoulders: "⛰", biceps: "💪", triceps: "🔱", forearms: "✊", traps: "🔺",
  abs: "🧱", obliques: "🌀", glutes: "🍑", quads: "🦵", hamstrings: "🏹", calves: "⚡",
};

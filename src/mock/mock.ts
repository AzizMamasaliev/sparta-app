// In-browser demo backend: same routes and shapes as supabase/functions/api, data in localStorage.
// Used only outside Telegram (or with ?mock=1); loaded as a separate chunk.
import content from "./content.json";
import { calcTargets, e1rm, portionMacros, workoutKcal } from "../shared/nutrition.ts";
import { ApiError } from "../api";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const MUSCLES: [string, string, string, string][] = [
  ["chest", "Koʻkrak", "Грудь", "upper"], ["back", "Orqa", "Спина", "upper"], ["shoulders", "Yelka", "Плечи", "upper"],
  ["biceps", "Biseps", "Бицепс", "upper"], ["triceps", "Triseps", "Трицепс", "upper"], ["forearms", "Bilak", "Предплечья", "upper"],
  ["traps", "Trapetsiya", "Трапеции", "upper"], ["abs", "Press", "Пресс", "core"], ["obliques", "Yon mushaklar", "Косые (бока)", "core"],
  ["glutes", "Dumba mushaklari", "Ягодицы", "lower"], ["quads", "Son old qismi", "Квадрицепсы", "lower"],
  ["hamstrings", "Son orqa qismi", "Бицепс бедра", "lower"], ["calves", "Boldir", "Икры", "lower"],
];
const EQUIP: [string, string, string][] = [
  ["none", "Jihozsiz", "Без инвентаря"], ["dumbbells", "Gantellar", "Гантели"], ["barbell", "Shtanga", "Штанга"],
  ["pullup_bar", "Turnik", "Турник"], ["dip_bars", "Brusya", "Брусья"], ["bench", "Skameyka", "Скамья"],
  ["cable", "Blok trenajyor", "Блочный тренажёр"], ["machine", "Trenajyor", "Тренажёр"], ["kettlebell", "Girya", "Гиря"],
  ["bands", "Rezina", "Резинки"], ["mat", "Gilamcha", "Коврик"],
];

const exercises = (content.exercises as Any[]).map((e) => ({
  id: "ex-" + e.s, slug: e.s, name_ru: e.ru, name_uz: e.uz, primary_muscle: e.p, secondary_muscles: e.sec, equipment: e.eq,
  place: e.pl, level: e.l, mechanics: e.m, unit: e.u, met: e.met, is_premium: e.pr, contraindications: e.c,
  steps_ru: e.sru, steps_uz: e.suz, mistakes_ru: e.mru, mistakes_uz: e.muz, sort: e.o, thumb_url: null, media_url: null,
}));
const exBySlug = Object.fromEntries(exercises.map((e) => [e.slug, e]));

// Programs: same progression rules as build_programs() in the DB.
const programs = (content.programs as Any[]).map((p) => ({
  id: "pr-" + p.s, slug: p.s, title_ru: p.ru, title_uz: p.uz, description_ru: p.dru, description_uz: p.duz, goal: p.g, level: p.l,
  place: p.pl, gender_focus: p.gf, weeks: p.w, days_per_week: p.dpw, minutes_per_day: p.mins, is_premium: p.pr, sort: p.o, cover_url: null,
}));
function programDays(slug: string) {
  const p = (content.programs as Any[]).find((x) => x.s === slug);
  const out: Any[] = [];
  const gym = p.pl === "gym";
  for (let w = 1; w <= p.w; w++) {
    p.days.forEach((d: Any, i: number) => {
      const items = d.ex.map((s: string, pos: number) => {
        const ex = exBySlug[s];
        let rmin: number | null = null, rmax: number | null = null, dur: number | null = null;
        if (ex.unit === "time") dur = Math.min(30 + 10 * Math.floor((w - 1) / 2), 60);
        else if (ex.mechanics === "cardio") dur = 40;
        else if (gym && ex.mechanics === "compound") [rmin, rmax] = p.g === "strength" ? [5, 8] : [8, 12];
        else if (ex.mechanics === "isolation") [rmin, rmax] = [12, 15];
        else [rmin, rmax] = w <= 2 ? [10, 15] : [12, 20];
        if (p.s === "street-workout" && ["pull-up", "chin-up", "dips"].includes(s)) [rmin, rmax] = [5, 10];
        let rest = gym ? 90 : d.k === "circuit" ? 45 : 60;
        if (p.g === "gain" && ex.mechanics === "compound") rest = 120;
        return {
          position: pos + 1, sets: w <= 2 ? 3 : 4, reps_min: rmin, reps_max: rmax, duration_sec: dur, rest_sec: rest,
          exercises: { id: ex.id, slug: ex.slug, name_uz: ex.name_uz, name_ru: ex.name_ru, thumb_url: null, primary_muscle: ex.primary_muscle, is_premium: ex.is_premium, unit: ex.unit },
        };
      });
      out.push({
        id: `pd-${slug}-${w}-${i + 1}`, week: w, day: i + 1, title_ru: d.ru, title_uz: d.uz, is_rest: false,
        focus: [...new Set(items.map((x: Any) => x.exercises.primary_muscle))], program_day_exercises: items,
      });
    });
  }
  return out;
}

const foods = (content.foods as Any[]).map((f) => ({
  id: f.id, slug: f.id, name_uz: f.uz, name_ru: f.ru, kcal_100g: f.kcal, protein_100g: f.p, fat_100g: f.f, carbs_100g: f.c, portions: f.portions, is_local: true,
}));

// ---------------- state ----------------
interface S {
  user: Any; profile: Any | null; stats: Any; up: Any | null; workouts: Any[]; sets: Any[]; prs: Record<string, Any>;
  food: Any[]; water: Any[]; metrics: Any[]; premiumUntil: string | null; trialUsed: boolean; achievements: Any[]; squads: Any[];
}
const KEY = "sp_mock_v1";
function fresh(): S {
  return {
    user: { id: "u-demo", tg_id: 1, first_name: "Aziz", lang: "uz", ref_code: "DEMO1", is_admin: false },
    profile: null, stats: { xp: 0, rank: "recruit", current_streak: 0, best_streak: 0, last_active_on: null, workouts_total: 0, volume_total_kg: 0 },
    up: null, workouts: [], sets: [], prs: {}, food: [], water: [], metrics: [], premiumUntil: null, trialUsed: false, achievements: [], squads: [],
  };
}
let st: S = (() => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return fresh();
})();
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(st));
  } catch { /* ignore */ }
};
export function mockReset() {
  st = fresh();
  persist();
}

const today = (off = 0) => new Date(Date.now() + 5 * 36e5 + off * 864e5).toISOString().slice(0, 10);
const premium = () => !!st.premiumUntil && new Date(st.premiumUntil) > new Date();
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const rankOf = (xp: number) => (xp >= 20000 ? "legend" : xp >= 8000 ? "champion" : xp >= 3000 ? "veteran" : xp >= 800 ? "warrior" : "recruit");
const lock = (e: Any) => (!e.is_premium || premium() ? { ...e, locked: false } : { ...e, locked: true, steps_uz: [], steps_ru: [], mistakes_uz: [], mistakes_ru: [] });

function recommend(profile: Any) {
  const score = (p: Any) =>
    (p.goal === profile.goal ? 3 : 0) + (p.level === profile.level ? 2 : 0) + (p.place === profile.place || p.place === "any" ? 2 : 0) +
    (Math.abs(p.days_per_week - profile.days_per_week) <= 1 ? 1 : 0) +
    (p.gender_focus === "any" || p.gender_focus === profile.sex ? 1 : -2);
  return programs.map((p) => ({ ...p, score: score(p) })).sort((a, b) => b.score - a.score).slice(0, 3);
}

function saveProfile(body: Any) {
  const cur = st.profile ?? {};
  const m = { ...cur, ...Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)) };
  m.equipment ??= ["none"];
  m.health_flags ??= [];
  const year = new Date().getFullYear();
  const tg = calcTargets({ sex: m.sex, age: year - m.birth_year, height_cm: +m.height_cm, weight_kg: +m.weight_kg, days_per_week: +m.days_per_week, goal: m.goal, health_flags: m.health_flags });
  st.profile = { ...m, bmi: tg.bmi, bmr: tg.bmr, tdee: tg.tdee, kcal_target: tg.kcal_target, protein_g: tg.protein_g, fat_g: tg.fat_g, carbs_g: tg.carbs_g, water_ml: tg.water_ml, onboarding_done_at: cur.onboarding_done_at ?? new Date().toISOString() };
  const i = st.metrics.findIndex((x) => x.measured_on === today());
  const row = { ...(st.metrics[i] ?? {}), measured_on: today(), weight_kg: +m.weight_kg };
  if (i >= 0) st.metrics[i] = row;
  else st.metrics.push(row);
  return { profile: st.profile, targets: tg };
}

function recovery() {
  const since = Date.now() - 7 * 864e5;
  const last: Record<string, number> = {};
  const cnt: Record<string, number> = {};
  for (const s of st.sets) {
    const w = st.workouts.find((x) => x.id === s.workout_id);
    if (!w?.finished_at || new Date(w.finished_at).getTime() < since) continue;
    const ex = exercises.find((e) => e.id === s.exercise_id);
    if (!ex) continue;
    const t = new Date(w.finished_at).getTime();
    for (const [m, k] of [[ex.primary_muscle, 1], ...ex.secondary_muscles.map((x: string) => [x, 0.5])] as [string, number][]) {
      last[m] = Math.max(last[m] ?? 0, t);
      cnt[m] = (cnt[m] ?? 0) + k;
    }
  }
  return MUSCLES.map(([m]) => {
    const h = last[m] ? (Date.now() - last[m]) / 36e5 : null;
    const full = ["quads", "hamstrings", "glutes", "back", "chest"].includes(m) ? 72 : 48;
    return { muscle: m, readiness: h === null ? 100 : Math.min(100, Math.round((h / full) * 100)), sets_7d: Math.round(cnt[m] ?? 0), hours_since: h };
  });
}

function nutritionDay(date: string) {
  const logs = st.food.filter((f) => f.logged_on === date).map((f) => ({ ...f, foods: foods.find((x) => x.id === f.food_id) }));
  const p = st.profile;
  return {
    date, logs,
    water_ml: st.water.filter((w) => w.logged_on === date).reduce((a, w) => a + w.ml, 0),
    targets: p ? { kcal_target: p.kcal_target, protein_g: p.protein_g, fat_g: p.fat_g, carbs_g: p.carbs_g, water_ml: p.water_ml } : null,
  };
}

type H = (a: { body: Any; params: Record<string, string>; query: URLSearchParams }) => Any;
const R: [string, RegExp, string[], H][] = [];
function route(method: string, path: string, h: H) {
  const keys: string[] = [];
  R.push([method, new RegExp("^" + path.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)")) + "$"), keys, h]);
}

route("GET", "/me", () => ({
  user: st.user, profile: st.profile, stats: st.stats, premium: premium(), premium_until: st.premiumUntil,
  active_program: st.up ? { ...st.up, programs: programs.find((p) => p.id === st.up.program_id) } : null,
}));
route("POST", "/lang", ({ body }) => ((st.user.lang = body.lang), { ok: true }));
route("POST", "/onboarding", ({ body }) => {
  const r = saveProfile(body);
  return { ...r, recommended: recommend(st.profile) };
});
route("PATCH", "/profile", ({ body }) => saveProfile(body));
route("GET", "/catalog", () => {
  const by: Record<string, number> = {};
  exercises.forEach((e) => (by[e.primary_muscle] = (by[e.primary_muscle] ?? 0) + 1));
  return {
    muscles: MUSCLES.map(([id, uz, ru, region], i) => ({ id, name_uz: uz, name_ru: ru, region, sort: i + 1, exercises_count: by[id] ?? 0 })),
    equipment: EQUIP.map(([id, uz, ru], i) => ({ id, name_uz: uz, name_ru: ru, sort: i + 1 })),
  };
});
route("GET", "/exercises", ({ query }) => {
  const m = query.get("muscle");
  const place = query.get("place");
  const flags: string[] = st.profile?.health_flags ?? [];
  const eq: string[] = st.profile?.equipment ?? ["none"];
  return exercises
    .filter((e) => !m || e.primary_muscle === m || e.secondary_muscles.includes(m))
    .filter((e) => !place || place === "any" || e.place === place || e.place === "any")
    .sort((a, b) => a.sort - b.sort)
    .map((e) => ({ ...lock(e), caution: e.contraindications.some((c: string) => flags.includes(c)), available: e.equipment.every((x: string) => x === "none" || x === "mat" || eq.includes(x)) }))
    .filter((e) => query.get("my_equipment") !== "1" || e.available);
});
route("GET", "/exercises/:slug", ({ params }) => {
  const ex = exBySlug[params.slug];
  if (!ex) throw new ApiError(404, "exercise_not_found");
  const flags: string[] = st.profile?.health_flags ?? [];
  const pr = st.prs[ex.id];
  return {
    exercise: lock(ex), caution: ex.contraindications.some((c: string) => flags.includes(c)),
    alternatives: exercises.filter((e) => e.primary_muscle === ex.primary_muscle && e.id !== ex.id).slice(0, 6),
    personal_record: pr ?? null,
    recent_sets: st.sets.filter((s) => s.exercise_id === ex.id).slice(-5).reverse(),
  };
});
route("GET", "/programs", () => {
  const rec = st.profile ? recommend(st.profile).map((p) => p.id) : [];
  return programs.map((p) => ({ ...p, locked: p.is_premium && !premium(), recommended: rec.includes(p.id) }));
});
route("GET", "/programs/:slug", ({ params }) => {
  const p = programs.find((x) => x.slug === params.slug);
  if (!p) throw new ApiError(404, "program_not_found");
  const locked = p.is_premium && !premium();
  const days = programDays(p.slug);
  return { program: { ...p, locked }, days: locked ? days.filter((d) => d.week === 1) : days };
});
route("POST", "/programs/:slug/start", ({ params }) => {
  const p = programs.find((x) => x.slug === params.slug)!;
  if (p.is_premium && !premium()) throw new ApiError(402, "premium_required");
  st.up = { id: uid(), program_id: p.id, current_week: 1, current_day: 1, status: "active", started_at: new Date().toISOString() };
  return st.up;
});
route("GET", "/today", () => {
  const day = today();
  let next = null;
  if (st.up) {
    const p = programs.find((x) => x.id === st.up.program_id)!;
    next = programDays(p.slug).find((d) => d.week === st.up.current_week && d.day === st.up.current_day) ?? null;
  }
  const nd = nutritionDay(day);
  const eaten = nd.logs.reduce((a: Any, r: Any) => ({ kcal: a.kcal + r.kcal, protein_g: a.protein_g + r.protein_g, fat_g: a.fat_g + r.fat_g, carbs_g: a.carbs_g + r.carbs_g }), { kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 });
  return {
    date: day, program: st.up, next_day: next,
    trained_today: st.workouts.some((w) => w.finished_at && w.started_at.slice(0, 10) === new Date().toISOString().slice(0, 10)),
    recovery: recovery(), stats: st.stats, nutrition: { targets: nd.targets, eaten, water_ml: nd.water_ml },
  };
});
route("GET", "/recovery", () => recovery());
route("POST", "/workouts", ({ body }) => {
  const open = st.workouts.find((w) => !w.finished_at && Date.now() - new Date(w.started_at).getTime() < 6 * 36e5);
  if (open) return open;
  const w = { id: uid(), program_day_id: body.program_day_id ?? null, title: body.title ?? null, started_at: new Date().toISOString(), finished_at: null };
  st.workouts.push(w);
  return w;
});
route("POST", "/workouts/:id/sets", ({ params, body }) => {
  const row = { id: uid(), workout_id: params.id, exercise_id: body.exercise_id, set_no: body.set_no, weight_kg: body.weight_kg ?? null, reps: body.reps ?? null, duration_sec: body.duration_sec ?? null, done: true, created_at: new Date().toISOString() };
  st.sets = st.sets.filter((s) => !(s.workout_id === params.id && s.exercise_id === body.exercise_id && s.set_no === body.set_no));
  st.sets.push(row);
  return row;
});
route("POST", "/workouts/:id/finish", ({ params, body }) => {
  const w = st.workouts.find((x) => x.id === params.id);
  if (!w) throw new ApiError(404, "workout_not_found");
  const sets = st.sets.filter((s) => s.workout_id === w.id);
  if (!sets.length) throw new ApiError(422, "no_sets");
  const duration = Math.max(60, Math.min(4 * 3600, Math.round((Date.now() - new Date(w.started_at).getTime()) / 1000)));
  const volume = sets.reduce((a, s) => a + (s.weight_kg ?? 0) * (s.reps ?? 0), 0);
  const exs = sets.map((s) => exercises.find((e) => e.id === s.exercise_id)!).filter(Boolean);
  const muscles = [...new Set(exs.map((e) => e.primary_muscle))];
  const met = exs.reduce((a, e) => a + e.met, 0) / exs.length;
  const kcal = workoutKcal(met, +(st.profile?.weight_kg ?? 70), duration);
  const prs: string[] = [];
  for (const s of sets) {
    const e = e1rm(s.weight_kg ?? 0, s.reps ?? 0);
    if (e > (st.prs[s.exercise_id]?.best_e1rm ?? 0)) {
      st.prs[s.exercise_id] = { best_weight: s.weight_kg, best_reps: s.reps, best_e1rm: e, achieved_at: new Date().toISOString(), exercise_id: s.exercise_id };
      if (!prs.includes(s.exercise_id)) prs.push(s.exercise_id);
    }
  }
  Object.assign(w, { finished_at: new Date().toISOString(), duration_sec: duration, total_volume_kg: volume, kcal, muscles_worked: muscles, rating: body.rating ?? null });
  const s = st.stats;
  let streak = s.current_streak;
  if (s.last_active_on !== today()) streak = s.last_active_on && s.last_active_on >= today(-3) ? streak + 1 : 1;
  const xp = 100 + Math.min(60, Math.round(duration / 60)) + prs.length * 50;
  const earned: string[] = [];
  const give = (id: string, c: boolean) => {
    if (c && !st.achievements.some((a) => a.id === id)) {
      st.achievements.push({ id, earned_at: new Date().toISOString() });
      earned.push(id);
    }
  };
  give("first_workout", s.workouts_total === 0);
  give("first_pr", prs.length > 0);
  give("streak_7", streak >= 7);
  Object.assign(s, { current_streak: streak, best_streak: Math.max(streak, s.best_streak), last_active_on: today(), workouts_total: s.workouts_total + 1, volume_total_kg: s.volume_total_kg + volume, xp: s.xp + xp });
  s.rank = rankOf(s.xp);
  if (w.program_day_id && st.up) {
    const p = programs.find((x) => x.id === st.up.program_id)!;
    const [, , wk, dy] = String(w.program_day_id).match(/^pd-(.+)-(\d+)-(\d+)$/) ?? [];
    if (+wk === st.up.current_week && +dy === st.up.current_day) {
      let d = st.up.current_day + 1, wn = st.up.current_week;
      if (d > p.days_per_week) (d = 1), (wn += 1);
      if (wn > p.weeks) st.up = null;
      else Object.assign(st.up, { current_week: wn, current_day: d });
    }
  }
  return { workout_id: w.id, duration_sec: duration, volume_kg: Math.round(volume), kcal, muscles, prs, xp, total_xp: s.xp, streak, achievements: earned };
});
route("GET", "/workouts", () => st.workouts.filter((w) => w.finished_at).slice(-20).reverse());
route("GET", "/foods/search", ({ query }) => {
  const q = (query.get("q") ?? "").toLowerCase().trim();
  if (q.length < 2) return [];
  return foods.filter((f) => f.name_uz.toLowerCase().includes(q) || f.name_ru.toLowerCase().includes(q));
});
route("POST", "/food-logs", ({ body }) => {
  if (!premium() && st.food.filter((f) => f.logged_on === today()).length >= 3) throw new ApiError(402, "free_limit");
  const food = foods.find((f) => f.id === body.food_id)!;
  const portion = food.portions.find((p: Any) => p.key === body.portion_key) ?? food.portions[0];
  const grams = body.grams ?? portion.g * (body.qty ?? 1);
  const row = { id: uid(), food_id: food.id, meal: body.meal, grams, logged_on: today(), created_at: new Date().toISOString(), ...portionMacros(food, grams) };
  st.food.push(row);
  return row;
});
route("DELETE", "/food-logs/:id", ({ params }) => ((st.food = st.food.filter((f) => f.id !== params.id)), { ok: true }));
route("GET", "/nutrition/day", ({ query }) => nutritionDay(query.get("date") ?? today()));
route("POST", "/water", ({ body }) => (st.water.push({ ml: body.ml, logged_on: today() }), { ok: true }));
route("POST", "/metrics", ({ body }) => {
  const i = st.metrics.findIndex((x) => x.measured_on === today());
  const row = { ...(st.metrics[i] ?? {}), measured_on: today(), ...Object.fromEntries(Object.entries(body).filter(([, v]) => v != null && v !== "")) };
  if (i >= 0) st.metrics[i] = row;
  else st.metrics.push(row);
  if (body.weight_kg) saveProfile({ weight_kg: body.weight_kg });
  return row;
});
route("GET", "/progress", () => ({
  metrics: [...st.metrics].sort((a, b) => a.measured_on.localeCompare(b.measured_on)),
  workouts: st.workouts.filter((w) => w.finished_at),
  records: Object.values(st.prs).map((p: Any) => ({ ...p, exercises: exercises.find((e) => e.id === p.exercise_id) })),
  achievements: st.achievements.map((a) => ({ earned_at: a.earned_at, achievements: { id: a.id } })),
}));
route("GET", "/billing/plans", () => ({
  plans: [
    { id: "premium_month", title_uz: "Premium — 1 oy", title_ru: "Premium — 1 месяц", period_days: 30, price_uzs: 49000, price_stars: 200 },
    { id: "premium_year", title_uz: "Premium — 1 yil", title_ru: "Premium — 1 год", period_days: 365, price_uzs: 399000, price_stars: 1600 },
  ],
  premium: premium(), premium_until: st.premiumUntil, trial_available: !st.trialUsed,
}));
route("POST", "/billing/trial", () => {
  if (st.trialUsed) throw new ApiError(409, "trial_already_used");
  st.trialUsed = true;
  st.premiumUntil = new Date(Date.now() + 3 * 864e5).toISOString();
  return { premium_until: st.premiumUntil };
});
route("POST", "/billing/stars-invoice", ({ body }) => {
  // Demo: no real payment, grant immediately.
  st.premiumUntil = new Date(Date.now() + (body.plan_id === "premium_year" ? 365 : 30) * 864e5).toISOString();
  return { link: "mock://paid" };
});
route("POST", "/promo/redeem", () => {
  throw new ApiError(404, "promo_invalid");
});
route("GET", "/squads/mine", () => st.squads);
route("POST", "/squads", ({ body }) => {
  const sq = { id: uid(), name: body.name, invite_code: uid().slice(0, 8), board: [{ user_id: st.user.id, first_name: st.user.first_name, xp: 0 }] };
  st.squads.push(sq);
  return { squad: sq, invite_link: `https://t.me/Spartafit_bot?start=sq_${sq.invite_code}` };
});
route("POST", "/settings/notify", () => ({ ok: true }));

export async function mockApi(method: string, path: string, body: unknown) {
  await new Promise((r) => setTimeout(r, 120));
  const url = new URL(path, "http://x");
  for (const [m, re, keys, h] of R) {
    if (m !== method) continue;
    const match = re.exec(url.pathname);
    if (!match) continue;
    const params = Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
    const res = h({ body: body ?? {}, params, query: url.searchParams });
    if (method !== "GET") persist();
    return JSON.parse(JSON.stringify(res));
  }
  throw new ApiError(404, "not_found");
}

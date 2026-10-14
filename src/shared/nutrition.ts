// AUTO-COPY of supabase/functions/_shared/nutrition.ts — edit the original, then run scripts/gen_mock.py
// Body & nutrition calculations. Pure functions — the same file is copied
// into the Mini App (app/src/lib/nutrition.ts) so numbers always match.
//
// Safety rules (deliberate, do not remove):
//  * never below a floor of 1500 kcal (men) / 1200 kcal (women);
//  * deficit is capped at 20% of TDEE, and at 10% for users under 18;
//  * pregnancy flag → no deficit at all, user is told to consult a doctor;
//  * BMI < 18.5 with goal "lose" → goal is switched to "health".

export type Sex = "male" | "female";
export type Goal = "lose" | "gain" | "tone" | "health" | "strength";

export interface BodyInput {
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  days_per_week: number;
  goal: Goal;
  health_flags?: string[];
}

export interface Targets {
  bmi: number;
  bmi_class: "under" | "normal" | "over" | "obese";
  bmr: number;
  tdee: number;
  kcal_target: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  water_ml: number;
  effective_goal: Goal;
  notes: string[]; // i18n keys for the UI
}

const round = (n: number, step = 1) => Math.round(n / step) * step;

export function bmi(height_cm: number, weight_kg: number): number {
  const h = height_cm / 100;
  return Math.round((weight_kg / (h * h)) * 10) / 10;
}

export function bmiClass(b: number): Targets["bmi_class"] {
  if (b < 18.5) return "under";
  if (b < 25) return "normal";
  if (b < 30) return "over";
  return "obese";
}

/** Mifflin–St Jeor */
export function bmr({ sex, age, height_cm, weight_kg }: Pick<BodyInput, "sex" | "age" | "height_cm" | "weight_kg">): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

export function activityFactor(daysPerWeek: number): number {
  if (daysPerWeek <= 1) return 1.2;
  if (daysPerWeek <= 3) return 1.375;
  if (daysPerWeek <= 5) return 1.55;
  return 1.725;
}

export function calcTargets(input: BodyInput): Targets {
  const notes: string[] = [];
  const flags = input.health_flags ?? [];
  const b = bmi(input.height_cm, input.weight_kg);
  const cls = bmiClass(b);
  let goal = input.goal;

  if (cls === "under" && goal === "lose") {
    goal = "health";
    notes.push("note.underweight_no_deficit");
  }
  if (flags.includes("pregnancy")) {
    goal = "health";
    notes.push("note.pregnancy_consult_doctor");
  }

  const base = bmr(input);
  const tdee = Math.round(base * activityFactor(input.days_per_week));
  const maxDeficit = input.age < 18 ? 0.1 : 0.2;
  if (input.age < 18) notes.push("note.minor_soft_limits");

  const adj: Record<Goal, number> = {
    lose: -maxDeficit,
    tone: -Math.min(0.1, maxDeficit),
    health: 0,
    strength: 0.05,
    gain: 0.12,
  };
  const floor = input.sex === "male" ? 1500 : 1200;
  let kcal = Math.round(tdee * (1 + adj[goal]));
  if (kcal < floor) {
    kcal = floor;
    notes.push("note.kcal_floor_applied");
  }
  kcal = round(kcal, 10);

  // Protein per kg of a "reference" weight (caps at BMI 27 to avoid overestimating for obese users)
  const h = input.height_cm / 100;
  const refWeight = Math.min(input.weight_kg, 27 * h * h);
  const proteinPerKg: Record<Goal, number> = { lose: 2.0, tone: 1.8, strength: 1.8, gain: 1.8, health: 1.4 };
  const protein = Math.round(refWeight * proteinPerKg[goal]);
  const fat = Math.max(Math.round(refWeight * 0.9), Math.round((kcal * 0.25) / 9));
  const carbs = Math.max(Math.round((kcal - protein * 4 - fat * 9) / 4), 50);

  const water = round(input.weight_kg * 33 + (input.days_per_week / 7) * 500, 50);

  if (flags.some((f) => ["heart", "pressure", "diabetes"].includes(f))) notes.push("note.medical_flags");

  return {
    bmi: b,
    bmi_class: cls,
    bmr: base,
    tdee,
    kcal_target: kcal,
    protein_g: protein,
    fat_g: fat,
    carbs_g: carbs,
    water_ml: water,
    effective_goal: goal,
    notes,
  };
}

/** Epley estimated 1-rep max */
export function e1rm(weight: number, reps: number): number {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/** kcal burned: MET × body weight × hours */
export function workoutKcal(met: number, weightKg: number, durationSec: number): number {
  return Math.round(met * weightKg * (durationSec / 3600));
}

/** Macros for a logged portion */
export function portionMacros(
  food: { kcal_100g: number; protein_100g: number; fat_100g: number; carbs_100g: number },
  grams: number,
) {
  const k = grams / 100;
  return {
    kcal: Math.round(food.kcal_100g * k),
    protein_g: Math.round(food.protein_100g * k * 10) / 10,
    fat_g: Math.round(food.fat_100g * k * 10) / 10,
    carbs_g: Math.round(food.carbs_100g * k * 10) / 10,
  };
}

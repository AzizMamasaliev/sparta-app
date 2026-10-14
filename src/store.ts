import { useSyncExternalStore } from "react";

/** Minimal external store (Zustand-like) without dependencies. */
export function createStore<T extends object>(init: T) {
  let state = init;
  const subs = new Set<() => void>();
  const get = () => state;
  const set = (patch: Partial<T> | ((s: T) => Partial<T>)) => {
    state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
    subs.forEach((f) => f());
  };
  const subscribe = (f: () => void) => {
    subs.add(f);
    return () => void subs.delete(f);
  };
  function use(): T;
  function use<S>(sel: (s: T) => S): S;
  function use<S>(sel?: (s: T) => S) {
    return useSyncExternalStore(subscribe, () => (sel ? sel(state) : state));
  }
  return { get, set, subscribe, use };
}

export type Tab = "today" | "train" | "food" | "progress" | "profile";
export type Route =
  | { name: "muscle"; id: string }
  | { name: "exercise"; slug: string }
  | { name: "program"; slug: string }
  | { name: "player"; dayId?: string; title?: string; items: PlayerItem[] }
  | { name: "paywall"; from: string }
  | { name: "editProfile" }
  | { name: "squads" };

export interface PlayerItem {
  exercise_id: string;
  slug: string;
  name_uz: string;
  name_ru: string;
  primary_muscle: string;
  unit: "reps" | "time";
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  duration_sec: number | null;
  rest_sec: number;
}

export const nav = createStore<{ tab: Tab; stack: Route[]; toast: string | null }>({ tab: "today", stack: [], toast: null });

export const go = (r: Route) => nav.set((s) => ({ stack: [...s.stack, r] }));
export const back = () => nav.set((s) => ({ stack: s.stack.slice(0, -1) }));
export const setTab = (tab: Tab) => nav.set({ tab, stack: [] });

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(msg: string) {
  nav.set({ toast: msg });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => nav.set({ toast: null }), 2600);
}

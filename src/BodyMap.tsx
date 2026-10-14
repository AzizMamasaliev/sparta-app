// Stylised anatomical silhouette, front and back, 13 muscle zones (ids match muscle_groups).
import { haptic } from "./tg";

type Zone = { id: string; d: string; mirror?: boolean };

const FRONT: Zone[] = [
  { id: "traps", d: "M92,62 C88,70 82,75 74,79 C82,82 90,82 97,80 C98,74 96,67 92,62Z", mirror: true },
  { id: "shoulders", d: "M74,80 C62,78 51,85 49,99 C49,106 54,110 58,106 C61,96 66,89 76,86 Z", mirror: true },
  { id: "chest", d: "M99,86 C90,82 80,82 74,87 C67,93 64,102 66,110 C72,120 88,122 99,117 Z", mirror: true },
  { id: "biceps", d: "M52,108 C47,118 46,134 48,148 C52,152 58,150 60,144 C62,130 62,116 58,107 Z", mirror: true },
  { id: "forearms", d: "M47,155 C42,170 40,190 41,206 C44,209 48,208 50,205 C54,190 57,172 58,157 Z", mirror: true },
  { id: "obliques", d: "M86,124 C80,123 73,121 68,119 C68,141 70,165 76,188 C80,192 84,194 87,193 C85,170 84,145 86,124 Z", mirror: true },
  { id: "abs", d: "M88,122 H112 C114,140 115,170 112,194 C106,199 94,199 88,194 C85,170 86,140 88,122 Z" },
  { id: "quads", d: "M74,214 C69,236 70,266 76,292 C82,298 92,298 97,292 C100,268 101,240 99,216 C92,209 80,209 74,214 Z", mirror: true },
  { id: "calves", d: "M79,312 C75,330 76,352 80,372 C84,376 90,376 92,372 C95,352 96,330 94,312 C88,306 83,306 79,312 Z", mirror: true },
];
const BACK: Zone[] = [
  { id: "traps", d: "M100,58 C96,68 86,76 72,82 C84,88 94,100 100,128 C106,100 116,88 128,82 C114,76 104,68 100,58 Z" },
  { id: "shoulders", d: "M74,80 C62,78 51,85 49,99 C49,106 54,110 58,106 C61,96 66,89 76,86 Z", mirror: true },
  { id: "back", d: "M73,91 C67,105 68,125 74,150 C80,170 90,182 98,187 L98,134 C92,118 84,102 73,91 Z", mirror: true },
  { id: "triceps", d: "M52,108 C47,118 46,134 48,148 C52,152 58,150 60,144 C62,130 62,116 58,107 Z", mirror: true },
  { id: "forearms", d: "M47,155 C42,170 40,190 41,206 C44,209 48,208 50,205 C54,190 57,172 58,157 Z", mirror: true },
  { id: "glutes", d: "M99,196 C88,192 76,196 72,208 C70,222 76,236 90,238 C96,238 99,234 99,228 Z", mirror: true },
  { id: "hamstrings", d: "M74,243 C71,262 73,282 78,296 C84,300 92,300 96,296 C99,280 99,262 98,243 C90,239 80,239 74,243 Z", mirror: true },
  { id: "calves", d: "M78,310 C72,322 72,340 78,352 C80,370 84,376 88,376 C92,376 94,368 94,352 C98,340 97,322 92,310 C88,304 82,304 78,310 Z", mirror: true },
];

const BASE = (
  <g fill="#1b1b21">
    <ellipse cx="100" cy="34" rx="16" ry="20" />
    <rect x="91" y="50" width="18" height="16" rx="6" />
    <path d="M74,78 C86,73 114,73 126,78 C142,88 137,110 133,118 C130,150 128,180 129,200 C131,210 129,216 125,218 L75,218 C71,216 69,210 71,200 C72,180 70,150 67,118 C63,110 58,88 74,78Z" />
    <path d="M70,210 C66,240 68,270 74,300 C76,320 74,350 78,380 L96,380 C98,350 98,320 99,300 L101,300 C102,320 102,350 104,380 L122,380 C126,350 124,320 126,300 C132,270 134,240 130,210 Z" />
    <path d="M50,96 C44,120 42,150 40,180 C38,200 37,212 40,226 L50,226 C52,206 56,180 60,150 C63,130 64,110 62,96 Z" />
    <path d="M150,96 C156,120 158,150 160,180 C162,200 163,212 160,226 L150,226 C148,206 144,180 140,150 C137,130 136,110 138,96 Z" />
    <ellipse cx="44" cy="226" rx="7" ry="10" />
    <ellipse cx="156" cy="226" rx="7" ry="10" />
    <ellipse cx="86" cy="385" rx="10" ry="6" />
    <ellipse cx="114" cy="385" rx="10" ry="6" />
  </g>
);

export type Colorer = (muscle: string) => string;

export function BodyFigure({ side, color, onPick, height = 300, selected }: { side: "front" | "back"; color: Colorer; onPick?: (m: string) => void; height?: number; selected?: string | null }) {
  const zones = side === "front" ? FRONT : BACK;
  const shape = (z: Zone, mirrored: boolean) => (
    <path
      key={z.id + (mirrored ? "r" : "l")}
      className={onPick ? "m" : undefined}
      d={z.d}
      transform={mirrored ? "translate(200,0) scale(-1,1)" : undefined}
      fill={color(z.id)}
      stroke={selected === z.id ? "#F3D199" : "rgba(0,0,0,.35)"}
      strokeWidth={selected === z.id ? 1.6 : 0.8}
      onClick={onPick ? () => (haptic.select(), onPick(z.id)) : undefined}
    />
  );
  return (
    <svg className="body-map" viewBox="30 8 140 386" height={height} style={{ display: "block", margin: "0 auto", maxWidth: "100%" }}>
      {BASE}
      {zones.flatMap((z) => (z.mirror ? [shape(z, false), shape(z, true)] : [shape(z, false)]))}
      {side === "front" && (
        <g stroke="rgba(0,0,0,.35)" strokeWidth=".8" fill="none" pointerEvents="none">
          <path d="M100,124 V194 M89,144 H111 M88,164 H112" />
        </g>
      )}
    </svg>
  );
}

export const heatColor = (readiness: number | undefined) =>
  readiness === undefined || readiness >= 95 ? "#2b2b33" : readiness >= 70 ? "#3f9d6e" : readiness >= 40 ? "#d58a2e" : "#c4453a";

export function focusColorer(primary: string, secondary: string[]): Colorer {
  return (m) => (m === primary ? "#D9A85B" : secondary.includes(m) ? "rgba(217,168,91,.45)" : "#2b2b33");
}

export const MUSCLE_SIDE: Record<string, "front" | "back"> = {
  chest: "front", shoulders: "front", biceps: "front", forearms: "front", abs: "front", obliques: "front", quads: "front",
  back: "back", triceps: "back", traps: "back", glutes: "back", hamstrings: "back", calves: "back",
};

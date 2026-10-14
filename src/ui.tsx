import { type ReactNode, useEffect } from "react";
import { back } from "./store";
import { t } from "./i18n";
import { haptic } from "./tg";

const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const paths: Record<string, ReactNode> = {
  today: <><path d="M12 3 20 6.5v6c0 4.6-3.4 7.7-8 9.5-4.6-1.8-8-4.9-8-9.5v-6z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  train: <><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" /></>,
  food: <><path d="M4 11h16a8 8 0 0 1-16 0z" /><path d="M8 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M16 7c0-1.5 1-2 1-3.5" /></>,
  progress: <><path d="M4 19h16" /><path d="m5 15 4.5-4.5 3.5 3L19 7" /><path d="M15 7h4v4" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5" /></>,
  back: <path d="M15 5 8 12l7 7" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  fire: <path d="M12 21c3.9 0 6.5-2.6 6.5-6.3 0-3.4-2.4-5.2-3.4-8.2-.4 1.9-1.4 3-2.6 3.6.2-2.7-.9-5.4-3.3-7.1.3 3-1.4 4.6-2.8 6.3C5 11 4.5 12.6 4.5 14.7 4.5 18.4 8.1 21 12 21z" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  bolt: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" />,
  star: <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z" />,
  drop: <path d="M12 3.5c3.5 4.3 6 7.7 6 11a6 6 0 0 1-12 0c0-3.3 2.5-6.7 6-11z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
  warn: <><path d="M12 4 21 19.5H3z" /><path d="M12 10v4M12 17h.01" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v3.5M8.5 20h7M10 16.5h4" /></>,
  users: <><circle cx="9" cy="9" r="3.5" /><path d="M3 19c.9-3 3.2-4.5 6-4.5s5.1 1.5 6 4.5" /><path d="M15.5 5.6a3.5 3.5 0 0 1 0 6.8M17.5 14.8c1.6.6 2.8 2 3.5 4.2" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5z" /></>,
  gift: <><rect x="4" y="9" width="16" height="11" rx="2" /><path d="M3.5 9h17M12 9v11M12 9c-1.5-3.5-5-4-5-1.5S10 9 12 9zM12 9c1.5-3.5 5-4 5-1.5S14 9 12 9z" /></>,
  bell: <><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>,
  play: <path d="M8 5.5v13l10.5-6.5z" />,
  pause: <path d="M8 5.5v13M16 5.5v13" />,
  skip: <path d="M6 6v12l8.5-6zM18 6v12" />,
  ticket: <path d="M4 7.5h16v3a1.8 1.8 0 0 0 0 3.5v3H4v-3a1.8 1.8 0 0 0 0-3.5z" />,
  chat: <path d="M4.5 18.5 5.8 15A7.5 7.5 0 1 1 9 18.2z" />,
};

export function Icon({ name, size = 22, className, style }: { name: keyof typeof paths | string; size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} style={style} {...P}>
      {paths[name]}
    </svg>
  );
}

export function Shield({ size = 40 }: { size?: number }) {
  return <img src="./logo.png" width={size} height={size} alt="SPARTA" style={{ display: "block", objectFit: "contain" }} />;
}

export function TopBar({ title, right, onBack }: { title?: ReactNode; right?: ReactNode; onBack?: () => void }) {
  return (
    <div className="topbar">
      <button className="iconbtn" onClick={() => (haptic.tap(), (onBack ?? back)())} aria-label={t("back")}>
        <Icon name="back" />
      </button>
      <h3 className="grow ellipsis">{title}</h3>
      {right}
    </div>
  );
}

export function Ring({ value, max, size = 120, stroke = 10, color = "var(--gold)", children }: { value: number; max: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--s3)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={value > max ? "var(--red)" : color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - p)} style={{ transition: "stroke-dashoffset .6s ease" }} />
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  );
}

export function Bar({ value, max, red }: { value: number; max: number; red?: boolean }) {
  return (
    <div className={"progress" + (red || value > max * 1.05 ? " red" : "")}>
      <i style={{ width: `${Math.min(100, max ? (value / max) * 100 : 0)}%` }} />
    </div>
  );
}

export function Stepper({ value, onChange, step = 1, min, max, unit }: { value: number; onChange: (v: number) => void; step?: number; min: number; max: number; unit?: string }) {
  const set = (v: number) => {
    haptic.select();
    onChange(Math.round(Math.min(max, Math.max(min, v)) * 100) / 100);
  };
  return (
    <div className="stepper">
      <button onClick={() => set(value - step)}>−</button>
      <div>
        <span className="v">{value}</span>
        {unit && <span className="u">{unit}</span>}
      </div>
      <button onClick={() => set(value + step)}>+</button>
    </div>
  );
}

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const o = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => void (document.body.style.overflow = o);
  }, [open]);
  if (!open) return null;
  return (
    <>
      <div className="sheet-bg" onClick={onClose} />
      <div className="sheet">
        <div className="grab" />
        {children}
      </div>
    </>
  );
}

export function Loading({ h = 120, n = 3 }: { h?: number; n?: number }) {
  return (
    <div className="col">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="skeleton" style={{ height: h }} />
      ))}
    </div>
  );
}

export function ErrorBox({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="card center col" style={{ alignItems: "center" }}>
      <Icon name="warn" />
      <p className="muted">{t("error")}</p>
      {onRetry && <button className="btn dark sm" onClick={onRetry}>{t("retry")}</button>}
    </div>
  );
}

export function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt24">
      <div className="row between" style={{ marginBottom: 10 }}>
        <div className="caps">{title}</div>
        {right}
      </div>
      {children}
    </section>
  );
}

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

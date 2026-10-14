import { useState } from "react";
import { api, invalidate, useQuery } from "../api";
import { fmt, L, t, useLang } from "../i18n";
import { toast } from "../store";
import { haptic } from "../tg";
import { ErrorBox, Icon, Loading, Section, Sheet, Stepper, fmtTime } from "../ui";

const ACH = [
  ["first_workout", "🪖", "Birinchi qadam", "Первый шаг"], ["streak_7", "🔥", "7 kun safda", "7 дней в строю"], ["streak_30", "🛡", "Sparta 30", "Спарта 30"],
  ["first_pr", "🏆", "Yangi rekord", "Новый рекорд"], ["food_week", "🍲", "Toʻgʻri ovqat", "Чистая неделя"], ["squad_founder", "🚩", "Otryad sardori", "Командир отряда"],
  ["invite_3", "🤝", "Safdoshlar", "Соратники"], ["volume_10t", "🏋️", "10 tonna", "10 тонн"],
] as const;

export default function Progress({ me }: { me: any }) {
  const lang = useLang();
  const { data, error, loading, refetch } = useQuery<any>("/progress", 30_000);
  const [open, setOpen] = useState(false);
  if (loading && !data) return <div className="screen"><Loading /></div>;
  if (error && !data) return <div className="screen"><ErrorBox onRetry={refetch} /></div>;
  const metrics: any[] = (data.metrics ?? []).filter((m: any) => m.weight_kg);
  const workouts: any[] = data.workouts ?? [];
  const month = workouts.filter((w) => Date.now() - new Date(w.started_at).getTime() < 30 * 864e5);
  const earned = new Set((data.achievements ?? []).map((a: any) => a.achievements?.id));
  const first = metrics[0]?.weight_kg, last = metrics[metrics.length - 1]?.weight_kg;
  const delta = first && last ? Math.round((last - first) * 10) / 10 : 0;

  return (
    <div className="screen">
      <div className="row between">
        <h1>{t("tab_progress")}</h1>
        <button className="btn dark sm" onClick={() => setOpen(true)}><Icon name="plus" size={16} /> {t("add_measure")}</button>
      </div>

      <div className="grid3 mt16">
        <div className="kpi"><b>{me?.stats?.workouts_total ?? workouts.length}</b><span>{t("workouts_n")}</span></div>
        <div className="kpi"><b>{month.length}</b><span>{t("this_month")}</span></div>
        <div className="kpi"><b>{fmt(Math.round(Number(me?.stats?.volume_total_kg ?? 0) / 1000 * 10) / 10)} t</b><span>{t("volume")}</span></div>
      </div>

      <Section title={t("weight_trend")} right={delta ? <span className={"tag " + (delta < 0 ? "green" : "gold")}>{delta > 0 ? "+" : ""}{delta} {t("kg")}</span> : undefined}>
        <div className="card">
          {metrics.length >= 2 ? <Chart points={metrics.map((m) => +m.weight_kg)} labels={metrics.map((m) => m.measured_on.slice(5))} /> : (
            <div className="center muted small" style={{ padding: 20 }}>{last ? <><b style={{ fontSize: 28, color: "var(--tx)" }}>{last}</b> {t("kg")}<br /></> : null}{t("no_data")}</div>
          )}
        </div>
      </Section>

      <Section title={t("records")}>
        {data.records?.length ? (
          <div className="col" style={{ gap: 6 }}>
            {data.records.map((r: any, i: number) => (
              <div key={i} className="list-item">
                <Icon name="trophy" className="gold" />
                <span className="grow small ellipsis">{L(r.exercises, "name")}</span>
                <b className="small">{r.best_weight ? `${r.best_weight} ${t("kg")} × ${r.best_reps}` : `${r.best_reps} ${t("reps")}`}</b>
              </div>
            ))}
          </div>
        ) : <p className="small dim">{t("no_data")}</p>}
      </Section>

      <Section title={t("achievements")}>
        <div className="grid2">
          {ACH.map(([id, ico, uz, ru]) => (
            <div key={id} className="card tight row" style={{ opacity: earned.has(id) ? 1 : 0.38 }}>
              <span style={{ fontSize: 24, filter: earned.has(id) ? "none" : "grayscale(1)" }}>{ico}</span>
              <b className="small">{lang === "uz" ? uz : ru}</b>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t("history")}>
        {workouts.length ? (
          <div className="col" style={{ gap: 6 }}>
            {[...workouts].sort((a, b) => b.started_at.localeCompare(a.started_at)).slice(0, 12).map((w, i) => (
              <div key={i} className="list-item">
                <div className="thumb" style={{ width: 40, height: 40 }}>💪</div>
                <div className="grow">
                  <b className="small">{new Date(w.started_at).toLocaleDateString(lang === "ru" ? "ru-RU" : "uz-UZ", { day: "numeric", month: "short" })}</b>
                  <div className="xs muted">{fmtTime(w.duration_sec ?? 0)} · {fmt(Number(w.total_volume_kg ?? 0))} {t("kg")}</div>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="small dim">{t("no_data")}</p>}
      </Section>

      <Measure open={open} onClose={() => setOpen(false)} weight={Number(me?.profile?.weight_kg ?? 70)} />
    </div>
  );
}

function Chart({ points, labels }: { points: number[]; labels: string[] }) {
  const W = 320, H = 140, pad = 18;
  const min = Math.min(...points) - 0.5, max = Math.max(...points) + 0.5;
  const x = (i: number) => pad + (i * (W - pad * 2)) / Math.max(1, points.length - 1);
  const y = (v: number) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);
  const d = points.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs><linearGradient id="cg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#D9A85B" stopOpacity=".35" /><stop offset="1" stopColor="#D9A85B" stopOpacity="0" /></linearGradient></defs>
      <path d={`${d} L${x(points.length - 1)},${H - pad} L${x(0)},${H - pad} Z`} fill="url(#cg)" />
      <path d={d} fill="none" stroke="#D9A85B" strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={i === points.length - 1 ? 4 : 2.5} fill="#F3D199" />)}
      <text x={x(points.length - 1)} y={y(points[points.length - 1]) - 9} fill="#F4F1EA" fontSize="12" fontWeight="700" textAnchor="end">{points[points.length - 1]}</text>
      <text x={pad} y={H - 2} fill="#6c6a72" fontSize="10">{labels[0]}</text>
      <text x={W - pad} y={H - 2} fill="#6c6a72" fontSize="10" textAnchor="end">{labels[labels.length - 1]}</text>
    </svg>
  );
}

function Measure({ open, onClose, weight }: { open: boolean; onClose: () => void; weight: number }) {
  const [w, setW] = useState(weight);
  const [waist, setWaist] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      await api("POST", "/metrics", { weight_kg: w, waist_cm: waist ? Number(waist) : undefined });
      haptic.ok();
      invalidate("/");
      onClose();
    } catch {
      toast(t("error"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet open={open} onClose={onClose}>
      <h2>{t("add_measure")}</h2>
      <div className="field mt16"><label>{t("weight")}</label><Stepper value={w} step={0.1} min={30} max={300} unit={t("kg")} onChange={setW} /></div>
      <div className="field mt12"><label>{t("waist")}, {t("cm")}</label><input className="input" inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="—" /></div>
      <button className="btn gold mt16" disabled={busy} onClick={save}>{t("save")}</button>
    </Sheet>
  );
}

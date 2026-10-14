import { useEffect, useRef, useState } from "react";
import { api, invalidate } from "../api";
import { BodyFigure, focusColorer, MUSCLE_SIDE } from "../BodyMap";
import { fmt, L, t, useLang } from "../i18n";
import { back, go, setTab, toast, type PlayerItem } from "../store";
import { confirmClose, haptic } from "../tg";
import { Bar, fmtTime, Icon, Ring, Sheet, Stepper } from "../ui";

type Phase = "work" | "rest" | "summary";
type SetBody = { exercise_id: string; set_no: number; weight_kg?: number; reps?: number; duration_sec?: number };

const lastWeight: Record<string, number> = (() => {
  try {
    return JSON.parse(localStorage.getItem("sp_lastw") ?? "{}");
  } catch {
    return {};
  }
})();

export default function Player({ items, dayId, title }: { items: PlayerItem[]; dayId?: string; title?: string }) {
  useLang();
  const [i, setI] = useState(0);
  const [s, setS] = useState(1);
  const [phase, setPhase] = useState<Phase>("work");
  const [restEnd, setRestEnd] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(10);
  const [holdLeft, setHoldLeft] = useState<number | null>(null);
  const [holding, setHolding] = useState(false);
  const [done, setDone] = useState(0);
  const [askFinish, setAskFinish] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const workoutId = useRef<Promise<string> | null>(null);
  const queue = useRef<SetBody[]>([]);
  const started = useRef(Date.now());

  const item = items[i];
  const totalSets = items.reduce((a, x) => a + x.sets, 0);

  useEffect(() => {
    confirmClose(true);
    workoutId.current = api<any>("POST", "/workouts", { program_day_id: dayId ?? null, title: title ?? null }).then((w) => w.id);
    workoutId.current.catch(() => toast(t("error")));
    const tm = setInterval(() => setNow(Date.now()), 250);
    return () => {
      clearInterval(tm);
      confirmClose(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reset inputs when exercise changes
  useEffect(() => {
    if (!item) return;
    setReps(item.reps_max ?? item.reps_min ?? 10);
    setWeight(lastWeight[item.exercise_id] ?? 0);
    setHoldLeft(item.unit === "time" ? item.duration_sec ?? 30 : null);
    setHolding(false);
  }, [i, item]);

  // timed hold countdown
  useEffect(() => {
    if (!holding || holdLeft === null) return;
    if (holdLeft <= 0) {
      setHolding(false);
      haptic.ok();
      completeSet();
      return;
    }
    const tm = setTimeout(() => setHoldLeft((h) => (h ?? 0) - 1), 1000);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holding, holdLeft]);

  // rest end
  const restLeft = Math.max(0, Math.ceil((restEnd - now) / 1000));
  useEffect(() => {
    if (phase === "rest" && restLeft === 0) {
      haptic.heavy();
      advance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, restLeft]);

  async function flush() {
    const id = await workoutId.current!;
    while (queue.current.length) {
      await api("POST", `/workouts/${id}/sets`, queue.current[0]);
      queue.current.shift();
    }
  }

  function completeSet() {
    haptic.ok();
    const body: SetBody = item.unit === "time"
      ? { exercise_id: item.exercise_id, set_no: s, duration_sec: (item.duration_sec ?? 30) - Math.max(0, holdLeft ?? 0) || item.duration_sec || 30 }
      : { exercise_id: item.exercise_id, set_no: s, reps, weight_kg: weight || undefined };
    if (weight) {
      lastWeight[item.exercise_id] = weight;
      try {
        localStorage.setItem("sp_lastw", JSON.stringify(lastWeight));
      } catch { /* ignore */ }
    }
    queue.current.push(body);
    flush().catch(() => { /* stays queued, retried on next set / finish */ });
    setDone((d) => d + 1);
    const last = i === items.length - 1 && s >= item.sets;
    if (last) {
      setAskFinish(true);
      return;
    }
    setRestEnd(Date.now() + item.rest_sec * 1000);
    setPhase("rest");
  }

  function advance() {
    setPhase("work");
    if (s < item.sets) setS(s + 1);
    else if (i < items.length - 1) {
      setI(i + 1);
      setS(1);
    }
  }

  async function finish() {
    setBusy(true);
    try {
      await flush();
      const id = await workoutId.current!;
      const res = await api("POST", `/workouts/${id}/finish`, {});
      haptic.ok();
      invalidate("/");
      confirmClose(false);
      setSummary(res);
      setPhase("summary");
      setAskFinish(false);
    } catch (e: any) {
      toast(e?.code === "no_sets" ? "—" : t("error"));
      if (e?.code === "no_sets") back();
    } finally {
      setBusy(false);
    }
  }

  if (phase === "summary" && summary) return <Summary r={summary} items={items} />;
  if (!item) return null;

  const side = MUSCLE_SIDE[item.primary_muscle] ?? "front";
  const elapsed = Math.floor((now - started.current) / 1000);
  const nextItem = s < item.sets ? item : items[i + 1];

  return (
    <div className="screen full">
      <div className="row" style={{ marginBottom: 14 }}>
        <button className="iconbtn" onClick={() => (done ? setAskFinish(true) : back())}><Icon name="close" /></button>
        <div className="grow">
          <div className="row between xs muted"><span className="ellipsis">{title ?? t("workout")}</span><span>⏱ {fmtTime(elapsed)}</span></div>
          <div className="mt8"><Bar value={done} max={totalSets} /></div>
        </div>
      </div>

      {phase === "rest" ? (
        <div className="col center" style={{ alignItems: "center", paddingTop: 24, gap: 18 }}>
          <div className="caps">{t("rest")}</div>
          <Ring value={restLeft} max={item.rest_sec} size={220} stroke={12} color="var(--blue)">
            <div className="timer-big">{fmtTime(restLeft)}</div>
          </Ring>
          <div className="row" style={{ gap: 10 }}>
            <button className="chip" onClick={() => setRestEnd((e) => e + 15000)}>+15 {t("sec")}</button>
            <button className="chip" onClick={() => setRestEnd((e) => Math.max(Date.now(), e - 15000))}>−15 {t("sec")}</button>
          </div>
          {nextItem && (
            <div className="card tight row" style={{ width: "100%" }}>
              <span className="caps">{t("next_ex")}</span>
              <b className="grow ellipsis" style={{ textAlign: "right" }}>{L(nextItem, "name")} · {nextItem === item ? `${t("set")} ${s + 1}` : `${t("set")} 1`}</b>
            </div>
          )}
          <div className="bottom-cta"><button className="btn dark" onClick={() => (haptic.tap(), advance())}><Icon name="skip" size={18} /> {t("skip_rest")}</button></div>
        </div>
      ) : (
        <>
          <div className="card hero" style={{ padding: "14px 12px" }}>
            <div className="row" style={{ justifyContent: "center", gap: 18 }}>
              <div className="anim-move"><BodyFigure side={side} height={170} color={focusColorer(item.primary_muscle, [])} /></div>
            </div>
          </div>
          <div className="row between mt16">
            <span className="tag gold">{i + 1}/{items.length}</span>
            <button className="small gold" onClick={() => go({ name: "exercise", slug: item.slug })}>{t("technique")} →</button>
          </div>
          <h2 className="mt8">{L(item, "name")}</h2>
          <p className="muted">{t("set")} <b style={{ color: "var(--tx)" }}>{s}</b> {t("of")} {item.sets} · {item.unit === "time" ? `${item.duration_sec} ${t("sec")}` : `${item.reps_min}–${item.reps_max} ${t("reps")}`}</p>

          <div className="row mt12" style={{ gap: 6 }}>
            {Array.from({ length: item.sets }, (_, k) => (
              <i key={k} style={{ flex: 1, height: 6, borderRadius: 4, background: k + 1 < s ? "var(--gold)" : k + 1 === s ? "rgba(217,168,91,.45)" : "var(--s3)" }} />
            ))}
          </div>

          {item.unit === "time" ? (
            <div className="col center mt24" style={{ alignItems: "center", gap: 16 }}>
              <Ring value={holdLeft ?? 0} max={item.duration_sec ?? 30} size={200} stroke={12}>
                <div className="timer-big">{holdLeft ?? 0}</div>
              </Ring>
              <button className="btn dark sm" onClick={() => (haptic.tap(), setHolding(!holding))}>
                <Icon name={holding ? "pause" : "play"} size={16} /> {holding ? t("pause") : t("start_timer")}
              </button>
            </div>
          ) : (
            <div className="col gap16 mt16">
              <div className="field"><label>{t("weight_kg")} {weight === 0 && <span className="dim">· {t("bodyweight")}</span>}</label>
                <Stepper value={weight} step={2.5} min={0} max={400} unit={t("kg")} onChange={setWeight} /></div>
              <div className="field"><label>{t("reps_done")}</label>
                <Stepper value={reps} step={1} min={0} max={100} onChange={setReps} /></div>
            </div>
          )}

          <div className="bottom-cta">
            <button className="btn gold" onClick={completeSet} disabled={item.unit === "time" && holding}>
              <Icon name="check" size={18} /> {t("done_set")}
            </button>
          </div>
        </>
      )}

      <Sheet open={askFinish} onClose={() => setAskFinish(false)}>
        <h2>{t("finish_q")}</h2>
        <p className="muted mt8">{done} / {totalSets} {t("sets")}</p>
        <div className="col mt16">
          <button className="btn gold" disabled={busy || !done} onClick={finish}>{t("finish")}</button>
          <button className="btn ghost" onClick={() => setAskFinish(false)}>{t("cancel")}</button>
        </div>
      </Sheet>
    </div>
  );
}

const ACH: Record<string, [string, string, string]> = {
  first_workout: ["🪖", "Birinchi qadam", "Первый шаг"], first_pr: ["🏆", "Yangi rekord", "Новый рекорд"],
  streak_7: ["🔥", "7 kun safda", "7 дней в строю"], streak_30: ["🛡", "Sparta 30", "Спарта 30"], volume_10t: ["🏋️", "10 tonna", "10 тонн"],
};

function Summary({ r, items }: { r: any; items: PlayerItem[] }) {
  const lang = useLang();
  return (
    <div className="screen full center">
      <div style={{ fontSize: 64, marginTop: "6vh" }}>🛡</div>
      <h1 className="mt8">{t("well_done")}</h1>
      <p className="muted mt8">+{r.xp} XP · {t("streak")}: {r.streak} {t("days_short")}</p>
      <div className="grid3 mt24">
        <div className="kpi"><b>{fmtTime(r.duration_sec)}</b><span>{t("duration")}</span></div>
        <div className="kpi"><b>{fmt(r.volume_kg)}</b><span>{t("volume")}, {t("kg")}</span></div>
        <div className="kpi"><b>{r.kcal}</b><span>{t("burned")}, {t("kcal")}</span></div>
      </div>
      {r.prs?.length > 0 && (
        <div className="card hero mt16">
          <b className="gold">🏆 {t("new_pr")}</b>
          <p className="small muted mt8">{items.filter((x) => r.prs.includes(x.exercise_id)).map((x) => L(x, "name")).join(", ")}</p>
        </div>
      )}
      {r.achievements?.length > 0 && (
        <div className="col mt16">
          {r.achievements.map((a: string) => ACH[a] && (
            <div key={a} className="card tight row"><span style={{ fontSize: 26 }}>{ACH[a][0]}</span><b>{lang === "uz" ? ACH[a][1] : ACH[a][2]}</b></div>
          ))}
        </div>
      )}
      <div className="bottom-cta"><button className="btn gold" onClick={() => setTab("today")}>{t("to_home")}</button></div>
    </div>
  );
}

import { useState } from "react";
import { api, invalidate, useQuery } from "../api";
import { BodyFigure, focusColorer, MUSCLE_SIDE } from "../BodyMap";
import { L, t, useLang, type Key } from "../i18n";
import { dayToItems, dose, MUSCLE_EMOJI } from "../lib";
import { back, go, toast } from "../store";
import { haptic } from "../tg";
import { ErrorBox, Icon, Loading, Section, TopBar } from "../ui";

const LEVEL_KEY: Record<string, Key> = { beginner: "level_beginner", intermediate: "level_intermediate", advanced: "level_advanced" };
const PLACE_KEY: Record<string, Key> = { home: "place_home", outdoor: "place_outdoor", gym: "place_gym", any: "place_any" };

export function MuscleScreen({ id }: { id: string }) {
  useLang();
  const [place, setPlace] = useState<string>("");
  const [mine, setMine] = useState(false);
  const cat = useQuery<any>("/catalog", 600_000).data;
  const q = `/exercises?muscle=${id}${place ? `&place=${place}` : ""}${mine ? "&my_equipment=1" : ""}`;
  const { data, error, loading, refetch } = useQuery<any[]>(q, 120_000);
  const muscle = cat?.muscles?.find((m: any) => m.id === id);
  const primary = (data ?? []).filter((e) => e.primary_muscle === id);
  const secondary = (data ?? []).filter((e) => e.primary_muscle !== id);
  return (
    <div className="screen">
      <TopBar title={<>{MUSCLE_EMOJI[id]} {muscle ? L(muscle, "name") : ""}</>} />
      <div className="card row" style={{ gap: 14 }}>
        <BodyFigure side={MUSCLE_SIDE[id] ?? "front"} height={140} color={focusColorer(id, [])} />
        <div className="grow">
          <h2>{muscle ? L(muscle, "name") : ""}</h2>
          <p className="small muted">{primary.length} {t("exercises_n")}</p>
        </div>
      </div>
      <div className="chips mt12">
        {["", "home", "outdoor", "gym"].map((p) => (
          <button key={p} className={"chip" + (place === p ? " on" : "")} onClick={() => (haptic.select(), setPlace(p))}>{p ? t(PLACE_KEY[p]) : t("all_places")}</button>
        ))}
        <button className={"chip" + (mine ? " on" : "")} onClick={() => (haptic.select(), setMine(!mine))}>🎒 {t("my_equipment")}</button>
      </div>
      {loading && !data ? <div className="mt16"><Loading h={70} n={5} /></div> : error && !data ? <div className="mt16"><ErrorBox onRetry={refetch} /></div> : (
        <>
          <div className="col mt16">{primary.map((e) => <ExRow key={e.slug} e={e} />)}</div>
          {secondary.length > 0 && <Section title={t("secondary")}><div className="col">{secondary.map((e) => <ExRow key={e.slug} e={e} />)}</div></Section>}
          {!primary.length && !secondary.length && <p className="muted center mt24">{t("no_data")}</p>}
        </>
      )}
    </div>
  );
}

function ExRow({ e }: { e: any }) {
  return (
    <button className="list-item" onClick={() => (haptic.tap(), go({ name: "exercise", slug: e.slug }))}>
      <div className="thumb"><BodyFigure side={MUSCLE_SIDE[e.primary_muscle] ?? "front"} height={48} color={focusColorer(e.primary_muscle, e.secondary_muscles ?? [])} /></div>
      <div className="grow">
        <b className="ellipsis" style={{ display: "block" }}>{L(e, "name")}</b>
        <div className="row xs muted" style={{ gap: 6, marginTop: 3 }}>
          <span>{t(LEVEL_KEY[e.level])}</span>·<span>{t(PLACE_KEY[e.place])}</span>
          {e.caution && <span className="tag red">⚠</span>}
        </div>
      </div>
      {e.locked ? <Icon name="lock" size={18} className="dim" /> : <Icon name="chevron" size={18} className="dim" />}
    </button>
  );
}

export function ExerciseScreen({ slug }: { slug: string }) {
  const lang = useLang();
  const { data, error, loading, refetch } = useQuery<any>(`/exercises/${slug}`, 120_000);
  const cat = useQuery<any>("/catalog", 600_000).data;
  if (loading && !data) return <div className="screen"><TopBar /><Loading /></div>;
  if (error && !data) return <div className="screen"><TopBar /><ErrorBox onRetry={refetch} /></div>;
  const e = data.exercise;
  const mName = (id: string) => L(cat?.muscles?.find((m: any) => m.id === id), "name") ?? id;
  const eqName = (id: string) => L(cat?.equipment?.find((m: any) => m.id === id), "name") ?? id;
  const steps: string[] = L(e, "steps") ?? [];
  const mistakes: string[] = L(e, "mistakes") ?? [];
  const pr = data.personal_record;
  const side = MUSCLE_SIDE[e.primary_muscle] ?? "front";
  const quick = () =>
    go({
      name: "player", title: L(e, "name"),
      items: [{ exercise_id: e.id, slug: e.slug, name_uz: e.name_uz, name_ru: e.name_ru, primary_muscle: e.primary_muscle, unit: e.unit, sets: 3,
        reps_min: e.unit === "time" ? null : 10, reps_max: e.unit === "time" ? null : 12, duration_sec: e.unit === "time" ? 30 : null, rest_sec: 60 }],
    });

  return (
    <div className="screen full">
      <TopBar title={L(e, "name")} />
      <div className="card hero" style={{ padding: "18px 12px" }}>
        <div className="row" style={{ justifyContent: "space-around" }}>
          <div className="anim-move"><BodyFigure side={side} height={210} color={focusColorer(e.primary_muscle, e.secondary_muscles)} /></div>
          <BodyFigure side={side === "front" ? "back" : "front"} height={150} color={focusColorer(e.primary_muscle, e.secondary_muscles)} />
        </div>
      </div>

      <h1 className="mt16" style={{ fontSize: 24 }}>{L(e, "name")}</h1>
      <div className="row mt8" style={{ flexWrap: "wrap", gap: 6 }}>
        <span className="tag gold">{mName(e.primary_muscle)}</span>
        <span className="tag">{t(LEVEL_KEY[e.level])}</span>
        <span className="tag">{t(PLACE_KEY[e.place])}</span>
        {e.is_premium && <span className="tag gold">Premium</span>}
      </div>

      {data.caution && (
        <div className="card tight mt12 row" style={{ borderColor: "rgba(224,73,60,.4)", background: "rgba(224,73,60,.08)" }}>
          <Icon name="warn" style={{ color: "#ff8a7f", flex: "none" }} />
          <div><b className="small">{t("caution")}</b><p className="xs muted">{t("caution_d")}</p></div>
        </div>
      )}

      <div className="grid2 mt12">
        <div className="kpi"><span>{t("target_muscles")}</span><b style={{ fontSize: 14 }}>{[e.primary_muscle, ...e.secondary_muscles].map(mName).join(", ")}</b></div>
        <div className="kpi"><span>{t("equipment")}</span><b style={{ fontSize: 14 }}>{e.equipment.map(eqName).join(", ")}</b></div>
      </div>

      {pr && (
        <div className="card tight mt12 row between">
          <span className="row small"><Icon name="trophy" size={18} className="gold" /> {t("record")}</span>
          <b>{pr.best_weight ? `${pr.best_weight} ${t("kg")} × ${pr.best_reps}` : `${pr.best_reps} ${t("reps")}`}</b>
        </div>
      )}

      {e.locked ? (
        <div className="card mt16 center col" style={{ alignItems: "center", gap: 10 }}>
          <Icon name="lock" size={28} className="gold" />
          <b>{t("locked_ex")}</b>
          <button className="btn gold sm" onClick={() => go({ name: "paywall", from: "exercise" })}>{t("get_premium")}</button>
        </div>
      ) : (
        <>
          <Section title={t("technique")}>
            <ol className="steps">{steps.map((s, i) => <li key={i}><span>{s}</span></li>)}</ol>
          </Section>
          {mistakes.length > 0 && (
            <Section title={t("mistakes")}>
              <div className="col" style={{ gap: 8 }}>
                {mistakes.map((m, i) => <div key={i} className="row small"><span style={{ color: "#ff8a7f" }}>✕</span><span>{m}</span></div>)}
              </div>
            </Section>
          )}
        </>
      )}

      {data.alternatives?.length > 0 && (
        <Section title={t("alternatives")}>
          <div className="chips">
            {data.alternatives.map((a: any) => (
              <button key={a.slug} className="chip" onClick={() => go({ name: "exercise", slug: a.slug })}>{a.is_premium && <Icon name="lock" size={12} />}{lang === "uz" ? a.name_uz : a.name_ru}</button>
            ))}
          </div>
        </Section>
      )}

      {!e.locked && <div className="bottom-cta"><button className="btn gold" onClick={quick}><Icon name="play" size={18} /> {t("start")}</button></div>}
    </div>
  );
}

export function ProgramScreen({ slug }: { slug: string }) {
  useLang();
  const { data, error, loading, refetch } = useQuery<any>(`/programs/${slug}`, 120_000);
  const me = useQuery<any>("/me").data;
  const [week, setWeek] = useState(1);
  const [busy, setBusy] = useState(false);
  if (loading && !data) return <div className="screen"><TopBar /><Loading /></div>;
  if (error && !data) return <div className="screen"><TopBar /><ErrorBox onRetry={refetch} /></div>;
  const p = data.program;
  const weeks = [...new Set<number>(data.days.map((d: any) => d.week))];
  const days = data.days.filter((d: any) => d.week === week);
  const active = me?.active_program?.program_id === p.id;

  async function start() {
    if (p.locked) return go({ name: "paywall", from: "program" });
    setBusy(true);
    try {
      await api("POST", `/programs/${slug}/start`);
      haptic.ok();
      invalidate("/");
      toast("✅ " + L(p, "title"));
      back();
    } catch {
      toast(t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen full">
      <TopBar title={L(p, "title")} />
      <div className="card hero">
        <div className="row" style={{ gap: 6 }}>
          {p.is_premium ? <span className="tag gold">Premium</span> : <span className="tag green">{t("free")}</span>}
          {active && <span className="tag green">{t("program_active")}</span>}
        </div>
        <h1 className="mt8" style={{ fontSize: 24 }}>{L(p, "title")}</h1>
        <p className="muted mt8">{L(p, "description")}</p>
        <div className="grid3 mt16">
          <div className="kpi"><b>{p.weeks}</b><span>{t("weeks")}</span></div>
          <div className="kpi"><b>{p.days_per_week}</b><span>{t("days_week")}</span></div>
          <div className="kpi"><b>{p.minutes_per_day}</b><span>{t("min")}</span></div>
        </div>
      </div>

      {p.locked && <p className="small gold mt12 center">🔒 {t("program_week1")}</p>}

      <div className="chips mt16">
        {weeks.map((w) => (
          <button key={w} className={"chip" + (week === w ? " on" : "")} onClick={() => (haptic.select(), setWeek(w))}>{t("week")} {w}</button>
        ))}
        {p.locked && Array.from({ length: p.weeks - 1 }, (_, i) => <span key={i} className="chip dim"><Icon name="lock" size={12} /> {i + 2}</span>)}
      </div>

      <div className="col mt12">
        {days.map((d: any) => (
          <div key={d.id} className="card">
            <div className="row between">
              <b>{t("day")} {d.day} · {L(d, "title")}</b>
              {!p.locked && (
                <button className="iconbtn" onClick={() => go({ name: "player", dayId: active ? d.id : undefined, title: L(d, "title"), items: dayToItems(d) })}><Icon name="play" size={16} /></button>
              )}
            </div>
            <div className="col mt8" style={{ gap: 6 }}>
              {dayToItems(d).map((x) => (
                <button key={x.slug} className="row between small" style={{ textAlign: "left" }} onClick={() => go({ name: "exercise", slug: x.slug })}>
                  <span className="ellipsis grow">{L(x, "name")}</span>
                  <span className="dim">{dose(x, t)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!active && (
        <div className="bottom-cta">
          <button className="btn gold" disabled={busy} onClick={start}>{p.locked ? <><Icon name="lock" size={18} /> {t("get_premium")}</> : t("program_start")}</button>
        </div>
      )}
    </div>
  );
}

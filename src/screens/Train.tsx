import { useState } from "react";
import { useQuery } from "../api";
import { BodyFigure, MUSCLE_SIDE } from "../BodyMap";
import { L, t, useLang, type Key } from "../i18n";
import { MUSCLE_EMOJI } from "../lib";
import { go } from "../store";
import { haptic } from "../tg";
import { ErrorBox, Icon, Loading } from "../ui";

let lastSeg: "muscle" | "programs" = "muscle";

export default function Train() {
  useLang();
  const [seg, setSeg] = useState(lastSeg);
  const pick = (s: typeof seg) => ((lastSeg = s), haptic.select(), setSeg(s));
  return (
    <div className="screen">
      <h1>{t("tab_train")}</h1>
      <div className="seg mt16">
        <button className={seg === "muscle" ? "on" : ""} onClick={() => pick("muscle")}>{t("by_muscle")}</button>
        <button className={seg === "programs" ? "on" : ""} onClick={() => pick("programs")}>{t("programs")}</button>
      </div>
      {seg === "muscle" ? <Muscles /> : <Programs />}
    </div>
  );
}

function Muscles() {
  const { data, error, loading, refetch } = useQuery<any>("/catalog", 600_000);
  const [hover, setHover] = useState<string | null>(null);
  if (loading && !data) return <div className="mt16"><Loading /></div>;
  if (error && !data) return <div className="mt16"><ErrorBox onRetry={refetch} /></div>;
  const muscles: any[] = data?.muscles ?? [];
  const color = (m: string) => (hover === m ? "#D9A85B" : "#34343d");
  const open = (m: string) => {
    setHover(m);
    setTimeout(() => go({ name: "muscle", id: m }), 140);
  };
  return (
    <>
      <div className="card mt16">
        <div className="row" style={{ justifyContent: "space-around" }}>
          <div className="center"><BodyFigure side="front" height={250} color={color} onPick={open} selected={hover} /><div className="xs dim mt8">{t("front")}</div></div>
          <div className="center"><BodyFigure side="back" height={250} color={color} onPick={open} selected={hover} /><div className="xs dim mt8">{t("rear")}</div></div>
        </div>
        <p className="xs dim center mt8">{t("tap_muscle")}</p>
      </div>
      <div className="grid2 mt12">
        {muscles.map((m) => (
          <button key={m.id} className="list-item" onClick={() => (haptic.tap(), go({ name: "muscle", id: m.id }))}>
            <span style={{ fontSize: 20 }}>{MUSCLE_EMOJI[m.id]}</span>
            <span className="grow">
              <b className="small ellipsis" style={{ display: "block" }}>{L(m, "name")}</b>
              <span className="xs dim">{m.exercises_count} {t("exercises_n")} · {t(MUSCLE_SIDE[m.id] === "front" ? "front" : "rear")}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

const GOAL_ICON: Record<string, string> = { lose: "🔥", gain: "💪", tone: "✨", strength: "🏋️", health: "🌿" };
const PLACE_KEY: Record<string, Key> = { home: "place_home", outdoor: "place_outdoor", gym: "place_gym", any: "place_any" };

function Programs() {
  const { data, error, loading, refetch } = useQuery<any[]>("/programs", 120_000);
  const me = useQuery<any>("/me").data;
  if (loading && !data) return <div className="mt16"><Loading h={110} /></div>;
  if (error && !data) return <div className="mt16"><ErrorBox onRetry={refetch} /></div>;
  const list = [...(data ?? [])].sort((a, b) => Number(b.recommended) - Number(a.recommended) || a.sort - b.sort);
  const activeId = me?.active_program?.program_id;
  return (
    <div className="col mt16">
      {list.map((p) => (
        <button key={p.slug} className={"card press" + (p.recommended ? " hero" : "")} style={{ textAlign: "left" }} onClick={() => (haptic.tap(), go({ name: "program", slug: p.slug }))}>
          <div className="row between">
            <div className="row" style={{ gap: 6 }}>
              {p.id === activeId && <span className="tag green">{t("program_active")}</span>}
              {p.recommended && p.id !== activeId && <span className="tag gold">★ {t("recommended")}</span>}
            </div>
            {p.locked ? <span className="tag"><Icon name="lock" size={12} /> Premium</span> : !p.is_premium ? <span className="tag green">{t("free")}</span> : null}
          </div>
          <div className="row mt8" style={{ gap: 12 }}>
            <div className="thumb" style={{ fontSize: 26 }}>{GOAL_ICON[p.goal]}</div>
            <div className="grow">
              <h3>{L(p, "title")}</h3>
              <p className="small muted" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{L(p, "description")}</p>
            </div>
          </div>
          <div className="row mt12 xs muted" style={{ gap: 14 }}>
            <span>📅 {p.weeks} {t("weeks")}</span>
            <span>🔁 {p.days_per_week} {t("days_week")}</span>
            <span>⏱ {p.minutes_per_day} {t("min")}</span>
            <span>📍 {t(PLACE_KEY[p.place])}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

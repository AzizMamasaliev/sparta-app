import { useState } from "react";
import { api, invalidate } from "../api";
import { L, setLang, t, useLang, fmt, type Key } from "../i18n";
import { haptic } from "../tg";
import { Bar, Icon, Ring, Shield, Stepper } from "../ui";

const year = new Date().getFullYear();
type Draft = {
  sex?: "male" | "female"; birth_year: number; height_cm: number; weight_kg: number; target_weight_kg?: number;
  goal?: string; level?: string; place?: string; equipment: string[]; days_per_week: number; health_flags: string[];
};

const GOALS = [["lose", "🔥"], ["tone", "✨"], ["gain", "💪"], ["strength", "🏋️"], ["health", "🌿"]] as const;
const LEVELS = [["beginner", "🌱"], ["intermediate", "⚔️"], ["advanced", "🛡"]] as const;
const PLACES = [["home", "🏠"], ["outdoor", "🌳"], ["gym", "🏟"], ["any", "🔁"]] as const;
const EQUIP = [["none", "🙌", "Jihozsiz", "Без инвентаря"], ["dumbbells", "🏋️", "Gantellar", "Гантели"], ["pullup_bar", "🪜", "Turnik", "Турник"], ["dip_bars", "🤸", "Brusya", "Брусья"], ["bench", "🛋", "Skameyka", "Скамья"], ["barbell", "🏋️‍♂️", "Shtanga", "Штанга"], ["kettlebell", "🔔", "Girya", "Гиря"], ["bands", "〰️", "Rezina", "Резинки"], ["mat", "🧘", "Gilamcha", "Коврик"], ["machine", "⚙️", "Trenajyorlar", "Тренажёры"]] as const;
const HEALTH = ["knees", "back", "shoulders", "pressure", "heart", "diabetes", "pregnancy"] as const;
const DEFAULT_EQ: Record<string, string[]> = { home: ["none", "mat"], outdoor: ["none", "pullup_bar", "dip_bars"], gym: ["none", "dumbbells", "barbell", "bench", "machine"], any: ["none"] };
const NOTE: Record<string, Key> = {
  "note.underweight_no_deficit": "note_underweight", "note.pregnancy_consult_doctor": "note_pregnancy", "note.minor_soft_limits": "note_minor",
  "note.kcal_floor_applied": "note_floor", "note.medical_flags": "note_medical",
};
const TOTAL = 8;

export default function Onboarding({ firstName, onDone }: { firstName?: string; onDone: () => void }) {
  const lang = useLang();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [d, setD] = useState<Draft>({ birth_year: year - 25, height_cm: 175, weight_kg: 75, equipment: ["none"], days_per_week: 3, health_flags: [] });
  const up = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const next = () => (haptic.tap(), setStep((s) => s + 1));

  async function submit() {
    setBusy(true);
    setStep(TOTAL + 1);
    try {
      const [res] = await Promise.all([api("POST", "/onboarding", { ...d, lang }), new Promise((r) => setTimeout(r, 1400))]);
      haptic.ok();
      setResult(res); // /me is refreshed when the user leaves the result screen
    } catch {
      setStep(TOTAL);
    } finally {
      setBusy(false);
    }
  }

  const canNext = [true, !!d.sex, d.height_cm > 0, !!d.goal, !!d.level, !!d.place, d.equipment.length > 0, true, true][step];

  if (result) return <Result r={result} onDone={() => (invalidate("/"), onDone())} />;
  if (step === TOTAL + 1)
    return (
      <div className="screen center" style={{ display: "grid", placeItems: "center", minHeight: "80vh" }}>
        <div className="col" style={{ alignItems: "center", gap: 18 }}>
          <div className="pulse"><Shield size={84} /></div>
          <h2>{t("ob_calc")}</h2>
          <div style={{ width: 200 }}><Bar value={busy ? 70 : 100} max={100} /></div>
        </div>
      </div>
    );

  const opt = (on: boolean, onClick: () => void, ico: string, title: string, desc?: string) => (
    <button key={title} className={"opt" + (on ? " on" : "")} onClick={() => (haptic.select(), onClick())}>
      <span className="ico">{ico}</span>
      <span className="grow">
        <b style={{ display: "block" }}>{title}</b>
        {desc && <span className="small muted">{desc}</span>}
      </span>
      <span className="check">{on && <Icon name="check" size={14} />}</span>
    </button>
  );

  return (
    <div className="screen full">
      {step > 0 && (
        <div className="row" style={{ marginBottom: 22 }}>
          <button className="iconbtn" onClick={() => setStep(step - 1)}><Icon name="back" /></button>
          <div className="grow"><Bar value={step} max={TOTAL} /></div>
          <span className="small dim">{step}/{TOTAL}</span>
        </div>
      )}

      {step === 0 && (
        <div className="col gap16" style={{ paddingTop: "8vh" }}>
          <div style={{ alignSelf: "center" }}><Shield size={96} /></div>
          <div className="center col" style={{ gap: 8 }}>
            <div className="caps gold">SPARTA</div>
            <h1>{t("ob_hello")}{firstName ? `, ${firstName}` : ""}</h1>
            <p className="muted">{t("ob_hello_sub")}</p>
          </div>
          <div className="caps mt16">{t("ob_lang")}</div>
          <div className="grid2">
            {(["uz", "ru"] as const).map((l) => (
              <button key={l} className={"opt" + (lang === l ? " on" : "")} onClick={() => (haptic.select(), setLang(l))} style={{ justifyContent: "center" }}>
                <b>{l === "uz" ? "🇺🇿 Oʻzbekcha" : "🇷🇺 Русский"}</b>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="col">
          <h2>{t("ob_sex")}</h2>
          <div className="col mt16">
            {opt(d.sex === "male", () => up({ sex: "male" }), "♂", t("male"))}
            {opt(d.sex === "female", () => up({ sex: "female" }), "♀", t("female"))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="col gap16">
          <h2>{t("ob_body")}</h2>
          <div className="field"><label>{t("birth_year")} · {year - d.birth_year}</label><Stepper value={d.birth_year} min={year - 90} max={year - 12} onChange={(v) => up({ birth_year: v })} /></div>
          <div className="field"><label>{t("height")}</label><Stepper value={d.height_cm} min={120} max={230} unit={t("cm")} onChange={(v) => up({ height_cm: v })} /></div>
          <div className="field"><label>{t("weight")}</label><Stepper value={d.weight_kg} step={0.5} min={35} max={250} unit={t("kg")} onChange={(v) => up({ weight_kg: v })} /></div>
          <div className="field">
            <label>{t("target_weight")}</label>
            <input className="input" inputMode="decimal" placeholder="—" value={d.target_weight_kg ?? ""} onChange={(e) => up({ target_weight_kg: e.target.value ? Number(e.target.value.replace(",", ".")) || undefined : undefined })} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="col">
          <h2>{t("ob_goal")}</h2>
          <div className="col mt16">{GOALS.map(([g, i]) => opt(d.goal === g, () => up({ goal: g }), i, t(`goal_${g}` as Key), t(`goal_${g}_d` as Key)))}</div>
        </div>
      )}

      {step === 4 && (
        <div className="col">
          <h2>{t("ob_level")}</h2>
          <div className="col mt16">{LEVELS.map(([g, i]) => opt(d.level === g, () => up({ level: g }), i, t(`level_${g}` as Key), t(`level_${g}_d` as Key)))}</div>
        </div>
      )}

      {step === 5 && (
        <div className="col">
          <h2>{t("ob_place")}</h2>
          <div className="col mt16">{PLACES.map(([g, i]) => opt(d.place === g, () => up({ place: g, equipment: DEFAULT_EQ[g] }), i, t(`place_${g}` as Key)))}</div>
        </div>
      )}

      {step === 6 && (
        <div className="col">
          <h2>{t("ob_equipment")}</h2>
          <div className="grid2 mt16">
            {EQUIP.map(([id, ico, uz, ru]) => {
              const on = d.equipment.includes(id);
              return (
                <button key={id} className={"opt" + (on ? " on" : "")} style={{ padding: 12, gap: 10 }}
                  onClick={() => (haptic.select(), up({ equipment: on ? d.equipment.filter((x) => x !== id) : [...d.equipment, id] }))}>
                  <span style={{ fontSize: 20 }}>{ico}</span>
                  <b className="small">{lang === "uz" ? uz : ru}</b>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="col">
          <h2>{t("ob_days")}</h2>
          <p className="muted">{t("ob_days_sub")}</p>
          <div className="grid3 mt16">
            {[2, 3, 4, 5, 6].map((n) => (
              <button key={n} className={"opt" + (d.days_per_week === n ? " on" : "")} style={{ justifyContent: "center", height: 72 }} onClick={() => (haptic.select(), up({ days_per_week: n }))}>
                <b style={{ fontSize: 24 }}>{n}</b>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 8 && (
        <div className="col">
          <h2>{t("ob_health")}</h2>
          <p className="muted">{t("ob_health_sub")}</p>
          <div className="row mt16" style={{ flexWrap: "wrap", gap: 8 }}>
            {HEALTH.filter((h) => h !== "pregnancy" || d.sex === "female").map((h) => {
              const on = d.health_flags.includes(h);
              return (
                <button key={h} className={"chip" + (on ? " on" : "")} onClick={() => (haptic.select(), up({ health_flags: on ? d.health_flags.filter((x) => x !== h) : [...d.health_flags, h] }))}>
                  {on && <Icon name="check" size={14} />}{t(`h_${h}` as Key)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="bottom-cta">
        <button className="btn gold" disabled={!canNext || busy} onClick={step === TOTAL ? submit : next}>
          {step === 0 ? t("start") : step === TOTAL ? t("done") : t("next")}
        </button>
      </div>
    </div>
  );
}

function Result({ r, onDone }: { r: any; onDone: () => void }) {
  const tg = r.targets;
  const bmiKey = `bmi_${tg.bmi_class}` as Key;
  return (
    <div className="screen full">
      <div className="caps gold">SPARTA</div>
      <h1 className="mt8">{t("ob_result")}</h1>
      <p className="muted small mt8">{t("ob_result_sub")}</p>

      <div className="card hero mt16 row gap16">
        <Ring value={tg.kcal_target} max={tg.kcal_target} size={124} stroke={11}>
          <div><b style={{ fontSize: 26 }}>{fmt(tg.kcal_target)}</b><div className="xs muted">{t("kcal")} / {t("per_day")}</div></div>
        </Ring>
        <div className="col grow" style={{ gap: 8 }}>
          {([["protein", tg.protein_g, "#e0493c"], ["fat", tg.fat_g, "#f0a43a"], ["carbs", tg.carbs_g, "#5aa9f0"]] as const).map(([k, v, c]) => (
            <div key={k} className="row between">
              <span className="row small" style={{ gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: 4, background: c }} />{t(k)}</span>
              <b>{v} {t("g")}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="grid2 mt12">
        <div className="kpi"><b>{(tg.water_ml / 1000).toFixed(1)} L</b><span>💧 {t("water")}</span></div>
        <div className="kpi"><b>{tg.bmi}</b><span>{t("bmi")} · {t(bmiKey)}</span></div>
      </div>

      {tg.notes?.length > 0 && (
        <div className="card tight mt12 col" style={{ gap: 6 }}>
          {tg.notes.map((n: string) => NOTE[n] && (
            <div key={n} className="row small"><Icon name="info" size={16} className="gold" /><span>{t(NOTE[n])}</span></div>
          ))}
        </div>
      )}

      {r.recommended?.length > 0 && (
        <>
          <div className="caps mt24">{t("rec_programs")}</div>
          <div className="col mt8">
            {r.recommended.map((p: any, i: number) => (
              <div key={p.slug} className="list-item">
                <div className="thumb" style={{ fontSize: 22 }}>{["🥇", "🥈", "🥉"][i]}</div>
                <div className="grow">
                  <b className="ellipsis" style={{ display: "block" }}>{L(p, "title")}</b>
                  <span className="small muted">{p.weeks} {t("weeks")} · {p.days_per_week} {t("days_week")} · {p.minutes_per_day} {t("min")}</span>
                </div>
                {p.is_premium ? <span className="tag gold">Premium</span> : <span className="tag green">{t("free")}</span>}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="bottom-cta"><button className="btn gold" onClick={onDone}>{t("go_today")}</button></div>
    </div>
  );
}

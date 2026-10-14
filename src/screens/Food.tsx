import { useEffect, useState } from "react";
import { api, ApiError, invalidate, useQuery } from "../api";
import { fmt, L, t, useLang, type Key } from "../i18n";
import { go, toast } from "../store";
import { haptic } from "../tg";
import { Bar, ErrorBox, Icon, Loading, Ring, Section, Sheet, Stepper } from "../ui";

const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;
const defaultMeal = () => {
  const h = new Date().getHours();
  return h < 11 ? "breakfast" : h < 16 ? "lunch" : h < 21 ? "dinner" : "snack";
};

export default function Food({ premium }: { premium: boolean }) {
  useLang();
  const { data, error, loading, refetch } = useQuery<any>("/nutrition/day", 15_000);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<any[]>([]);
  const [pick, setPick] = useState<any>(null);

  useEffect(() => {
    if (q.trim().length < 2) return setFound([]);
    const tm = setTimeout(() => api<any[]>("GET", `/foods/search?q=${encodeURIComponent(q.trim())}`).then(setFound).catch(() => setFound([])), 250);
    return () => clearTimeout(tm);
  }, [q]);

  if (loading && !data) return <div className="screen"><Loading /></div>;
  if (error && !data) return <div className="screen"><ErrorBox onRetry={refetch} /></div>;
  const tg = data?.targets;
  const logs: any[] = data?.logs ?? [];
  const sum = logs.reduce((a, r) => ({ kcal: a.kcal + r.kcal, p: a.p + +r.protein_g, f: a.f + +r.fat_g, c: a.c + +r.carbs_g }), { kcal: 0, p: 0, f: 0, c: 0 });

  async function water(ml: number) {
    haptic.tap();
    await api("POST", "/water", { ml });
    invalidate("/nutrition");
    invalidate("/today");
  }
  async function remove(id: string) {
    haptic.tap();
    await api("DELETE", `/food-logs/${id}`);
    invalidate("/nutrition");
    invalidate("/today");
  }

  return (
    <div className="screen">
      <h1>{t("tab_food")}</h1>
      {tg ? (
        <div className="card hero mt16 row gap16">
          <Ring value={sum.kcal} max={tg.kcal_target} size={116} stroke={10}>
            <div><b style={{ fontSize: 22 }}>{fmt(sum.kcal)}</b><div className="xs muted">/ {fmt(tg.kcal_target)} {t("kcal")}</div></div>
          </Ring>
          <div className="col grow" style={{ gap: 8 }}>
            {([["protein", sum.p, tg.protein_g], ["fat", sum.f, tg.fat_g], ["carbs", sum.c, tg.carbs_g]] as const).map(([k, v, m]) => (
              <div key={k}><div className="row between xs"><span className="muted">{t(k)}</span><span>{Math.round(v)} / {m} {t("g")}</span></div><Bar value={v} max={m} /></div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="card tight mt12 row">
        <Icon name="drop" style={{ color: "var(--blue)" }} />
        <div className="grow">
          <b>{(data.water_ml / 1000).toFixed(2)} L</b> <span className="small muted">/ {((tg?.water_ml ?? 2000) / 1000).toFixed(1)} L</span>
          <div className="mt8"><Bar value={data.water_ml} max={tg?.water_ml ?? 2000} /></div>
        </div>
        <button className="chip" onClick={() => water(250)}>+250</button>
        <button className="chip" onClick={() => water(500)}>+500</button>
      </div>

      {!premium ? (
        <div className="card mt16 center col" style={{ alignItems: "center", gap: 10, padding: 24 }}>
          <div style={{ fontSize: 40 }}>🍲</div>
          <h3>{t("food_locked")}</h3>
          <p className="small muted">{t("food_locked_d")}</p>
          <button className="btn gold mt8" onClick={() => go({ name: "paywall", from: "food" })}>{t("pw_trial")}</button>
        </div>
      ) : (
        <>
          <div className="mt16" style={{ position: "relative" }}>
            <Icon name="search" size={18} style={{ position: "absolute", left: 14, top: 14, color: "var(--tx3)" }} />
            <input className="input search" style={{ paddingLeft: 40 }} placeholder={t("search_food")} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {found.length > 0 && (
            <div className="col mt8">
              {found.map((f) => (
                <button key={f.id} className="list-item" onClick={() => (haptic.tap(), setPick(f))}>
                  <div className="grow"><b className="ellipsis" style={{ display: "block" }}>{L(f, "name")}</b><span className="xs muted">{f.kcal_100g} {t("kcal")} / 100 {t("g")}</span></div>
                  <Icon name="plus" className="gold" />
                </button>
              ))}
            </div>
          )}
          {MEALS.map((m) => {
            const rows = logs.filter((l) => l.meal === m);
            const kc = rows.reduce((a, r) => a + r.kcal, 0);
            return (
              <Section key={m} title={t(m as Key)} right={<span className="small dim">{kc} {t("kcal")}</span>}>
                {rows.length ? (
                  <div className="col" style={{ gap: 6 }}>
                    {rows.map((r) => (
                      <div key={r.id} className="list-item" style={{ padding: "10px 12px" }}>
                        <div className="grow"><b className="small">{L(r.foods, "name")}</b><div className="xs muted">{Math.round(r.grams)} {t("g")} · {r.kcal} {t("kcal")}</div></div>
                        <button className="iconbtn" style={{ width: 32, height: 32 }} onClick={() => remove(r.id)}><Icon name="close" size={14} /></button>
                      </div>
                    ))}
                  </div>
                ) : <p className="small dim">{t("empty_meal")}</p>}
              </Section>
            );
          })}
        </>
      )}

      <AddFood food={pick} onClose={() => setPick(null)} onAdded={() => (setPick(null), setQ(""))} />
    </div>
  );
}

function AddFood({ food, onClose, onAdded }: { food: any; onClose: () => void; onAdded: () => void }) {
  const lang = useLang();
  const [portion, setPortion] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [meal, setMeal] = useState<string>(defaultMeal());
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (food) {
      setPortion(food.portions?.[0]?.key ?? "");
      setQty(1);
    }
  }, [food]);
  if (!food) return null;
  const p = food.portions?.find((x: any) => x.key === portion) ?? food.portions?.[0];
  const grams = (p?.g ?? 100) * qty;
  const k = grams / 100;

  async function add() {
    setBusy(true);
    try {
      await api("POST", "/food-logs", { food_id: food.id, portion_key: p?.key, qty, meal });
      haptic.ok();
      invalidate("/nutrition");
      invalidate("/today");
      toast("✅ " + L(food, "name"));
      onAdded();
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) go({ name: "paywall", from: "food" });
      else toast(t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={!!food} onClose={onClose}>
      <h2>{L(food, "name")}</h2>
      <p className="small muted">{food.kcal_100g} {t("kcal")} / 100 {t("g")}</p>
      <div className="caps mt16">{t("portion")}</div>
      <div className="chips mt8">
        {food.portions?.map((x: any) => (
          <button key={x.key} className={"chip" + (portion === x.key ? " on" : "")} onClick={() => setPortion(x.key)}>{lang === "uz" ? x.uz : x.ru} · {x.g} {t("g")}</button>
        ))}
      </div>
      <div className="caps mt16">{t("qty")}</div>
      <div className="mt8"><Stepper value={qty} step={0.5} min={0.5} max={10} onChange={setQty} /></div>
      <div className="chips mt16">
        {MEALS.map((m) => <button key={m} className={"chip" + (meal === m ? " on" : "")} onClick={() => setMeal(m)}>{t(m as Key)}</button>)}
      </div>
      <div className="grid3 mt16">
        <div className="kpi"><b>{Math.round(food.kcal_100g * k)}</b><span>{t("kcal")}</span></div>
        <div className="kpi"><b>{Math.round(food.protein_100g * k)}</b><span>{t("protein")}, {t("g")}</span></div>
        <div className="kpi"><b>{Math.round(food.carbs_100g * k)}</b><span>{t("carbs")}, {t("g")}</span></div>
      </div>
      <button className="btn gold mt16" disabled={busy} onClick={add}>{t("add")} · {Math.round(grams)} {t("g")}</button>
    </Sheet>
  );
}

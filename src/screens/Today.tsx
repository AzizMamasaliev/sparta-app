import { api, invalidate, useQuery } from "../api";
import { BodyFigure, heatColor } from "../BodyMap";
import { fmt, L, t, useLang } from "../i18n";
import { dayToItems, dose, rankInfo } from "../lib";
import { go, setTab } from "../store";
import { haptic } from "../tg";
import { Bar, ErrorBox, Icon, Loading, Ring, Section } from "../ui";

export default function Today({ me }: { me: any }) {
  useLang();
  const { data, error, loading, refetch } = useQuery<any>("/today", 15_000);
  const name = me?.user?.first_name ?? "";
  if (loading && !data) return <div className="screen"><Loading /></div>;
  if (error && !data) return <div className="screen"><ErrorBox onRetry={refetch} /></div>;
  if (!data) return null;

  const stats = data.stats ?? { xp: 0, current_streak: 0 };
  const rk = rankInfo(stats.xp ?? 0);
  const rec = Object.fromEntries((data.recovery ?? []).map((r: any) => [r.muscle, r.readiness]));
  const n = data.nutrition;
  const day = data.next_day;
  const prog = me?.active_program?.programs;

  async function addWater() {
    haptic.tap();
    await api("POST", "/water", { ml: 250 });
    invalidate("/today");
  }

  return (
    <div className="screen">
      <div className="row between">
        <div>
          <div className="small muted">{t("hello")}{name ? "," : ""}</div>
          <h1>{name || "SPARTA"}</h1>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div className="tag" style={{ height: 32, padding: "0 10px", fontSize: 14 }}><Icon name="fire" size={16} style={{ color: "#ff8a4c" }} /> {stats.current_streak ?? 0}</div>
          {me?.premium && <div className="tag gold" style={{ height: 32, padding: "0 10px" }}>PRO</div>}
        </div>
      </div>

      <div className="card tight mt16">
        <div className="row between small">
          <span><span className="muted">{t("level")}:</span> <b className="gold">{t(rk.key)}</b></span>
          <span className="dim">{fmt(stats.xp ?? 0)} / {fmt(rk.next)} XP</span>
        </div>
        <div className="mt8"><Bar value={rk.pct * 100} max={100} /></div>
      </div>

      <Section title={t("today_plan")}>
        {!data.program ? (
          <div className="card hero col">
            <h3>{t("no_program")}</h3>
            <p className="muted small">{t("no_program_sub")}</p>
            <button className="btn gold mt8" onClick={() => setTab("train")}>{t("choose_program")}</button>
          </div>
        ) : day ? (
          <div className="card hero">
            <div className="row between">
              <span className="tag gold">{t("week")} {day.week} · {t("day")} {day.day}</span>
              {data.trained_today && <span className="tag green">✓</span>}
            </div>
            <h2 className="mt8">{L(day, "title")}</h2>
            {prog && <p className="small muted">{L(prog, "title")}</p>}
            <div className="col mt12" style={{ gap: 6 }}>
              {dayToItems(day).map((x) => (
                <div key={x.slug} className="row between small">
                  <span className="ellipsis grow">{L(x, "name")}</span>
                  <span className="dim" style={{ fontVariantNumeric: "tabular-nums" }}>{dose(x, t)}</span>
                </div>
              ))}
            </div>
            {data.trained_today && <p className="small gold mt12">{t("trained_today")}</p>}
            <button className="btn gold mt16" onClick={() => (haptic.tap(), go({ name: "player", dayId: day.id, title: L(day, "title"), items: dayToItems(day) }))}>
              <Icon name="play" size={18} /> {t("start")}
            </button>
          </div>
        ) : (
          <div className="card"><p className="muted">{t("rest_day")}</p></div>
        )}
      </Section>

      <Section title={t("recovery")}>
        <div className="card">
          <div className="row" style={{ justifyContent: "space-around" }}>
            <BodyFigure side="front" height={190} color={(m) => heatColor(rec[m])} />
            <BodyFigure side="back" height={190} color={(m) => heatColor(rec[m])} />
          </div>
          <p className="xs dim center mt8">{t("recovery_sub")}</p>
        </div>
      </Section>

      <Section title={t("nutrition_today")} right={<button className="small gold" onClick={() => setTab("food")}>{t("food_diary")} →</button>}>
        {n?.targets ? (
          <div className="card row gap16">
            <Ring value={n.eaten.kcal} max={n.targets.kcal_target} size={104} stroke={9}>
              <div><b style={{ fontSize: 20 }}>{fmt(Math.max(0, n.targets.kcal_target - n.eaten.kcal))}</b><div className="xs muted">{t("kcal")} {t("left")}</div></div>
            </Ring>
            <div className="col grow" style={{ gap: 8 }}>
              {([["protein", n.eaten.protein_g, n.targets.protein_g], ["fat", n.eaten.fat_g, n.targets.fat_g], ["carbs", n.eaten.carbs_g, n.targets.carbs_g]] as const).map(([k, v, m]) => (
                <div key={k}>
                  <div className="row between xs"><span className="muted">{t(k)}</span><span>{Math.round(v)} / {m} {t("g")}</span></div>
                  <Bar value={v} max={m} />
                </div>
              ))}
              <div className="row between mt8">
                <span className="small"><Icon name="drop" size={15} style={{ color: "var(--blue)", verticalAlign: -3 }} /> {(n.water_ml / 1000).toFixed(2)} / {(n.targets.water_ml / 1000).toFixed(1)} L</span>
                <button className="chip" style={{ height: 30 }} onClick={addWater}>{t("add_water")}</button>
              </div>
            </div>
          </div>
        ) : <div className="card muted">{t("no_data")}</div>}
      </Section>
    </div>
  );
}

import { useState } from "react";
import { api, ApiError, invalidate, MOCK, useQuery } from "../api";
import { fmt, setLang, t, useLang, type Key } from "../i18n";
import { rankInfo } from "../lib";
import { back, go, toast } from "../store";
import { haptic, openInvoice, openTgLink, shareText, tgUser } from "../tg";
import { Bar, Icon, Section, Sheet, Stepper, TopBar } from "../ui";

const BOT = "Spartafit_bot";

export default function Profile({ me }: { me: any }) {
  const lang = useLang();
  const [promo, setPromo] = useState(false);
  const p = me?.profile;
  const st = me?.stats ?? { xp: 0 };
  const rk = rankInfo(st.xp ?? 0);
  const refLink = `https://t.me/${BOT}?start=ref_${me?.user?.ref_code ?? ""}`;
  const photo = me?.user?.photo_url ?? tgUser?.photo_url;
  const changeLang = async (l: "uz" | "ru") => {
    haptic.select();
    setLang(l);
    api("POST", "/lang", { lang: l }).catch(() => {});
  };
  const item = (icon: string, label: string, onClick: () => void, hint?: string) => (
    <button className="list-item" onClick={() => (haptic.tap(), onClick())}>
      <Icon name={icon} className="gold" />
      <span className="grow">{label}{hint && <span className="xs muted" style={{ display: "block" }}>{hint}</span>}</span>
      <Icon name="chevron" size={18} className="dim" />
    </button>
  );

  return (
    <div className="screen">
      <div className="card hero row gap16">
        <div className="thumb" style={{ width: 64, height: 64, borderRadius: 20, fontSize: 28 }}>
          {photo ? <img src={photo} alt="" width={64} height={64} /> : "🛡"}
        </div>
        <div className="grow">
          <h2 className="ellipsis">{me?.user?.first_name ?? "Spartan"}</h2>
          <div className="small gold">{t(rk.key)} · {fmt(st.xp ?? 0)} XP</div>
          <div className="mt8"><Bar value={rk.pct * 100} max={100} /></div>
        </div>
      </div>

      <div className="card mt12 row between">
        {me?.premium ? (
          <>
            <span><b className="gold">Premium</b><div className="xs muted">{t("premium_until")} {new Date(me.premium_until).toLocaleDateString(lang === "ru" ? "ru-RU" : "uz-UZ")}</div></span>
            <span style={{ fontSize: 26 }}>⭐</span>
          </>
        ) : (
          <>
            <span><b>{t("free")}</b><div className="xs muted">{t("pw_sub")}</div></span>
            <button className="btn gold sm" onClick={() => go({ name: "paywall", from: "profile" })}>Premium</button>
          </>
        )}
      </div>

      {p && (
        <Section title={t("my_plan")} right={<button className="small gold" onClick={() => go({ name: "editProfile" })}>{t("edit_profile")}</button>}>
          <div className="grid3">
            <div className="kpi"><b>{fmt(p.kcal_target)}</b><span>{t("kcal")}</span></div>
            <div className="kpi"><b>{p.weight_kg}</b><span>{t("weight")}, {t("kg")}</span></div>
            <div className="kpi"><b>{p.bmi}</b><span>{t("bmi")}</span></div>
            <div className="kpi"><b>{p.protein_g}</b><span>{t("protein")}, {t("g")}</span></div>
            <div className="kpi"><b>{p.fat_g}</b><span>{t("fat")}, {t("g")}</span></div>
            <div className="kpi"><b>{p.carbs_g}</b><span>{t("carbs")}, {t("g")}</span></div>
          </div>
          <p className="xs dim mt8">{t("goal")}: {t(`goal_${p.goal}` as Key)} · {t(`level_${p.level}` as Key)} · {p.days_per_week} {t("days_week")}</p>
        </Section>
      )}

      <Section title={t("language")}>
        <div className="seg">
          <button className={lang === "uz" ? "on" : ""} onClick={() => changeLang("uz")}>🇺🇿 Oʻzbekcha</button>
          <button className={lang === "ru" ? "on" : ""} onClick={() => changeLang("ru")}>🇷🇺 Русский</button>
        </div>
      </Section>

      <div className="col mt24">
        {item("gift", t("invite"), () => shareText(refLink, lang === "uz" ? "SPARTA — Telegramdagi shaxsiy murabbiy. Men bilan birga shugʻullan! 💪" : "SPARTA — личный тренер в Telegram. Тренируйся со мной! 💪"), t("invite_d"))}
        {item("users", t("squads"), () => go({ name: "squads" }))}
        {item("ticket", t("promo"), () => setPromo(true))}
        {item("chat", t("support"), () => openTgLink(`https://t.me/${BOT}`))}
      </div>

      {MOCK && (
        <button className="btn ghost mt16" onClick={async () => {
          const m = await import("../mock/mock");
          m.mockReset();
          location.reload();
        }}>↺ Demo reset</button>
      )}
      <p className="xs dim center mt16">SPARTA v0.1 · @{BOT}</p>
      <Promo open={promo} onClose={() => setPromo(false)} />
    </div>
  );
}

function Promo({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [code, setCode] = useState("");
  async function apply() {
    try {
      const r = await api<any>("POST", "/promo/redeem", { code });
      haptic.ok();
      invalidate("/");
      toast(r.premium_until ? t("pw_ok") : `−${r.discount_pct}%`);
      onClose();
    } catch {
      haptic.warn();
      toast("❌ " + t("promo"));
    }
  }
  return (
    <Sheet open={open} onClose={onClose}>
      <h2>{t("promo")}</h2>
      <input className="input mt16" style={{ textTransform: "uppercase" }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="SPARTA2027" />
      <button className="btn gold mt12" disabled={code.trim().length < 3} onClick={apply}>{t("promo_apply")}</button>
    </Sheet>
  );
}

export function Paywall({ from }: { from: string }) {
  const lang = useLang();
  const { data } = useQuery<any>("/billing/plans", 30_000);
  const [plan, setPlan] = useState("premium_year");
  const [busy, setBusy] = useState(false);
  const plans: any[] = data?.plans ?? [];
  const sel = plans.find((p) => p.id === plan);
  void from; // analytics: paywall_view source

  const [ok, setOk] = useState(false);
  async function done(msg: string) {
    haptic.ok();
    toast(msg);
    invalidate("/");
    setOk(true);
  }
  async function trial() {
    setBusy(true);
    try {
      await api("POST", "/billing/trial");
      await done(t("pw_trial_ok"));
    } catch (e) {
      toast(e instanceof ApiError && e.code === "trial_already_used" ? "✓" : t("error"));
    } finally {
      setBusy(false);
    }
  }
  async function buy() {
    setBusy(true);
    try {
      const { link } = await api<any>("POST", "/billing/stars-invoice", { plan_id: plan });
      const status = link.startsWith("mock://") ? "paid" : await openInvoice(link);
      if (status === "paid") {
        // the bot webhook grants Premium; give it a moment, then refresh
        await new Promise((r) => setTimeout(r, 1500));
        await done(t("pw_ok"));
      }
    } catch {
      toast(t("error"));
    } finally {
      setBusy(false);
    }
  }

  if (ok || data?.premium) {
    return (
      <div className="screen full center">
        <TopBar />
        <div style={{ fontSize: 72, marginTop: "8vh" }}>⭐</div>
        <h1 className="mt16">{t("pw_ok")}</h1>
        <p className="muted mt8">{t("pw_sub")}</p>
        <div className="bottom-cta"><button className="btn gold" onClick={() => back()}>{t("done")}</button></div>
      </div>
    );
  }

  return (
    <div className="screen full">
      <TopBar />
      <div className="center">
        <div style={{ fontSize: 56 }}>🛡</div>
        <h1 className="mt8">{t("pw_title")}</h1>
        <p className="muted mt8">{t("pw_sub")}</p>
      </div>
      <div className="card mt16 col" style={{ gap: 12 }}>
        {(["pw_f1", "pw_f2", "pw_f3", "pw_f4", "pw_f5"] as const).map((k) => (
          <div key={k} className="row"><span className="tag gold" style={{ padding: 4 }}><Icon name="check" size={14} /></span><span>{t(k)}</span></div>
        ))}
      </div>
      <div className="col mt16">
        {plans.map((p) => {
          const yearly = p.period_days >= 365;
          return (
            <button key={p.id} className={"opt" + (plan === p.id ? " on" : "")} onClick={() => (haptic.select(), setPlan(p.id))}>
              <span className="grow">
                <span className="row" style={{ gap: 8 }}><b>{t(yearly ? "pw_year" : "pw_month")}</b>{yearly && <span className="tag green">{t("pw_save")}</span>}</span>
                <span className="small muted">{fmt(p.price_uzs)} {lang === "uz" ? "soʻm" : "сум"}{yearly && ` · ≈${fmt(Math.round(p.price_uzs / 12 / 1000) * 1000)} ${t("pw_per_month")}`}</span>
              </span>
              <b className="gold">⭐ {p.price_stars}</b>
              <span className="check">{plan === p.id && <Icon name="check" size={14} />}</span>
            </button>
          );
        })}
      </div>
      <p className="xs dim center mt12">{t("pw_note")}</p>
      <div className="bottom-cta" style={{ flexDirection: "column", alignItems: "center", gap: 6 }}>
        {data?.trial_available && <button className="btn gold" disabled={busy} onClick={trial}>{t("pw_trial")}</button>}
        <button className={"btn " + (data?.trial_available ? "dark" : "gold")} disabled={busy || !sel} onClick={buy}>{t("pw_buy")} · ⭐ {sel?.price_stars ?? ""}</button>
      </div>
    </div>
  );
}

export function EditProfile() {
  useLang();
  const me = useQuery<any>("/me").data;
  const p = me?.profile;
  const [w, setW] = useState<number>(Number(p?.weight_kg ?? 70));
  const [goal, setGoal] = useState<string>(p?.goal ?? "tone");
  const [days, setDays] = useState<number>(p?.days_per_week ?? 3);
  const [place, setPlace] = useState<string>(p?.place ?? "home");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      await api("PATCH", "/profile", { weight_kg: w, goal, days_per_week: days, place });
      haptic.ok();
      invalidate("/");
      toast("✅ " + t("save"));
      back();
    } catch {
      toast(t("error"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="screen full">
      <TopBar title={t("edit_profile")} />
      <div className="field"><label>{t("weight")}</label><Stepper value={w} step={0.5} min={35} max={250} unit={t("kg")} onChange={setW} /></div>
      <div className="caps mt24">{t("goal")}</div>
      <div className="chips mt8">{["lose", "tone", "gain", "strength", "health"].map((g) => <button key={g} className={"chip" + (goal === g ? " on" : "")} onClick={() => setGoal(g)}>{t(`goal_${g}` as Key)}</button>)}</div>
      <div className="caps mt24">{t("place")}</div>
      <div className="chips mt8">{["home", "outdoor", "gym", "any"].map((g) => <button key={g} className={"chip" + (place === g ? " on" : "")} onClick={() => setPlace(g)}>{t(`place_${g}` as Key)}</button>)}</div>
      <div className="caps mt24">{t("ob_days")}</div>
      <div className="chips mt8">{[2, 3, 4, 5, 6].map((n) => <button key={n} className={"chip" + (days === n ? " on" : "")} onClick={() => setDays(n)}>{n}</button>)}</div>
      <div className="bottom-cta"><button className="btn gold" disabled={busy} onClick={save}>{t("save")}</button></div>
    </div>
  );
}

export function Squads() {
  const lang = useLang();
  const { data, refetch } = useQuery<any[]>("/squads/mine", 30_000);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true);
    try {
      const r = await api<any>("POST", "/squads", { name });
      haptic.ok();
      setName("");
      invalidate("/squads");
      refetch();
      shareText(r.invite_link, lang === "uz" ? `«${name}» otryadiga qoʻshil — SPARTA’da birga shugʻullanamiz 💪` : `Вступай в отряд «${name}» — тренируемся вместе в SPARTA 💪`);
    } catch (e) {
      toast(e instanceof ApiError && e.code === "too_many_squads" ? "Max 3" : t("error"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="screen">
      <TopBar title={t("squads")} />
      <div className="card hero">
        <h3>{t("squad_create")}</h3>
        <p className="small muted mt8">{lang === "uz" ? "Doʻstlaringizni chaqiring: har hafta XP boʻyicha reyting, kim koʻproq mashq qilsa — oʻsha birinchi." : "Позовите друзей: рейтинг по XP каждую неделю — кто больше тренируется, тот первый."}</p>
        <input className="input mt12" style={{ fontSize: 16 }} value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder={t("squad_name")} />
        <button className="btn gold mt12" disabled={busy || name.trim().length < 2} onClick={create}>{t("squad_create")}</button>
      </div>
      {(data ?? []).map((s) => (
        <Section key={s.id} title={s.name} right={<button className="small gold" onClick={() => shareText(`https://t.me/${BOT}?start=sq_${s.invite_code}`, s.name)}>{t("invite")}</button>}>
          <div className="caps" style={{ marginBottom: 8 }}>{t("squad_board")}</div>
          <div className="col" style={{ gap: 6 }}>
            {(s.board ?? []).map((b: any, i: number) => (
              <div key={b.user_id} className="list-item">
                <b style={{ width: 22 }} className={i === 0 ? "gold" : "dim"}>{i + 1}</b>
                <span className="grow">{b.first_name ?? "—"}</span>
                <b className="small">{fmt(b.xp ?? 0)} XP</b>
              </div>
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}

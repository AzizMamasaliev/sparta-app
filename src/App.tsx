import { useEffect } from "react";
import { MOCK, useQuery } from "./api";
import { getLang, setLang, t, useLang } from "./i18n";
import { back, nav, setTab, type Route, type Tab } from "./store";
import { haptic, setBack, startParam, tgUser } from "./tg";
import { go } from "./store";
import { ErrorBox, Icon, Shield } from "./ui";
import Onboarding from "./screens/Onboarding";
import Today from "./screens/Today";
import Train from "./screens/Train";
import { ExerciseScreen, MuscleScreen, ProgramScreen } from "./screens/Catalog";
import Player from "./screens/Player";
import Food from "./screens/Food";
import Progress from "./screens/Progress";
import Profile, { EditProfile, Paywall, Squads } from "./screens/Profile";

const TABS: [Tab, string, Parameters<typeof t>[0]][] = [
  ["today", "today", "tab_today"], ["train", "train", "tab_train"], ["food", "food", "tab_food"],
  ["progress", "progress", "tab_progress"], ["profile", "profile", "tab_profile"],
];

export default function App() {
  useLang();
  const { tab, stack, toast } = nav.use();
  const { data: me, error, refetch } = useQuery<any>("/me", 30_000);
  const top: Route | undefined = stack[stack.length - 1];

  // server language wins on first load if user never chose locally
  useEffect(() => {
    if (me?.user?.lang && !localStorage.getItem("sp_lang") && me.user.lang !== getLang()) setLang(me.user.lang);
  }, [me?.user?.lang]);

  // Deep links from the bot: startapp=program_<slug>
  useEffect(() => {
    if (me?.profile?.onboarding_done_at && startParam?.startsWith("program_") && !sessionStorage.getItem("sp_deeplink")) {
      sessionStorage.setItem("sp_deeplink", "1");
      setTab("train");
      go({ name: "program", slug: startParam.slice(8) });
    }
  }, [me?.profile?.onboarding_done_at]);

  useEffect(() => {
    setBack(stack.length ? () => back() : null);
    window.scrollTo(0, 0);
  }, [stack.length, tab]);

  if (error && !me)
    return <div className="screen" style={{ paddingTop: "30vh" }}><ErrorBox onRetry={refetch} /></div>;
  if (!me)
    return <div style={{ display: "grid", placeItems: "center", height: "100vh" }}><div className="pulse"><Shield size={72} /></div></div>;
  if (!me.profile?.onboarding_done_at)
    return <Onboarding firstName={me.user?.first_name ?? tgUser?.first_name} onDone={() => (setTab("today"), refetch())} />;

  let screen: JSX.Element;
  if (top) {
    switch (top.name) {
      case "muscle": screen = <MuscleScreen key={top.id} id={top.id} />; break;
      case "exercise": screen = <ExerciseScreen key={top.slug} slug={top.slug} />; break;
      case "program": screen = <ProgramScreen key={top.slug} slug={top.slug} />; break;
      case "player": screen = <Player items={top.items} dayId={top.dayId} title={top.title} />; break;
      case "paywall": screen = <Paywall from={top.from} />; break;
      case "editProfile": screen = <EditProfile />; break;
      case "squads": screen = <Squads />; break;
    }
  } else {
    screen = {
      today: <Today me={me} />, train: <Train />, food: <Food premium={!!me.premium} />,
      progress: <Progress me={me} />, profile: <Profile me={me} />,
    }[tab];
  }
  const hideTabs = top && ["player", "paywall", "exercise", "program", "editProfile"].includes(top.name);

  return (
    <div className="app">
      {MOCK && <div className="demo-bar">{t("demo")}</div>}
      <div key={top ? stack.length + top.name : tab}>{screen!}</div>
      {!hideTabs && (
        <div className="tabbar">
          <nav>
            {TABS.map(([id, icon, label]) => (
              <button key={id} className={tab === id && !top ? "on" : ""} onClick={() => (haptic.select(), setTab(id))}>
                <Icon name={icon} />
                {t(label)}
              </button>
            ))}
          </nav>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

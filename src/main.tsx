import { createRoot } from "react-dom/client";
import App from "./App";
import { tgReady } from "./tg";
import { getLang } from "./i18n";
import "./styles.css";

tgReady();
document.documentElement.lang = getLang();
createRoot(document.getElementById("root")!).render(<App />);

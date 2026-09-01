import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Блокировка pull-to-refresh живёт в хуке usePreventPullToRefresh (подключён в App).


createRoot(document.getElementById("root")!).render(<App />);

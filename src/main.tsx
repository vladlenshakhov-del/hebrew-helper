import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installAndroidNoRefresh } from "./lib/androidNoRefresh";

installAndroidNoRefresh();

createRoot(document.getElementById("root")!).render(<App />);

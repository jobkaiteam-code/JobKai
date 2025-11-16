import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupTokenRefresh } from "./firebase/config";

// Setup automatic Firebase token refresh
setupTokenRefresh();

createRoot(document.getElementById("root")!).render(<App />);

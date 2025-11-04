import "./global.css";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FontSizeProvider } from "./hooks/use-font-size";
import { SearchProvider } from "./context/SearchContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import SettingsProductionPath from "./pages/SettingsProductionPath";
import AppLayout from "@/components/layout/AppLayout";
import ModelsAll from "./pages/ModelsAll";
import JobWork from "./pages/JobWork";
import NewModel from "./pages/NewModel";
import EditModel from "./pages/EditModel";
import Roadmap from "./pages/Roadmap";
import ReStok from "./pages/ReStok";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* SearchProvider temporarily disabled */}
    <FontSizeProvider>
      {/* WRAP FontSizeProvider if you use it */}
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/settings/production-path"
              element={<SettingsProductionPath />}
            />
            <Route path="/models/all" element={<ModelsAll />} />
            <Route path="/job-work" element={<JobWork />} />
            <Route path="/models/new" element={<NewModel />} />
            <Route path="/models/:id/edit" element={<EditModel />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/restok" element={<ReStok />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </FontSizeProvider>
  </QueryClientProvider>
);

// PWA: register service worker and forward beforeinstallprompt event to React
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        console.log("Service worker registered");
      })
      .catch((err) => console.warn("SW registration failed", err));
  });
}

// Forward beforeinstallprompt to app
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  window.dispatchEvent(new CustomEvent("pwa-beforeinstallprompt"));
});

window.addEventListener("appinstalled", () => {
  (window as any).deferredPrompt = null;
  window.dispatchEvent(new CustomEvent("pwa-appinstalled"));
});

createRoot(document.getElementById("root")!).render(<App />);

import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import SettingsProductionPath from "./pages/SettingsProductionPath";
import AppLayout from "@/components/layout/AppLayout";
import ModelsAll from "./pages/ModelsAll";
import JobWork from "./pages/JobWork";
import NewModel from "./pages/NewModel";
import EditModel from "./pages/EditModel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/production-path" element={<SettingsProductionPath />} />
            <Route path="/models/all" element={<ModelsAll />} />
            <Route path="/job-work" element={<JobWork />} />
            <Route path="/models/new" element={<NewModel />} />
            <Route path="/models/:id/edit" element={<EditModel />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);

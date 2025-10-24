import {
  ChevronRight,
  Type,
  LayoutGrid,
  Settings,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useFontSize } from "@/hooks/use-font-size";

export default function SettingsPage() {
  const { value: fontSize, setValue: setFontSize } = useFontSize();
  const [modelsView, setModelsViewState] = useState<string>("cards");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("models.viewMode") || "cards";
      setModelsViewState(saved);
    } catch {}
  }, []);

  const setModelsView = (value: string) => {
    setModelsViewState(value);
    try {
      localStorage.setItem("models.viewMode", value);
      window.dispatchEvent(new Event("modelsViewChanged"));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Header Section */}
      <div className="relative border-b border-slate-200/60 backdrop-blur-xl bg-white/80">
        <div className="max-w-full sm:max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-6">
          <div className="flex items-center gap-4 mb-1">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-30"></div>
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-blue-500/20">
                <Settings className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent mb-1">
                Settings
              </h1>
              <p className="text-slate-600 text-sm sm:text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Personalize your experience
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative max-w-full sm:max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 space-y-4">
        {/* Appearance Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Appearance
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
          </div>

          {/* Font Size Setting */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <section className="relative rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-200/50 overflow-hidden hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30 pointer-events-none"></div>
              <div className="relative p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="flex items-start gap-4 sm:w-[70%]">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-lg"></div>
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <Type className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        Font Size
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Scale text to your preferred reading size
                      </p>
                    </div>
                  </div>
                  <div className="w-full sm:w-[29%]">
                    <div className="relative">
                      <select
                        value={fontSize}
                        onChange={(e) => setFontSize(e.target.value)}
                        className="w-full h-12 pl-4 pr-10 rounded-xl border border-slate-300/60 bg-white/90 text-slate-900 appearance-none cursor-pointer hover:bg-slate-50 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all shadow-sm"
                      >
                        <option value="small">Small · 87.5%</option>
                        <option value="medium">Medium · 100%</option>
                        <option value="large">Large · 112.5%</option>
                        <option value="extra-large">Extra Large · 125%</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Models View Toggle - Mobile Only */}
          <div className="group relative md:hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <section className="relative rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-200/50 overflow-hidden hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-cyan-50/30 pointer-events-none"></div>
              <div className="relative p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="flex items-start gap-4 sm:w-[70%]">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-lg"></div>
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <LayoutGrid className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        Models View
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Switch between card and list layouts
                      </p>
                    </div>
                  </div>
                  <div className="w-full sm:w-[29%]">
                    <div className="flex gap-2 p-1.5 rounded-xl bg-slate-100/80 border border-slate-200/60 shadow-inner">
                      <button
                        onClick={() => setModelsView("cards")}
                        className={`flex-1 h-10 rounded-lg font-medium transition-all duration-300 ${
                          modelsView === "cards"
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                        }`}
                      >
                        Cards
                      </button>
                      <button
                        onClick={() => setModelsView("list")}
                        className={`flex-1 h-10 rounded-lg font-medium transition-all duration-300 ${
                          modelsView === "list"
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                        }`}
                      >
                        List
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Advanced Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Advanced
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <section className="relative rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-200/50 overflow-hidden hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-teal-50/30 pointer-events-none"></div>
              <Link
                to="/settings/production-path"
                className="relative w-full flex items-center justify-between p-6 sm:p-8 hover:bg-slate-50/50 active:bg-slate-100/50 transition-all duration-300 group/button text-left"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-lg"></div>
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      Production Path
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Configure workflow steps and automation
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-slate-400 group-hover/button:text-slate-600 group-hover/button:translate-x-1 transition-all duration-300 flex-shrink-0 ml-4" />
              </Link>
            </section>
          </div>
        </div>

        {/* Footer spacing */}
        <div className="h-4" />
      </div>
    </div>
  );
}

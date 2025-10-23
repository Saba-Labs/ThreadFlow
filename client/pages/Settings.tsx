import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const STORAGE_KEY = "app:font-size";
const SCALE_MAP: Record<string, number> = {
  small: 0.875,
  medium: 1.0,
  large: 1.125,
  "extra-large": 1.25,
};

export default function Settings() {
  const [value, setValue] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "large";
    } catch {
      return "large";
    }
  });

  const [modelsView, setModelsView] = useState<string>(() => {
    try {
      return localStorage.getItem("models.viewMode") || "cards";
    } catch {
      return "cards";
    }
  });

  useEffect(() => {
    try {
      const scale = SCALE_MAP[value] ?? 1;
      document.documentElement.style.setProperty(
        "--app-font-scale",
        String(scale),
      );
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
  }, [value]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground max-w-prose">
          Manage application settings.
        </p>
      </div>

      <section className="rounded-lg border bg-white p-4 space-y-4">
        <div>
          <div className="font-medium">Font size</div>
          <div className="text-sm text-muted-foreground">
            Choose how large text appears across the app.
          </div>
        </div>
        <div className="max-w-xs">
          <Select value={value} onValueChange={(v) => setValue(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
              <SelectItem value="extra-large">Extra large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Mobile-only Models view toggle */}
      <section className="rounded-lg border bg-white p-4 space-y-4 sm:hidden">
        <div>
          <div className="font-medium">Models view</div>
          <div className="text-sm text-muted-foreground">
            Choose how models are displayed on the All Models page. Default is
            Cards.
          </div>
        </div>
        <ToggleGroup
          type="single"
          value={modelsView}
          onValueChange={(v) => {
            if (!v) return;
            setModelsView(v);
            try {
              localStorage.setItem("models.viewMode", v);
              window.dispatchEvent(new Event("storage"));
              window.dispatchEvent(new Event("modelsViewChanged"));
            } catch {}
          }}
          className="w-full"
          variant="outline"
        >
          <ToggleGroupItem
            value="cards"
            className="flex-1"
            aria-label="Cards view"
          >
            Cards
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            className="flex-1"
            aria-label="List view"
          >
            List
          </ToggleGroupItem>
        </ToggleGroup>
      </section>

      <section className="rounded-lg border bg-white divide-y">
        <Link
          to="/settings/production-path"
          className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div>
            <div className="font-medium">Production Path</div>
            <div className="text-sm text-muted-foreground">
              Configure steps used in production paths.
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </section>
    </div>
  );
}

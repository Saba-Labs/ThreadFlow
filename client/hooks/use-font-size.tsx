import * as React from "react";

export type FontSizeOption = "small" | "medium" | "large" | "extra-large";

type Ctx = {
  value: FontSizeOption;
  setValue: (v: FontSizeOption) => void;
};

const FontSizeContext = React.createContext<Ctx | undefined>(undefined);

const STORAGE_KEY = "app:font-size";

const SCALE_MAP: Record<FontSizeOption, number> = {
  small: 0.875, // ~14px base
  medium: 1.0, // 16px base
  large: 1.125, // 18px base
  "extra-large": 1.25, // 20px base
};

function applyScale(option: FontSizeOption) {
  if (typeof document === "undefined") return;
  const scale = SCALE_MAP[option] ?? 1;
  document.documentElement.style.setProperty("--app-font-scale", String(scale));
}

const DEFAULT_VALUE: FontSizeOption = "large";

// Guard to avoid calling React hooks in non-browser contexts or when React isn't initialized
const canUseHooks = typeof window !== "undefined" && typeof React.useState === "function";

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  if (!canUseHooks) {
    // Provide a noop implementation for SSR or environments where hooks aren't available
    const noopCtx: Ctx = { value: DEFAULT_VALUE, setValue: () => {} };
    // Apply default scale safely
    try {
      applyScale(DEFAULT_VALUE);
    } catch {
      /* ignore */
    }
    return (
      <FontSizeContext.Provider value={noopCtx}>{children}</FontSizeContext.Provider>
    );
  }

  const [value, setValue] = React.useState<FontSizeOption>(() => {
    try {
      const saved = (localStorage.getItem(STORAGE_KEY) as FontSizeOption | null) ?? DEFAULT_VALUE;
      return saved;
    } catch {
      return DEFAULT_VALUE;
    }
  });

  // Apply on mount and whenever it changes
  React.useEffect(() => {
    applyScale(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
  }, [value]);

  const ctx = React.useMemo<Ctx>(() => ({ value, setValue }), [value]);
  return <FontSizeContext.Provider value={ctx}>{children}</FontSizeContext.Provider>;
}

export function useFontSize() {
  const ctx = React.useContext(FontSizeContext);
  if (!ctx) throw new Error("useFontSize must be used within FontSizeProvider");
  return ctx;
}

import React, { createContext, useState, useEffect, useMemo, useContext, ReactNode } from "react";

export type FontSizeOption = "small" | "medium" | "large" | "extra-large";

type Ctx = {
  value: FontSizeOption;
  setValue: (v: FontSizeOption) => void;
};

const FontSizeContext = createContext<Ctx | undefined>(undefined);

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

const DEFAULT_VALUE: FontSizeOption = "medium";

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<FontSizeOption>(() => {
    try {
      const saved =
        (localStorage.getItem(STORAGE_KEY) as FontSizeOption | null) ??
        DEFAULT_VALUE;
      return saved;
    } catch {
      return DEFAULT_VALUE;
    }
  });

  // Apply on mount and whenever it changes
  useEffect(() => {
    applyScale(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
  }, [value]);

  const ctx = useMemo<Ctx>(() => ({ value, setValue }), [value]);
  return (
    <FontSizeContext.Provider value={ctx}>{children}</FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const ctx = useContext(FontSizeContext);
  if (!ctx) {
    // Fallback to defaults when provider is absent to avoid crashing the app during debugging
    return {
      value: DEFAULT_VALUE,
      setValue: () => {},
    } as Ctx;
  }
  return ctx;
}

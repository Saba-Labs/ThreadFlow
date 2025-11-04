import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type SearchContextValue = {
  query: string;
  setQuery: (q: string) => void;
};

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");

  // Listen to global-search events dispatched from the header without importing useSearch in AppLayout
  useEffect(() => {
    const handler = (e: any) => {
      const q = (e && (e as CustomEvent).detail) || "";
      setQuery(String(q));
    };
    window.addEventListener("global-search", handler as EventListener);
    return () =>
      window.removeEventListener("global-search", handler as EventListener);
  }, []);

  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}

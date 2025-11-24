import { createContext, useContext, useState, useEffect, ReactNode, FC } from "react";

type SearchContextValue = {
  query: string;
  setQuery: (q: string) => void;
};

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export const SearchProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    const handleGlobalSearch = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      const q = customEvent.detail || "";
      setQuery(String(q));
    };

    window.addEventListener("global-search", handleGlobalSearch);

    return () => {
      window.removeEventListener("global-search", handleGlobalSearch);
    };
  }, []);

  const value: SearchContextValue = {
    query,
    setQuery,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useSearch must be used within SearchProvider");
  }
  return ctx;
}

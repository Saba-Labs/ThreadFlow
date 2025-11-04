import { createContext, useContext, useState, ReactNode } from "react";

import * as React from "react";

type SearchContextValue = {
  query: string;
  setQuery: (q: string) => void;
};

const SearchContext = React.createContext<SearchContextValue | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = React.useState("");
  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = React.useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}

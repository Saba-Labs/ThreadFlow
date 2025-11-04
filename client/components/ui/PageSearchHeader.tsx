import { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, X } from "lucide-react";

interface PageSearchHeaderProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function PageSearchHeader({
  value,
  onChange,
  placeholder = "Search...",
}: PageSearchHeaderProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleEscape = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onChange("");
      handleClose();
    }
  };

  return (
    <div>
      {!open ? (
        <button
          aria-label="Open search"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border p-1 hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Search"
        >
          <SearchIcon className="h-5 w-5" />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            aria-label="Search input"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleEscape}
            className="rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-48 sm:w-64"
          />
          <button
            aria-label="Close search"
            onClick={handleClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border p-1 hover:bg-accent hover:text-accent-foreground transition-colors"
            title="Close search"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

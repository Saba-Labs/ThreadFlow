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
    <>
      <button
        aria-label="Open search"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border p-1 hover:bg-accent hover:text-accent-foreground transition-colors"
        title="Search"
      >
        <SearchIcon className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={handleClose}
          />
          <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-4 pt-20">
            <div className="w-full max-w-md">
              <div className="flex items-center gap-2 bg-white rounded-lg shadow-lg">
                <input
                  ref={inputRef}
                  aria-label="Search input"
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={handleEscape}
                  className="flex-1 px-4 py-3 text-sm focus:outline-none"
                />
                <button
                  aria-label="Close search"
                  onClick={handleClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md p-1 hover:bg-gray-100 transition-colors mr-1"
                  title="Close search"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

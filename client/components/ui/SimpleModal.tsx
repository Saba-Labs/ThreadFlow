import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function SimpleModal(props: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  children?: any;
  footer?: any;
}) {
  const { open, onOpenChange, title, children, footer } = props;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange?.(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-10 w-full max-w-2xl mx-4 rounded-lg bg-background shadow-lg flex flex-col">
        <div className="flex items-center justify-between border-b p-4 flex-shrink-0">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            aria-label="Close"
            onClick={() => onOpenChange?.(false)}
            className="rounded p-1 hover:bg-muted/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="border-t p-4 flex-shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

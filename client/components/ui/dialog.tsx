import React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

// Very small lightweight dialog replacement to avoid Radix hooks in some environments.
function Dialog({ children, open, onOpenChange }: any) {
  // Render children directly; the SimpleModal or Trigger will control visibility.
  return <div>{children}</div>;
}

function DialogTrigger({ children, asChild }: any) {
  // If asChild, assume child handles click; otherwise render button wrapper
  return <div>{children}</div>;
}

function DialogPortal({ children }: any) {
  return createPortal(<div>{children}</div>, document.body);
}

function DialogOverlay({ className = "", ...props }: any) {
  return (
    <div className={cn("fixed inset-0 bg-black/40", className)} {...props} />
  );
}

function DialogClose({ children, ...props }: any) {
  return (
    <button
      {...props}
      aria-label="Close"
      className="rounded p-1 hover:bg-muted/20"
    >
      {children ?? <X className="h-4 w-4" />}
    </button>
  );
}

function DialogContent({ children, className = "", ...props }: any) {
  return (
    <div
      className={cn(
        "relative z-50 w-full max-w-2xl rounded-lg bg-background shadow-lg",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

const DialogHeader = ({ className = "", ...props }: any) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);

const DialogFooter = ({ className = "", ...props }: any) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);

const DialogTitle = ({ children, className = "", ...props }: any) => (
  <h3
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  >
    {children}
  </h3>
);

const DialogDescription = ({ children, className = "", ...props }: any) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props}>
    {children}
  </p>
);

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

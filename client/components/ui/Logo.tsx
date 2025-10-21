import React from "react";

export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className || "h-5 w-5"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Minimal TF monogram: shared vertical stem, T top bar, F arms to the right */}
      <g stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        {/* Top bar for T (spans left and right) */}
        <path d="M3.5 5.5h17" />
        {/* Shared vertical stem */}
        <path d="M11.75 5.5v13" />
        {/* F arms to the right */}
        <path d="M11.75 9.5h6.5" />
        <path d="M11.75 13.5h5" />
      </g>
    </svg>
  );
}

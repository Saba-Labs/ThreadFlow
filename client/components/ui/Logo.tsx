import React from "react";

export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className || "h-6 w-6"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Modern TF monogram: left T, right F sharing a vertical stem, geometric and balanced */}
      <g fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        {/* Top bar of T */}
        <path d="M8 10 H30" />
        {/* Shared vertical stem */}
        <path d="M19 10 V38" />
        {/* F arms on the right side */}
        <path d="M19 18 H36" />
        <path d="M19 26 H32" />
        {/* Subtle diagonal cut to make it unique */}
        <path d="M12 33 L22 25" strokeWidth={1.6} />
      </g>
    </svg>
  );
}

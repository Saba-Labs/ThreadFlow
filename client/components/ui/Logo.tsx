import React from "react";

export default function Logo({ className }: { className?: string }) {
  // Monogram "TF" inspired by the reference: rounded strokes, geometric proportions
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className={className || "h-6 w-6"}
      aria-label="ThreadFlow icon"
      role="img"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Top bar of the T */}
        <path d="M10 16 H54" />
        {/* Angled stem connecting T to F */}
        <path d="M34 16 L24 48" />
        {/* Middle bar of the F */}
        <path d="M26 36 H46" />
        {/* Small inner notch echoing the reference shape */}
        <path d="M28 16 H44" />
      </g>
    </svg>
  );
}

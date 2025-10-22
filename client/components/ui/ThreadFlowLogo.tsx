import React from "react";

export default function ThreadFlowLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className={className}
      aria-label="ThreadFlow logo"
      role="img"
    >
      <defs>
        <linearGradient id="tfG" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#06B6D4" />
          <stop offset="1" stopColor="#10B981" />
        </linearGradient>
      </defs>

      {/* Rounded square background */}
      <rect x="2" y="2" width="60" height="60" rx="10" fill="url(#tfG)" />

      {/* Monogram 'TF' — geometric, minimal, balanced */}
      <g fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {/* T: horizontal bar and short stem centered */}
        <path d="M18 18 H46" strokeOpacity="0.95" />
        <path d="M32 18 V34" strokeOpacity="0.95" />

        {/* F: stem on right with two bars, forming a mirrored complement of T */}
        <path d="M44 36 V50" strokeOpacity="0.95" />
        <path d="M44 36 H36" strokeOpacity="0.95" />
        <path d="M44 42 H36" strokeOpacity="0.95" />
      </g>

      {/* Accent dots to imply stitching */}
      <g fill="#0F172A" opacity="0.9">
        <circle cx="22" cy="46" r="2" />
        <circle cx="28" cy="50" r="2" />
      </g>
    </svg>
  );
}

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
        <linearGradient id="L" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#2b8fff" />
          <stop offset="1" stopColor="#00d4d4" />
        </linearGradient>
        <linearGradient id="R" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#5ef38a" />
          <stop offset="1" stopColor="#00e0c6" />
        </linearGradient>
      </defs>

      {/* Rounded pills overlapping */}
      <g>
        <rect x="2" y="12" width="28" height="40" rx="10" fill="url(#L)" transform="rotate(-12 16 32)" />
        <rect x="34" y="12" width="28" height="40" rx="10" fill="url(#R)" transform="rotate(12 48 32)" />

        {/* center overlap shadow */}
        <ellipse cx="32" cy="34" rx="10" ry="14" fill="#0b6b5e" opacity="0.18" />
      </g>
    </svg>
  );
}

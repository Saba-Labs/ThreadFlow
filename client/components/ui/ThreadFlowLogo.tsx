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

      {/* Stylized thread mark: vertical stem + flowing curve */}
      <g transform="translate(0,0)" fill="none" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 14 L32 32" strokeOpacity="0.95" strokeWidth="4" />
        <path d="M32 32 C 44 36, 46 48, 38 54 C 30 60, 18 58, 14 46" strokeOpacity="0.95" strokeWidth="4" />
      </g>

      {/* Small dot to represent the thread head */}
      <circle cx="32" cy="12" r="3" fill="#0F172A" />
    </svg>
  );
}

import React from "react";

export default function ThreadFlowLogo({
  className = "h-8 w-8",
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={className}
      aria-label="ThreadFlow logo"
      role="img"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="leftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="rightGradient" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#84cc16" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="smoothFilter">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
        </filter>
      </defs>

      {/* Left blue rounded shape */}
      <path
        d="M 60 40 C 45 40 35 55 35 75 C 35 95 45 110 60 115 C 75 105 85 85 100 70 C 90 55 75 40 60 40 Z"
        fill="url(#leftGradient)"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Right green/cyan rounded shape */}
      <path
        d="M 140 40 C 155 40 165 55 165 75 C 165 95 155 110 140 115 C 125 105 115 85 100 70 C 110 55 125 40 140 40 Z"
        fill="url(#rightGradient)"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Center overlap ellipse for depth effect */}
      <ellipse cx="100" cy="72" rx="18" ry="24" fill="#0d9488" opacity="0.7" />
    </svg>
  );
}

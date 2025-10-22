import React from "react";

export default function ThreadFlowLogo({
  className = "h-8 w-8",
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      aria-label="ThreadFlow logo"
      role="img"
    >
      <defs>
        <linearGradient id="bluGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#84cc16" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>

      {/* Left blue shape */}
      <path
        d="M 30 15 Q 20 20 20 35 L 20 65 Q 20 80 30 85 Q 45 95 50 50 Q 45 5 30 15"
        fill="url(#bluGradient)"
      />

      {/* Right green shape */}
      <path
        d="M 70 15 Q 80 20 80 35 L 80 65 Q 80 80 70 85 Q 55 95 50 50 Q 55 5 70 15"
        fill="url(#greenGradient)"
      />

      {/* Center overlap for depth */}
      <ellipse cx="50" cy="50" rx="12" ry="18" fill="#0a7ea4" opacity="0.6" />
    </svg>
  );
}

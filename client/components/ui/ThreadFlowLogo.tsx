import React from "react";

export default function ThreadFlowLogo({
  className = "h-8 w-8",
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className={className}
      aria-label="ThreadFlow logo"
      role="img"
    >
      {/* Left blue curved shape */}
      <path
        d="M 16 12 C 16 12 8 16 8 24 L 8 40 C 8 48 16 52 24 52 C 28 48 32 40 32 32 C 32 24 28 16 24 12 C 20 12 16 12 16 12 Z"
        fill="#0369a1"
      />

      {/* Right green curved shape */}
      <path
        d="M 48 12 C 48 12 44 12 40 12 C 36 16 32 24 32 32 C 32 40 36 48 40 52 C 48 52 56 48 56 40 L 56 24 C 56 16 48 12 48 12 Z"
        fill="#22c55e"
      />

      {/* Center overlap circle for depth */}
      <circle cx="32" cy="32" r="8" fill="#06b6d4" />
    </svg>
  );
}

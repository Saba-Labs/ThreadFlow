import React from "react";

export default function ThreadFlowLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={className} aria-label="ThreadFlow logo" role="img">
      <defs>
        <linearGradient id="gL" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#1e3eff" />
          <stop offset="1" stopColor="#14d8e2" />
        </linearGradient>
        <linearGradient id="gR" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#9be72a" />
          <stop offset="1" stopColor="#2ee8c8" />
        </linearGradient>
      </defs>

      <g>
        <path d="M6 8 C14 2, 28 0, 36 8 L50 26 C56 32, 56 36, 50 42 L36 56 C28 64, 14 62, 6 56 L-8 42 C-14 36, -14 32, -8 26 Z"
          fill="url(#gL)" transform="translate(16,8) rotate(-10 32 32)" />
        <path d="M58 8 C50 2, 36 0, 28 8 L14 26 C8 32, 8 36, 14 42 L28 56 C36 64, 50 62, 58 56 L72 42 C78 36, 78 32, 72 26 Z"
          fill="url(#gR)" transform="translate(-16,8) rotate(10 32 32)" />

        {/* center darker lens */}
        <ellipse cx="32" cy="34" rx="8" ry="11" fill="#064f45" opacity="0.2" />
      </g>
    </svg>
  );
}

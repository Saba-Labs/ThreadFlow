import React from "react";

export default function ThreadFlowLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={className} aria-label="ThreadFlow logo" role="img">
      <defs>
        <linearGradient id="gB" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#33d6d0" />
          <stop offset="1" stopColor="#18b7ff" />
        </linearGradient>
      </defs>

      {/* Outer ring */}
      <circle cx="32" cy="26" r="18" fill="#ffffff" stroke="#d9d9d9" strokeWidth="1.2" />

      {/* Bars */}
      <g transform="translate(14,10)">
        <rect x="0" y="22" width="4.5" height="8" rx="1" fill="url(#gB)" />
        <rect x="7" y="18" width="4.5" height="12" rx="1" fill="#18b7ff" />
        <rect x="14" y="10" width="4.5" height="20" rx="1" fill="#16c7b8" />
      </g>

      {/* Check */}
      <path d="M22 28 L28 34 L40 18" fill="none" stroke="#0b4d85" strokeWidth="2.8" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

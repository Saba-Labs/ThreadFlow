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
      {/* Left blue square rotated */}
      <rect
        x="8"
        y="16"
        width="24"
        height="24"
        rx="4"
        fill="#0369a1"
        transform="rotate(-15 20 28)"
      />

      {/* Right green square rotated opposite direction */}
      <rect
        x="32"
        y="16"
        width="24"
        height="24"
        rx="4"
        fill="#22c55e"
        transform="rotate(15 44 28)"
      />

      {/* Center diamond shape for overlap */}
      <polygon points="32,16 40,32 32,48 24,32" fill="#06b6d4" />
    </svg>
  );
}

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
    >
      <defs>
        <linearGradient id="threadFlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background circle (subtle) */}
      <circle cx="100" cy="100" r="95" fill="none" stroke="#10B981" strokeWidth="0.5" opacity="0.1" />

      {/* Central node - represents data/model hub */}
      <circle cx="100" cy="100" r="18" fill="url(#threadFlowGradient)" filter="url(#glow)" />

      {/* Top-left node */}
      <circle cx="50" cy="50" r="12" fill="#10B981" opacity="0.8" />

      {/* Top-right node */}
      <circle cx="150" cy="50" r="12" fill="#10B981" opacity="0.8" />

      {/* Bottom-left node */}
      <circle cx="50" cy="150" r="12" fill="#10B981" opacity="0.8" />

      {/* Bottom-right node */}
      <circle cx="150" cy="150" r="12" fill="#10B981" opacity="0.8" />

      {/* Connection lines - representing data flow/pipeline */}
      <line x1="100" y1="100" x2="50" y2="50" stroke="#10B981" strokeWidth="2" opacity="0.6" />
      <line x1="100" y1="100" x2="150" y2="50" stroke="#10B981" strokeWidth="2" opacity="0.6" />
      <line x1="100" y1="100" x2="50" y2="150" stroke="#10B981" strokeWidth="2" opacity="0.6" />
      <line x1="100" y1="100" x2="150" y2="150" stroke="#10B981" strokeWidth="2" opacity="0.6" />

      {/* Diagonal connections - representing interconnected ML models */}
      <line x1="50" y1="50" x2="150" y2="150" stroke="#10B981" strokeWidth="1.5" opacity="0.3" strokeDasharray="3,2" />
      <line x1="150" y1="50" x2="50" y2="150" stroke="#10B981" strokeWidth="1.5" opacity="0.3" strokeDasharray="3,2" />

      {/* Inner geometric pattern - data layer representation */}
      <g opacity="0.5">
        <polygon
          points="100,100 115,90 120,105 105,115"
          fill="none"
          stroke="#10B981"
          strokeWidth="1"
        />
      </g>

      {/* Top accent bar - representing thread/flow direction */}
      <rect x="85" y="25" width="30" height="4" rx="2" fill="url(#threadFlowGradient)" opacity="0.8" />
    </svg>
  );
}

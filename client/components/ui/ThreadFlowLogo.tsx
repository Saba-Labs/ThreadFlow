import React from "react";

export default function ThreadFlowLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 240 180" 
      className={className} 
      aria-label="ThreadFlow logo" 
      role="img"
    >
      <defs>
        {/* Left blob gradient - cyan to deep blue */}
        <linearGradient id="leftGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        
        {/* Right blob gradient - lime to cyan */}
        <linearGradient id="rightGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#84cc16" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        
        {/* Center shape gradient */}
        <linearGradient id="centerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* Left rounded blob shape */}
      <path
        d="M 45 90
           C 45 50, 65 30, 90 30
           C 115 30, 130 50, 130 75
           C 130 100, 120 120, 105 135
           C 90 150, 70 150, 55 135
           C 45 125, 45 110, 45 90 Z"
        fill="url(#leftGrad)"
      />

      {/* Right rounded blob shape */}
      <path
        d="M 195 90
           C 195 50, 175 30, 150 30
           C 125 30, 110 50, 110 75
           C 110 100, 120 120, 135 135
           C 150 150, 170 150, 185 135
           C 195 125, 195 110, 195 90 Z"
        fill="url(#rightGrad)"
      />

      {/* Center overlapping teardrop shape */}
      <ellipse
        cx="120"
        cy="85"
        rx="32"
        ry="42"
        fill="url(#centerGrad)"
        opacity="0.9"
      />
    </svg>
  );
}
import React from "react";

export default function ThreadFlowLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 280 200" 
      className={className} 
      aria-label="ThreadFlow logo" 
      role="img"
    >
      <defs>
        {/* Left shape gradient - cyan to deep blue */}
        <linearGradient id="leftGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        
        {/* Right shape gradient - lime green to cyan */}
        <linearGradient id="rightGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#a3e635" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        
        {/* Center overlap */}
        <radialGradient id="centerGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0891b2" />
        </radialGradient>
      </defs>

      {/* Left organic blob - more rounded */}
      <path
        d="M 60 100
           Q 60 50, 95 40
           Q 130 30, 145 65
           Q 155 90, 145 115
           Q 135 140, 110 150
           Q 85 160, 70 135
           Q 60 120, 60 100 Z"
        fill="url(#leftGrad)"
        opacity="0.92"
      />

      {/* Right organic blob - more rounded */}
      <path
        d="M 220 100
           Q 220 50, 185 40
           Q 150 30, 135 65
           Q 125 90, 135 115
           Q 145 140, 170 150
           Q 195 160, 210 135
           Q 220 120, 220 100 Z"
        fill="url(#rightGrad)"
        opacity="0.92"
      />

      {/* Center intersection shape - vertically oriented */}
      <path
        d="M 140 55
           Q 155 65, 155 90
           Q 155 115, 140 125
           Q 125 115, 125 90
           Q 125 65, 140 55 Z"
        fill="url(#centerGrad)"
        opacity="0.88"
      />
    </svg>
  );
}
import React from "react";

export default function ThreadFlowLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 200 200" 
      className={className} 
      aria-label="ThreadFlow logo" 
      role="img"
    >
      <defs>
        {/* Left shape gradient - blue to deep blue */}
        <linearGradient id="leftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#3b27f5" />
        </linearGradient>
        
        {/* Right shape gradient - cyan to lime green */}
        <linearGradient id="rightGrad" x1="100%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a3e635" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        
        {/* Center overlap gradient */}
        <radialGradient id="centerGrad">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0891b2" />
        </radialGradient>
      </defs>

      {/* Left flowing shape */}
      <path
        d="M 50 100 
           C 50 65, 65 50, 85 50
           C 105 50, 115 65, 115 85
           C 115 105, 105 115, 100 120
           C 95 125, 90 130, 90 140
           C 90 150, 95 155, 100 155
           C 85 155, 70 145, 60 130
           C 50 120, 50 110, 50 100 Z"
        fill="url(#leftGrad)"
        opacity="0.95"
      />

      {/* Right flowing shape */}
      <path
        d="M 150 100
           C 150 65, 135 50, 115 50
           C 95 50, 85 65, 85 85
           C 85 105, 95 115, 100 120
           C 105 125, 110 130, 110 140
           C 110 150, 105 155, 100 155
           C 115 155, 130 145, 140 130
           C 150 120, 150 110, 150 100 Z"
        fill="url(#rightGrad)"
        opacity="0.95"
      />

      {/* Center overlap shape */}
      <ellipse
        cx="100"
        cy="100"
        rx="28"
        ry="35"
        fill="url(#centerGrad)"
        opacity="0.85"
      />
    </svg>
  );
}
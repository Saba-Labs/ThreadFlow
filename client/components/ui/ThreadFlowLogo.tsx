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
        {/* Gradient from turquoise to lime */}
        <linearGradient id="flowGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4d8" />
          <stop offset="100%" stopColor="#7dd957" />
        </linearGradient>
        
        {/* Gradient from blue to turquoise */}
        <linearGradient id="flowGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e5aa8" />
          <stop offset="100%" stopColor="#00b4d8" />
        </linearGradient>
        
        {/* Center gradient */}
        <radialGradient id="centerGradient">
          <stop offset="0%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#06b6d4" />
        </radialGradient>
      </defs>

      {/* Left flowing shape */}
      <path
        d="M 60 100 
           C 60 60, 80 40, 100 40
           C 100 60, 90 80, 80 100
           C 90 120, 100 140, 100 160
           C 80 160, 60 140, 60 100 Z"
        fill="url(#flowGradient2)"
        opacity="0.9"
      />

      {/* Right flowing shape */}
      <path
        d="M 140 100
           C 140 60, 120 40, 100 40
           C 100 60, 110 80, 120 100
           C 110 120, 100 140, 100 160
           C 120 160, 140 140, 140 100 Z"
        fill="url(#flowGradient1)"
        opacity="0.9"
      />

      {/* Center connection point */}
      <circle
        cx="100"
        cy="100"
        r="18"
        fill="url(#centerGradient)"
        opacity="0.95"
      />
      
      {/* Inner highlight */}
      <circle
        cx="100"
        cy="100"
        r="8"
        fill="#ffffff"
        opacity="0.3"
      />
    </svg>
  );
}
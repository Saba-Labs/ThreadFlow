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
        <linearGradient id="mainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>

      {/* Rounded square container */}
      <rect 
        x="15" 
        y="15" 
        width="170" 
        height="170" 
        rx="38" 
        fill="url(#mainGrad)"
      />

      {/* Bold letter T */}
      <path
        d="M 60 65 L 140 65 L 140 85 L 110 85 L 110 145 L 90 145 L 90 85 L 60 85 Z"
        fill="#ffffff"
      />

      {/* Flow arrow integrated into T */}
      <path
        d="M 130 105 L 155 105 L 145 95 M 155 105 L 145 115"
        stroke="#ffffff"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Thread line accent */}
      <path
        d="M 50 125 Q 100 115, 150 125"
        stroke="url(#accentGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
    </svg>
  );
}
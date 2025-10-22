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
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
        
        <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        
        <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Dynamic flowing ribbon */}
      <path
        d="M 40 100 Q 70 60, 100 80 T 160 100 Q 130 140, 100 120 T 40 100 Z"
        fill="url(#g1)"
        opacity="0.85"
        filter="url(#glow)"
      />

      {/* Second layer - offset */}
      <path
        d="M 50 90 Q 80 55, 110 75 T 165 95 Q 135 130, 110 115 T 50 90 Z"
        fill="url(#g2)"
        opacity="0.7"
      />

      {/* Third layer accent */}
      <path
        d="M 45 110 Q 75 80, 100 95 T 155 115 Q 125 145, 100 130 T 45 110 Z"
        fill="url(#g3)"
        opacity="0.6"
      />

      {/* Center orb */}
      <circle cx="100" cy="100" r="22" fill="url(#g1)" opacity="0.9" filter="url(#glow)" />
      <circle cx="100" cy="100" r="12" fill="#ffffff" opacity="0.9" />
      <circle cx="100" cy="100" r="6" fill="url(#g2)" opacity="0.8" />
    </svg>
  );
}
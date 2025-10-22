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
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
        
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        
        <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        
        <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Rounded square background */}
      <rect 
        x="20" 
        y="20" 
        width="160" 
        height="160" 
        rx="35" 
        fill="url(#bgGrad)"
        filter="url(#glow)"
      />

      {/* Inner rounded square for depth */}
      <rect 
        x="25" 
        y="25" 
        width="150" 
        height="150" 
        rx="32" 
        fill="#ffffff"
        opacity="0.08"
      />

      {/* Dynamic flowing ribbon */}
      <path
        d="M 55 100 Q 75 70, 100 85 T 145 100 Q 125 130, 100 115 T 55 100 Z"
        fill="url(#g1)"
        opacity="0.9"
      />

      {/* Second layer - offset */}
      <path
        d="M 60 95 Q 80 68, 105 82 T 145 97 Q 125 125, 105 112 T 60 95 Z"
        fill="url(#g2)"
        opacity="0.75"
      />

      {/* Third layer accent */}
      <path
        d="M 58 105 Q 78 80, 100 92 T 142 108 Q 122 133, 100 120 T 58 105 Z"
        fill="url(#g3)"
        opacity="0.65"
      />

      {/* Center orb - the focal point */}
      <circle cx="100" cy="100" r="20" fill="#ffffff" opacity="0.95" filter="url(#glow)" />
      <circle cx="100" cy="100" r="14" fill="url(#g1)" opacity="0.9" />
      <circle cx="100" cy="100" r="7" fill="#ffffff" opacity="0.95" />
    </svg>
  );
}
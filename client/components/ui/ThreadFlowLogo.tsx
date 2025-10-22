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

      {/* Connected workflow nodes */}
      <circle cx="16" cy="32" r="6" fill="#e8f4f8" stroke="#18b7ff" strokeWidth="2" />
      <circle cx="32" cy="20" r="6" fill="#e8f4f8" stroke="#16c7b8" strokeWidth="2" />
      <circle cx="48" cy="32" r="6" fill="#e8f4f8" stroke="#33d6d0" strokeWidth="2" />

      {/* Connection lines */}
      <line x1="21" y1="29" x2="27" y2="23" stroke="url(#gB)" strokeWidth="2" strokeLinecap="round" />
      <line x1="37" y1="23" x2="43" y2="29" stroke="url(#gB)" strokeWidth="2" strokeLinecap="round" />

      {/* Progress indicators (dots) */}
      <circle cx="16" cy="32" r="2.5" fill="#18b7ff" />
      <circle cx="32" cy="20" r="2.5" fill="#16c7b8" />

      {/* Completion check */}
      <path d="M44 31 L47 34 L52 28" fill="none" stroke="#0b4d85" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Thread element - flowing line */}
      <path d="M16 44 Q32 48 48 44" fill="none" stroke="url(#gB)" strokeWidth="1.5" strokeDasharray="2,3" opacity="0.6" />
    </svg>
  );
}

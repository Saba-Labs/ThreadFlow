import React from "react";

export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className || "h-5 w-5"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0 0 L6 3 L0 6 z" fill="currentColor" />
        </marker>
      </defs>

      <path
        d="M3 12 C7 5, 17 5, 21 12 C17 19, 7 19, 3 12"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* nodes along the path representing machines/stages */}
      <circle cx="6.5" cy="10.5" r="1.1" fill="currentColor" />
      <circle cx="12" cy="8" r="1.1" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="1.1" fill="currentColor" />

      {/* arrow to indicate flow */}
      <path
        d="M16.5 10.5 L20 12 L16.5 13.5"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        markerEnd="url(#arrowhead)"
      />

      {/* small tracking marker: a rounded square with a check */}
      <rect x="10" y="14" width="3" height="3" rx="0.6" stroke="currentColor" strokeWidth={0.9} fill="none" />
      <path d="M10.4 15.2 L11.2 16 L12.6 14.6" stroke="currentColor" strokeWidth={0.9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

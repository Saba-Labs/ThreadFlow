import React from "react";

export default function ThreadFlowLogo({ className = "h-8 w-8" }: { className?: string }) {
  // Base colors derived from the image:
  // Deep Blue: #1976D2 (approx)
  // Bright Blue/Cyan: #2196F3 (approx)
  // Green/Lime: #8BC34A (approx)
  // Center Overlap (Teal/Darker Cyan): #00BCD4 (approx)

  // A viewBox of "0 0 250 200" provides good proportions for the 'M' shape.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 250 200"
      className={className}
      aria-label="ThreadFlow logo"
      role="img"
    >
      <defs>
        {/* Gradient for the Left Shape (Blue/Cyan Focus) */}
        <linearGradient id="leftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2196F3" /> {/* Light Blue */}
          <stop offset="100%" stopColor="#1976D2" /> {/* Deep Blue */}
        </linearGradient>

        {/* Gradient for the Right Shape (Green/Cyan Focus) */}
        <linearGradient id="rightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8BC34A" /> {/* Lime Green */}
          <stop offset="100%" stopColor="#2196F3" /> {/* Light Blue/Cyan */}
        </linearGradient>
      </defs>

      {/* The logo is essentially two 'D' or 'P' shapes reflected horizontally,
        forming an overlap. We use a single path for each side.
      */}

      {/* Left Shape (Pill/D-shape) */}
      <path
        // Start near the middle-left (50, 100)
        // Draw a smooth curve up to the top-left (50, 20)
        // Curve across the top to the center point (125, 100)
        // Curve down across the bottom back to the start
        d="M 125 100 
           C 125 30, 80 20, 50 40 
           L 50 160 
           C 80 180, 125 170, 125 100 Z"
        fill="url(#leftGrad)"
        opacity="0.95"
      />

      {/* Right Shape (Reflected Pill/D-shape) */}
      <path
        // Start near the middle-right (125, 100)
        // Draw a smooth curve up to the top-right (200, 40)
        // Curve across the top to the center point (125, 100)
        // Curve down across the bottom back to the start
        d="M 125 100 
           C 125 30, 170 20, 200 40 
           L 200 160 
           C 170 180, 125 170, 125 100 Z"
        fill="url(#rightGrad)"
        opacity="0.95"
      />

      {/* Optional: A third shape or circle could be added 
        in the center to emphasize the blend/overlap area, 
        giving it the darker, slightly translucent look. 
      */}
      <circle 
        cx="125" 
        cy="100" 
        r="40" 
        fill="#00BCD4" // Teal/Darker Cyan for the blend
        opacity="0.25" // Adjust opacity to achieve the "transparency" look
      />

    </svg>
  );
}
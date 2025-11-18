export default function ThreadFlowLogo({
  className = "h-8 w-8",
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      aria-label="ThreadFlow logo"
      role="img"
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B" />
          <stop offset="50%" stopColor="#4ECDC4" />
          <stop offset="100%" stopColor="#45B7D1" />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F7B731" />
          <stop offset="100%" stopColor="#5F27CD" />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="url(#grad1)" opacity="0.15" />

      {/* Top-left swoosh */}
      <path
        d="M 15 35 Q 25 15 45 25"
        stroke="url(#grad1)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top-right swoosh */}
      <path
        d="M 85 35 Q 75 15 55 25"
        stroke="url(#grad2)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center circle - main hub */}
      <circle cx="50" cy="50" r="12" fill="url(#grad1)" />
      <circle cx="50" cy="50" r="8" fill="white" />
      <circle cx="50" cy="50" r="4" fill="url(#grad1)" />

      {/* Bottom-left swoosh */}
      <path
        d="M 20 65 Q 30 85 50 75"
        stroke="url(#grad2)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom-right swoosh */}
      <path
        d="M 80 65 Q 70 85 50 75"
        stroke="url(#grad1)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />

      {/* Connecting lines from center */}
      <line x1="50" y1="50" x2="45" y2="25" stroke="url(#grad1)" strokeWidth="2" opacity="0.4" />
      <line x1="50" y1="50" x2="55" y2="25" stroke="url(#grad2)" strokeWidth="2" opacity="0.4" />
      <line x1="50" y1="50" x2="35" y2="70" stroke="url(#grad2)" strokeWidth="2" opacity="0.4" />
      <line x1="50" y1="50" x2="65" y2="70" stroke="url(#grad1)" strokeWidth="2" opacity="0.4" />
    </svg>
  );
}

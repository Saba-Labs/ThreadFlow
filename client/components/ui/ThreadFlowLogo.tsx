export default function ThreadFlowLogo({
  className = "h-8 w-8",
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 32 32"
      className={className}
      aria-label="ThreadFlow logo"
      role="img"
    >
      {/* Background gradient */}
      <defs>
        <linearGradient id="threadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#FF6B6B", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "#4ECDC4", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#45B7D1", stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Top-left triangle */}
      <polygon points="8,8 14,8 11,14" fill="#FF6B6B" />

      {/* Top-right triangle */}
      <polygon points="18,8 24,8 21,14" fill="#4ECDC4" />

      {/* Center circle */}
      <circle cx="16" cy="16" r="5" fill="#45B7D1" />

      {/* Bottom-left triangle */}
      <polygon points="8,24 14,24 11,18" fill="#F7B731" />

      {/* Bottom-right triangle */}
      <polygon points="18,24 24,24 21,18" fill="#5F27CD" />

      {/* Connecting lines from center */}
      <line x1="16" y1="16" x2="11" y2="11" stroke="#FF6B6B" strokeWidth="1" opacity="0.5" />
      <line x1="16" y1="16" x2="21" y2="11" stroke="#4ECDC4" strokeWidth="1" opacity="0.5" />
      <line x1="16" y1="16" x2="11" y2="21" stroke="#F7B731" strokeWidth="1" opacity="0.5" />
      <line x1="16" y1="16" x2="21" y2="21" stroke="#5F27CD" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

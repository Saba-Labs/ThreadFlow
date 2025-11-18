export default function ThreadFlowLogo({
  className = "h-8 w-8",
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-label="ThreadFlow logo"
      role="img"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Top flowing line */}
      <path d="M 6 8 Q 12 4 18 8" />
      
      {/* Center hub */}
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      
      {/* Left flowing line */}
      <path d="M 4 12 Q 8 12 10 14" />
      
      {/* Right flowing line */}
      <path d="M 20 12 Q 16 12 14 14" />
      
      {/* Bottom flowing line */}
      <path d="M 6 16 Q 12 20 18 16" />
    </svg>
  );
}

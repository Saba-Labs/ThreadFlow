export default function ThreadFlowLogo({
  className = "h-8 w-8",
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={className}
      aria-label="ThreadFlow logo"
      role="img"
    >
      <defs>
        <linearGradient
          id="threadFlowGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Top-left flowing thread */}
      <path
        d="M 40 50 Q 60 40 80 60"
        stroke="url(#threadFlowGradient)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top-right flowing thread */}
      <path
        d="M 160 50 Q 140 40 120 60"
        stroke="url(#threadFlowGradient)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />

      {/* Center convergence point - stylized */}
      <circle
        cx="100"
        cy="100"
        r="14"
        fill="url(#threadFlowGradient)"
      />

      {/* Inner circle for depth */}
      <circle
        cx="100"
        cy="100"
        r="8"
        fill="white"
      />

      {/* Bottom-left flowing thread */}
      <path
        d="M 50 120 Q 70 110 90 140"
        stroke="url(#threadFlowGradient)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />

      {/* Bottom-right flowing thread */}
      <path
        d="M 150 120 Q 130 110 110 140"
        stroke="url(#threadFlowGradient)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />

      {/* Bottom center accent - represents continuous flow */}
      <path
        d="M 85 150 Q 100 160 115 150"
        stroke="url(#threadFlowGradient)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}

export default function ThreadFlowLogo({
  className = "h-8 w-8",
}: {
  className?: string;
}) {
  return (
    <img
      src="/logo-192.svg"
      alt="ThreadFlow logo"
      className={className}
      style={{ objectFit: "contain", background: "transparent" }}
    />
  );
}

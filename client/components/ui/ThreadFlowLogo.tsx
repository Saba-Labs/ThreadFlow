export default function ThreadFlowLogo({
  className = "h-8 w-8",
}: {
  className?: string;
}) {
  return (
    <div
      className={`${className} flex items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 font-bold text-white text-sm`}
      aria-label="ThreadFlow logo"
      role="img"
      style={{ fontSize: "0.5em" }}
    >
      T
    </div>
  );
}

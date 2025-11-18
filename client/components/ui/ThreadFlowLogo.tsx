export default function ThreadFlowLogo({
  className = "h-8 w-8",
}: {
  className?: string;
}) {
  return (
    <img
      src="https://cdn.builder.io/api/v1/image/assets%2Fb68ae223a309479ba355ca9d766ff747%2F45450b56824f448582a8036713449ae3?format=webp&width=800"
      alt="ThreadFlow logo"
      className={className}
      style={{ objectFit: "contain", background: "transparent" }}
    />
  );
}

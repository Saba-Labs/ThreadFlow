import React from "react";

export default function Logo({ className }: { className?: string }) {
  return (
    <img
      src="https://cdn.builder.io/api/v1/image/assets%2Fb68ae223a309479ba355ca9d766ff747%2Fe72e476fbaf54f8daede7f8250eddc9c?format=webp&width=800"
      alt="ThreadFlow logo"
      className={className || "h-6 w-6 object-contain"}
      style={{ display: "block" }}
    />
  );
}

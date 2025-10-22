import * as React from "react";

import ThreadFlowLogo from "@/components/ui/ThreadFlowLogo";

export default function Logo({ className }: { className?: string }) {
  return <ThreadFlowLogo className={className || "h-6 w-6"} />;
}

"use client";

import { MotionConfig } from "framer-motion";
import { PortalProvider } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <PortalProvider>{children}</PortalProvider>
    </MotionConfig>
  );
}

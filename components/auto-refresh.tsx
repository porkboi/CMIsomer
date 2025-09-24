"use client";

import { useEffect } from "react";

interface AutoRefreshProps {
  disabled?: boolean;
  children: React.ReactNode;
}

export default function AutoRefresh({ disabled = false, children }: AutoRefreshProps) {
  useEffect(() => {
    if (disabled) return;
    const timer = setInterval(() => {
      window.location.reload();
    }, 1000);

    return () => clearInterval(timer);
  }, [disabled]);

  return <>{children}</>;
}
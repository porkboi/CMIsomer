"use client";

import { useEffect } from "react";

export default function AutoRefresh({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const timer = setInterval(() => {
      // Reload the page every second
      window.location.reload();
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return <>{children}</>;
}
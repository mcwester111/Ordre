"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// On a hard refresh of any sub-page, send the user back to the home page
// so the splash screen and entrance animations always play from the start.
export default function RefreshRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    // Home page and the curator app always stay on refresh
    if (pathname === "/" || pathname.startsWith("/curator")) return;

    const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (entries[0]?.type === "reload") {
      window.location.replace("/");
    }
  }, [pathname]);

  return null;
}

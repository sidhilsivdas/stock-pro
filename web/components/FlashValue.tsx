"use client";

import { useState } from "react";

// Shows a value and briefly flashes green/red whenever it goes up/down
export function FlashValue({
  value,
  children,
  className = "",
}: {
  value: number;
  children: React.ReactNode;
  className?: string;
}) {
  const [prev, setPrev] = useState(value);
  const [flash, setFlash] = useState({ dir: "", count: 0 });

  // Compare with the previous value during render (React's recommended
  // way to react to a prop change without an extra effect)
  if (value !== prev) {
    setPrev(value);
    setFlash({ dir: value > prev ? "flash-up" : "flash-down", count: flash.count + 1 });
  }

  return (
    // changing the key restarts the CSS animation
    <span key={flash.count} className={`rounded px-1 -mx-1 ${flash.dir} ${className}`}>
      {children}
    </span>
  );
}

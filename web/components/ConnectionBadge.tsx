"use client";

import { useConnection } from "@/hooks/useConnection";

const STYLES = {
  connected: { dot: "bg-emerald-400", ring: "border-emerald-400/30 text-emerald-300", label: "Live" },
  connecting: { dot: "bg-amber-400", ring: "border-amber-400/30 text-amber-300", label: "Connecting" },
  disconnected: { dot: "bg-rose-500", ring: "border-rose-500/30 text-rose-300", label: "Offline" },
};

export function ConnectionBadge() {
  const { status, latency, clients } = useConnection();
  const style = STYLES[status];

  return (
    <div className="flex items-center gap-3 text-xs">
      {clients !== null && status === "connected" && (
        <span className="hidden text-slate-400 sm:inline">
          <span className="font-mono text-slate-200">{clients}</span> online
        </span>
      )}
      <span className={`flex items-center gap-2 rounded-full border bg-white/[0.03] px-3 py-1.5 ${style.ring}`}>
        <span className="relative flex h-2 w-2">
          {status === "connected" && (
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${style.dot}`} />
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${style.dot}`} />
        </span>
        <span className="font-medium">{style.label}</span>
        {latency !== null && status === "connected" && (
          <span className="font-mono text-slate-400">{latency}ms</span>
        )}
      </span>
    </div>
  );
}

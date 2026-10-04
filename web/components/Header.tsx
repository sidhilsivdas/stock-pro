import Link from "next/link";
import { ConnectionBadge } from "./ConnectionBadge";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#05070d]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 shadow-[0_0_20px_rgba(34,211,238,0.35)]">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#05070d]" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l6-6 4 4 8-8" />
              <path d="M14 7h7v7" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Stock<span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">Pro</span>
          </span>
        </Link>
        <ConnectionBadge />
      </div>
    </header>
  );
}

import type { ReactNode } from "react";

/**
 * Login / "Recuperar senha" layout from the Figma design: abstract capsules on the left,
 * the form centered on the right. The capsules are drawn as SVG so they stay sharp at any size.
 */

const LIME = "#e3f498";
const TEAL = "#02575c";

/** Capsule = a thick line with round ends. All of them follow the same ~35° diagonal. */
function AuthArt() {
  return (
    <svg
      viewBox="0 0 840 1024"
      preserveAspectRatio="xMinYMid slice"
      className="h-full w-full"
      aria-hidden
      focusable="false"
    >
      <defs>
        {/* big capsule: lime only in the top-left corner, deep teal everywhere else */}
        <linearGradient id="auth-big" gradientUnits="userSpaceOnUse" x1="-422" y1="-96" x2="482" y2="530">
          <stop offset="0.34" stopColor={LIME} />
          <stop offset="0.8" stopColor={TEAL} />
        </linearGradient>
        {/* translucent ring around the big capsule */}
        <linearGradient id="auth-ring" gradientUnits="userSpaceOnUse" x1="-422" y1="-96" x2="482" y2="530">
          <stop offset="0.42" stopColor={TEAL} stopOpacity="0" />
          <stop offset="0.72" stopColor={TEAL} stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="auth-top" gradientUnits="userSpaceOnUse" x1="30" y1="-273" x2="605" y2="125">
          <stop offset="0.68" stopColor={LIME} />
          <stop offset="0.86" stopColor={TEAL} />
        </linearGradient>
        <linearGradient id="auth-left" gradientUnits="userSpaceOnUse" x1="-159" y1="605" x2="252" y2="890">
          <stop offset="0.52" stopColor={LIME} />
          <stop offset="0.8" stopColor={TEAL} />
        </linearGradient>
        <linearGradient id="auth-bottom" gradientUnits="userSpaceOnUse" x1="503" y1="910" x2="996" y2="1251">
          <stop offset="0.1" stopColor={LIME} />
          <stop offset="0.38" stopColor={TEAL} />
        </linearGradient>
      </defs>

      <line x1="-422" y1="-96" x2="482" y2="530" stroke="url(#auth-ring)" strokeWidth="550" strokeLinecap="round" />
      <line x1="-422" y1="-96" x2="482" y2="530" stroke="url(#auth-big)" strokeWidth="480" strokeLinecap="round" />
      <line x1="30" y1="-273" x2="605" y2="125" stroke="url(#auth-top)" strokeWidth="152" strokeLinecap="round" />
      <line x1="-159" y1="605" x2="252" y2="890" stroke="url(#auth-left)" strokeWidth="152" strokeLinecap="round" />
      <line x1="503" y1="910" x2="996" y2="1251" stroke="url(#auth-bottom)" strokeWidth="156" strokeLinecap="round" />
    </svg>
  );
}

export function AuthShell({ children, toast }: { children: ReactNode; toast?: ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-1 overflow-hidden bg-bg">
      {/* on desktop the art owns the left side; on small screens it becomes a soft backdrop */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-full opacity-25 lg:w-[58%] lg:opacity-100">
        <AuthArt />
      </div>

      {toast}

      <div className="relative z-10 flex w-full items-center justify-center px-6 py-12 lg:ml-[58%] lg:w-[37.6%] lg:px-6">
        <div className="w-full max-w-[434px]">{children}</div>
      </div>
    </main>
  );
}

/** The green confirmation tag from the design ("Código enviado!"), pinned to the right edge. */
export function AuthToast({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="absolute right-0 top-[118px] z-20 flex items-center gap-5 rounded-l-[12px] bg-success-from px-10 py-7 font-display text-2xl font-bold text-white shadow-lg"
    >
      {children}
    </div>
  );
}

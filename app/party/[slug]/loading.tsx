export default function PartySlugLoading() {
  return (
    <div className="relative z-10 flex min-h-[calc(100vh-11rem)] items-center justify-center px-4">
      <div className="site-panel relative flex h-48 w-48 items-center justify-center overflow-hidden rounded-full border-white/15">
        <div className="absolute inset-5 rounded-full border border-white/10" />
        <span className="font-[family:var(--font-brand)] text-6xl tracking-[0.2em] text-white animate-[spin_1.6s_linear_infinite,fadePulse_1.6s_ease-in-out_infinite]">
          TCL
        </span>
      </div>
      <style>{`
        @keyframes fadePulse {
          0% { opacity: 0.2; }
          50% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}

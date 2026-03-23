import { Sparkles, Calendar, Clock, MapPin } from "lucide-react"
import { formatEventDate } from "@/lib/utils"

interface PartyHeaderProps {
  title: string
  organizations: string[]
  eventDate?: string
  eventTime?: string
  location?: string
}

const orgBadgeStyles: Record<string, string> = {
  SSA: "border-violet-300/30 bg-violet-300/12 text-violet-100",
  HKSA: "border-sky-300/30 bg-sky-300/12 text-sky-100",
  SIAM: "border-emerald-300/30 bg-emerald-300/12 text-emerald-100",
  KSA: "border-rose-300/30 bg-rose-300/12 text-rose-100",
  CSA: "border-amber-300/30 bg-amber-300/12 text-amber-100",
  TSA: "border-pink-300/30 bg-pink-300/12 text-pink-100",
  ASA: "border-indigo-300/30 bg-indigo-300/12 text-indigo-100",
}

export function PartyHeader({ title, organizations, eventDate, eventTime, location }: PartyHeaderProps) {
  return (
    <div className="site-panel relative overflow-hidden rounded-[2rem] p-6 text-center sm:p-8">
      <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-[38rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(244,162,97,0.24)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(118,214,198,0.22)_0%,transparent_72%)]" />

      <div className="relative mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[rgba(245,196,110,0.9)]">
        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
        Live Registration
      </div>

      <div className="relative flex items-center justify-center gap-2 sm:gap-3">
        <Sparkles className="h-6 w-6 text-[rgba(245,196,110,0.9)] sm:h-7 sm:w-7" />
        <h1 className="font-[family:var(--font-brand)] text-4xl tracking-[0.12em] text-white sm:text-5xl">
          {title}
        </h1>
        <Sparkles className="h-6 w-6 text-[rgba(118,214,198,0.9)] sm:h-7 sm:w-7" />
      </div>

      {(eventDate || eventTime || location) && (
        <div className="relative mt-4 flex flex-col items-center justify-center gap-3 text-sm text-white/72 md:flex-row md:gap-5">
          {eventDate && (
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
              <Calendar className="h-4 w-4 text-[rgba(245,196,110,0.9)]" />
              <span>{formatEventDate(eventDate)}</span>
            </div>
          )}

          {eventTime && (
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
              <Clock className="h-4 w-4 text-[rgba(118,214,198,0.9)]" />
              <span>{eventTime}</span>
            </div>
          )}

          {location && (
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
              <MapPin className="h-4 w-4 text-[rgba(245,196,110,0.9)]" />
              <span>{location}</span>
            </div>
          )}
        </div>
      )}

      <p className="relative mx-auto mt-5 max-w-2xl text-sm text-white/55">
        Powered by{" "}
        <a
          href="https://cm-isomer.vercel.app/"
          className="text-[rgba(245,196,110,0.95)] underline-offset-4 hover:underline"
        >
          CMIsomer
        </a>{" "}
        by the Tartan Cultural League.
      </p>
      <div className="relative mt-4 flex flex-wrap justify-center gap-2 text-xs">
        {organizations.map((org) => {
          const style =
            orgBadgeStyles[org] ||
            "border-white/20 bg-white/10 text-white/80"
          return (
            <span
              key={org}
              className={`rounded-full border px-3 py-1 ${style}`}
            >
              {org}
            </span>
          )
        })}
      </div>
    </div>
  )
}

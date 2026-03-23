import Link from "next/link"
import { ArrowRight, CalendarRange, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="relative z-10 mx-auto min-h-[calc(100vh-11rem)] w-full max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <Card className="site-panel rounded-[2rem] p-8 text-white sm:p-10">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[rgba(245,196,110,0.9)]">
            <Sparkles className="h-3.5 w-3.5" />
            Event Control Room
          </p>
          <h1 className="font-[family:var(--font-brand)] text-5xl tracking-[0.12em] sm:text-6xl">
            CMIsomer
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/70 sm:text-lg">
            Launch events, manage registrations, and operate check-in flows with
            an interface built to stay calm under peak demand.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              className="rounded-full border border-[rgba(245,196,110,0.4)] bg-[linear-gradient(135deg,rgba(244,162,97,0.96),rgba(235,117,74,0.96))] px-6 text-zinc-950 hover:opacity-95"
            >
              <Link href="/create">
                Start Creating
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-white/15 bg-white/[0.04] px-6 text-white hover:bg-white/[0.09]"
            >
              <Link href="/about">About CMIsomer</Link>
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Card className="site-panel rounded-[1.6rem] p-6 text-white">
            <div className="mb-3 inline-flex rounded-xl bg-white/[0.08] p-2 text-[rgba(118,214,198,0.88)]">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">Organizer-Ready</h2>
            <p className="mt-2 text-sm leading-7 text-white/65">
              Build and publish party pages in minutes with controls for pricing,
              capacity, and organization limits.
            </p>
          </Card>
          <Card className="site-panel rounded-[1.6rem] p-6 text-white">
            <div className="mb-3 inline-flex rounded-xl bg-white/[0.08] p-2 text-[rgba(245,196,110,0.88)]">
              <CalendarRange className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">Fast Event Ops</h2>
            <p className="mt-2 text-sm leading-7 text-white/65">
              Handle real-time registration updates, confirmations, and entrance
              workflows from one coherent dashboard.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

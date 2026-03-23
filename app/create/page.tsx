import Link from "next/link"
import { ArrowRight, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="relative z-10 mx-auto min-h-[calc(100vh-11rem)] w-full max-w-5xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
      <Card className="site-panel rounded-[2rem] p-8 text-white sm:p-10">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[rgba(245,196,110,0.9)]">
          <Rocket className="h-3.5 w-3.5" />
          Create Flow
        </div>
        <h1 className="font-[family:var(--font-brand)] text-4xl tracking-[0.12em] sm:text-5xl">
          Launch a New Party
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-white/70">
          We removed Lite/Pro splitting and streamlined creation into one clean
          path. Use the party setup flow to configure pricing, capacity, orgs,
          and registration behavior.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-[1fr,auto]">
          <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-lg font-semibold">Party Builder</h2>
            <p className="mt-2 text-sm leading-7 text-white/65">
              Configure event metadata, ticketing tiers, and admin controls from
              one guided setup.
            </p>
          </div>
          <div className="flex items-center">
            <Button
              asChild
              className="h-12 rounded-full border border-[rgba(245,196,110,0.4)] bg-[linear-gradient(135deg,rgba(244,162,97,0.96),rgba(235,117,74,0.96))] px-6 text-zinc-950 hover:opacity-95"
            >
              <Link href="/create/create-party">
                Open Party Builder
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

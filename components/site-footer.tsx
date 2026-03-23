import Link from "next/link"
import { ArrowUpRight, Compass, LifeBuoy, Sparkles, Users } from "lucide-react"

const footerGroups = [
  {
    title: "Product",
    icon: Compass,
    links: [
      { href: "/", label: "Home", description: "Entry point and overview" },
      { href: "/create", label: "Create", description: "Open the event launchpad" },
      { href: "/about", label: "About", description: "Read the platform story" },
    ],
  },
  {
    title: "Organizer",
    icon: Sparkles,
    links: [
      { href: "/create", label: "Create Hub", description: "Pick the event flow you need" },
      { href: "/create/create-party", label: "Create Party", description: "Go straight to party setup" },
    ],
  },
  {
    title: "Support",
    icon: LifeBuoy,
    links: [
      { href: "/about", label: "About", description: "Support and FAQ starting point" },
      { href: "/about", label: "Contact", description: "Find current support channels" },
    ],
  },
  {
    title: "Project",
    icon: Users,
    links: [
      { href: "/about", label: "About", description: "How the product was built" },
      { href: "/about", label: "Contributors", description: "See the people behind CMIsomer" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="relative z-10 px-3 pb-6 pt-16 sm:px-5 sm:pt-20">
      <div className="site-panel mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10">
        <div className="grid gap-10 lg:grid-cols-[1.2fr,2fr] lg:gap-14">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[rgba(245,196,110,0.95)] shadow-[0_0_18px_rgba(245,196,110,0.85)]" />
              <span className="text-xs uppercase tracking-[0.3em] text-white/55">
                Global Event Shell
              </span>
            </div>

            <div>
              <h2 className="font-[family:var(--font-brand)] text-4xl tracking-[0.14em] text-white sm:text-5xl">
                CMIsomer
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/62 sm:text-base">
                A sharper control surface for party launches, signups, and live
                event operations. Built to feel fast, calm, and dependable when
                demand spikes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/create/create-party"
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(245,196,110,0.35)] bg-[linear-gradient(135deg,rgba(244,162,97,0.98),rgba(235,117,74,0.95))] px-5 py-3 text-sm font-medium text-zinc-950 transition hover:opacity-95"
              >
                Launch a Party
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
              >
                Learn the System
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {footerGroups.map((group) => {
              const Icon = group.icon
              return (
                <section
                  key={group.title}
                  className="rounded-[1.6rem] border border-white/8 bg-white/[0.035] p-5"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="rounded-2xl bg-white/[0.08] p-2 text-[rgba(118,214,198,0.88)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/88">
                      {group.title}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {group.links.map((link) => (
                      <Link
                        key={`${group.title}-${link.label}-${link.href}`}
                        href={link.href}
                        className="block rounded-2xl px-1 py-1 transition hover:bg-white/[0.04]"
                      >
                        <div className="mb-1 flex items-center justify-between gap-3 text-sm font-medium text-white">
                          <span>{link.label}</span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-white/35" />
                        </div>
                        <p className="text-xs leading-6 text-white/48">
                          {link.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/8 pt-5 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>CMIsomer global chrome refresh for organizers and guests.</p>
          <p>Designed for quick launches, clear navigation, and cleaner event operations.</p>
        </div>
      </div>
    </footer>
  )
}

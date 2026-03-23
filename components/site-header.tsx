"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowRight,
  ChevronDown,
  CircleHelp,
  Compass,
  Menu,
  Sparkles,
  Ticket,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { buildNavGroup, primaryNavLinks } from "@/components/site-nav"
import { cn } from "@/lib/utils"

const partyToolsNotes = [
  {
    label: "Party pages appear after publish",
    description: "Create an event first, then open its public slug page.",
  },
  {
    label: "Admin tools live inside each party",
    description: "Use your event-specific link for dashboard, scan, and check-in.",
  },
]

function BrandMark() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-3 py-2 backdrop-blur-md transition hover:border-[rgba(245,196,110,0.5)] hover:bg-white/10"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(244,162,97,0.95),rgba(51,120,111,0.95))] text-sm font-semibold text-zinc-950 shadow-[0_10px_30px_rgba(244,162,97,0.28)]">
        CM
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-[family:var(--font-brand)] text-[1.45rem] tracking-[0.12em] text-white">
          CMIsomer
        </span>
        <span className="text-[0.68rem] uppercase tracking-[0.28em] text-white/50">
          Event Control Room
        </span>
      </span>
    </Link>
  )
}

function NavLink({
  href,
  label,
  pathname,
}: {
  href: string
  label: string
  pathname: string
}) {
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition",
        isActive
          ? "bg-white text-zinc-950 shadow-[0_10px_30px_rgba(255,255,255,0.16)]"
          : "text-white/72 hover:bg-white/10 hover:text-white"
      )}
    >
      {label}
    </Link>
  )
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/"

  return (
    <header className="site-header sticky top-0 z-50 px-3 py-3 sm:px-5">
      <div className="site-panel mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[1.75rem] px-4 py-3 sm:px-5">
        <BrandMark />

        <nav className="hidden items-center gap-2 lg:flex">
          {primaryNavLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              pathname={pathname}
            />
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/72 transition hover:bg-white/10 hover:text-white">
                Organizer
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="w-80 rounded-3xl border-white/12 bg-[rgba(14,18,26,0.96)] p-2 text-white shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
            >
              <DropdownMenuLabel className="px-3 py-2 text-xs uppercase tracking-[0.28em] text-[rgba(245,196,110,0.8)]">
                Organizer
              </DropdownMenuLabel>
              {buildNavGroup.items.map((item) => {
                const Icon = item.icon ?? Sparkles
                return (
                  <DropdownMenuItem
                    key={item.href}
                    asChild
                    className="rounded-2xl px-3 py-3 focus:bg-white/8 focus:text-white"
                  >
                    <Link href={item.href} className="flex items-start gap-3">
                      <span className="mt-0.5 rounded-xl bg-white/8 p-2 text-[rgba(245,196,110,0.88)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex flex-col">
                        <span className="font-medium text-white">{item.label}</span>
                        <span className="text-xs leading-relaxed text-white/55">
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/72 transition hover:bg-white/10 hover:text-white">
                Party Tools
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-88 rounded-3xl border-white/12 bg-[rgba(14,18,26,0.96)] p-3 text-white shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
            >
              <DropdownMenuLabel className="px-2 py-1 text-xs uppercase tracking-[0.28em] text-[rgba(118,214,198,0.8)]">
                Contextual Tools
              </DropdownMenuLabel>
              <div className="space-y-2 p-1">
                {partyToolsNotes.map((note) => (
                  <div
                    key={note.label}
                    className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3"
                  >
                    <div className="mb-1 flex items-center gap-2 text-sm font-medium text-white">
                      <Ticket className="h-4 w-4 text-[rgba(118,214,198,0.85)]" />
                      {note.label}
                    </div>
                    <p className="text-xs leading-relaxed text-white/55">
                      {note.description}
                    </p>
                  </div>
                ))}
              </div>
              <DropdownMenuSeparator className="bg-white/8" />
              <DropdownMenuItem
                asChild
                className="rounded-2xl px-3 py-3 focus:bg-white/8 focus:text-white"
              >
                <Link href="/about" className="flex items-center gap-3">
                  <CircleHelp className="h-4 w-4 text-[rgba(118,214,198,0.85)]" />
                  <span className="flex flex-col">
                    <span className="font-medium">How party pages work</span>
                    <span className="text-xs text-white/55">
                      Read the overview before sharing your event slug.
                    </span>
                  </span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <Button
            asChild
            className="rounded-full border border-[rgba(245,196,110,0.4)] bg-[linear-gradient(135deg,rgba(244,162,97,0.96),rgba(235,117,74,0.96))] px-5 text-zinc-950 hover:opacity-95"
          >
            <Link href="/create/create-party">
              Create Party
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-white/12 bg-white/8 text-white hover:bg-white/12"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="border-white/10 bg-[linear-gradient(180deg,rgba(10,14,22,0.98),rgba(15,24,34,0.98))] text-white"
            >
              <SheetHeader className="pr-10">
                <SheetTitle className="font-[family:var(--font-brand)] text-3xl tracking-[0.12em] text-white">
                  CMIsomer
                </SheetTitle>
                <SheetDescription className="text-white/55">
                  Navigate the app, launch an event, or review how party tools
                  fit into the workflow.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-8 space-y-8">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.28em] text-[rgba(245,196,110,0.8)]">
                    Navigate
                  </p>
                  <div className="space-y-2">
                    {primaryNavLinks.map((link) => {
                      const Icon = link.icon ?? Compass
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-white transition hover:bg-white/[0.08]"
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-[rgba(245,196,110,0.88)]" />
                            {link.label}
                          </span>
                          <ArrowRight className="h-4 w-4 text-white/35" />
                        </Link>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.28em] text-[rgba(245,196,110,0.8)]">
                    Organizer
                  </p>
                  <div className="space-y-2">
                    {buildNavGroup.items.map((item) => {
                      const Icon = item.icon ?? Sparkles
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.08]"
                        >
                          <div className="mb-1 flex items-center gap-3 text-white">
                            <Icon className="h-4 w-4 text-[rgba(118,214,198,0.85)]" />
                            <span className="font-medium">{item.label}</span>
                          </div>
                          <p className="text-sm text-white/55">{item.description}</p>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.28em] text-[rgba(245,196,110,0.8)]">
                    Party Tools
                  </p>
                  <div className="space-y-2">
                    {partyToolsNotes.map((note) => (
                      <div
                        key={note.label}
                        className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] px-4 py-3"
                      >
                        <div className="mb-1 flex items-center gap-3 text-sm font-medium text-white">
                          <Ticket className="h-4 w-4 text-[rgba(118,214,198,0.85)]" />
                          {note.label}
                        </div>
                        <p className="text-sm text-white/50">{note.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

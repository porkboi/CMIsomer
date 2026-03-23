import {
  Compass,
  FilePlus2,
  Info,
  Sparkles,
} from "lucide-react"

export type SiteNavLink = {
  href: string
  label: string
  description?: string
  icon?: typeof Compass
}

export type SiteNavGroup = {
  label: string
  items: SiteNavLink[]
}

export const primaryNavLinks: SiteNavLink[] = [
  {
    href: "/",
    label: "Home",
    description: "Landing page and quick access to the app",
    icon: Compass,
  },
  {
    href: "/create",
    label: "Create",
    description: "Open the launchpad for new event flows",
    icon: Sparkles,
  },
  {
    href: "/about",
    label: "About",
    description: "Product story, contributors, and FAQs",
    icon: Info,
  },
]

export const buildNavGroup: SiteNavGroup = {
  label: "Organizer",
  items: [
    {
      href: "/create",
      label: "Create Hub",
      description: "Choose how you want to start a new event flow",
      icon: Sparkles,
    },
    {
      href: "/create/create-party",
      label: "Create Party",
      description: "Open the party creation flow directly",
      icon: FilePlus2,
    },
  ],
}

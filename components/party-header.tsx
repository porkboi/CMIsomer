import { Sparkles } from "lucide-react"

interface PartyHeaderProps {
  title: string
  organizations: string[]
}

const orgColors = {
  SSA: "purple",
  HKSA: "blue",
  SIAM: "green",
  KSA: "red",
  CSA: "yellow",
  TSA: "pink",
  ASA: "indigo",
} as const

export function PartyHeader({ title, organizations }: PartyHeaderProps) {
  return (
    <div className="text-center space-y-4">
      <div className="flex items-center justify-center gap-2">
        <Sparkles className="h-8 w-8 text-purple-500" />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text">
          {title}
        </h1>
        <Sparkles className="h-8 w-8 text-purple-500" />
      </div>
      <p className="text-zinc-400 max-w-2xl mx-auto">
        Powered by the CMIsomer, made by the Tartan Cultural League
      </p>
      <div className="flex flex-wrap justify-center gap-2 text-xs">
        {organizations.map((org) => {
          const color = orgColors[org as keyof typeof orgColors] || "gray"
          return (
            <span
              key={org}
              className={`px-3 py-1 rounded-full bg-${color}-900/50 text-${color}-300 border border-${color}-700`}
            >
              {org}
            </span>
          )
        })}
      </div>
    </div>
  )
}


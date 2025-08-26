import { Sparkles, Calendar, Clock, MapPin, Github } from "lucide-react"
import { formatEventDate } from "@/lib/utils"

interface PartyHeaderProps {
  title: string
  organizations: string[]
  eventDate?: string
  eventTime?: string
  location?: string
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

var link = <a href={'https://cm-isomer.vercel.app/'}>CMIsomer</a>;

export function PartyHeader({ title, organizations, eventDate, eventTime, location }: PartyHeaderProps) {
  return (
    <div className="text-center space-y-4">
      <div className="flex items-center justify-center gap-2">
        <Sparkles className="h-8 w-8 text-purple-500" />
        <h1 className="text-4xl font-bold bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text">
          {title}
        </h1>
        <Sparkles className="h-8 w-8 text-purple-500" />
      </div>

      {/* Add event details section */}
      {(eventDate || eventTime || location) && (
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">          {eventDate && (
            <div className="flex items-center gap-1 text-zinc-300">
              <Calendar className="h-4 w-4 text-purple-500" />
              <span>{formatEventDate(eventDate)}</span>
            </div>
          )}

          {eventTime && (
            <div className="flex items-center gap-1 text-zinc-300">
              <Clock className="h-4 w-4 text-purple-500" />
              <span>{eventTime}</span>
            </div>
          )}

          {location && (
            <div className="flex items-center gap-1 text-zinc-300">
              <MapPin className="h-4 w-4 text-purple-500" />
              <span>{location}</span>
            </div>
          )}
        </div>
      )}

      <p className="text-zinc-400 max-w-2xl mx-auto">
        Powered by {link} by the Tartan Cultural League.
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


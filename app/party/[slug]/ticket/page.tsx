import { notFound, redirect } from "next/navigation"
import { getPartyBySlug, getTicketByToken,getRegistrations } from "@/lib/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Ticket, User, Calendar, MapPin, Clock } from "lucide-react"
import { WalletButtons } from "@/components/wallet-buttons" 

interface PageProps {
  params: { slug: string }
  searchParams: { token?: string }
}

export default async function TicketPage({ params, searchParams }: PageProps) {
  const token = searchParams.token

  if (!token) {
    redirect(`/party/${params.slug}`)
  }

  const party = await getPartyBySlug(params.slug)
  if (!party) {
    notFound()
  }

  const ticket = await getTicketByToken(params.slug, token)
  if (!ticket) {
    redirect(`/party/${params.slug}?error=invalid_token`)
  }

  const registrations = getRegistrations(params.slug)
  const confirmedRegistrations = registrations.filter((reg) => reg.status === "confirmed")
  const checkedIn = registrations.filter((reg) => reg.checked_in === true)

  const ratio = checkedIn.length / confirmedRegistrations

  let vibe = {
    text: "it's dead",
    color: "bg-green-500",
  }

  if (ratio > 2 / 3) {
    vibe = {
      text: "WOOOO",
      color: "bg-red-500",
    }
  } else if (ratio > 1 / 3) {
    vibe = {
      text: "lively",
      color: "bg-yellow-400",
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text text-center mb-8">
          Your Ticket for {party.name}
        </h1>

        <div className="max-w-md mx-auto">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="bg-gradient-to-r from-pink-600 to-purple-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Admission Ticket
              </CardTitle>
              <CardDescription className="text-white/80">Present this QR code at the entrance</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg mb-6">
                <Image
                  src={ticket.qrCode || "/placeholder.svg"}
                  alt="Ticket QR Code"
                  width={200}
                  height={200}
                  priority
                />
              </div>
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="relative">
                  <span
                    className={`h-4 w-4 rounded-full ${vibe.color} animate-ping absolute inline-flex opacity-75`}
                  ></span>
                  <span
                    className={`h-4 w-4 rounded-full ${vibe.color} relative inline-flex`}
                  ></span>
                </div>
                <div className="text-lg font-semibold">{vibe.text}</div>
              </CardContent>



              {/* ✅ Use the new Client Component here */}
              <WalletButtons />

              <div className="w-full space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-sm text-zinc-400">Attendee</p>
                    <p className="font-medium">{ticket.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-sm text-zinc-400">Andrew ID</p>
                    <p className="font-medium">{ticket.andrewID}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-sm text-zinc-400">Organization</p>
                    <p className="font-medium">{ticket.organization}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-sm text-zinc-400">Date</p>
                    <p className="font-medium">
                      {party.event_date
                        ? new Date(party.event_date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "TBA"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-sm text-zinc-400">Time</p>
                    <p className="font-medium">{party.event_time || "TBA"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-sm text-zinc-400">Location</p>
                    <p className="font-medium">{party.location || "TBA"}</p>
                  </div>
                </div>

                {ticket.tierName && (
                  <div className="flex items-center gap-3">
                    <Ticket className="h-5 w-5 text-purple-500 shrink-0" />
                    <div>
                      <p className="text-sm text-zinc-400">Ticket Tier</p>
                      <p className="font-medium">
                        {ticket.tierName} (${ticket.tierPrice || ticket.price})
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-zinc-400">This ticket is non-transferable and must be presented at entry.</p>
                <p className="text-sm text-zinc-400 mt-1">Ticket ID: {ticket.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

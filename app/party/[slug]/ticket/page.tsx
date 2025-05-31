import { notFound, redirect } from "next/navigation"
import { getPartyBySlug, getTicketByToken, getCheckedInCount } from "@/lib/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Ticket, User, Calendar, MapPin, Clock } from "lucide-react"
import { WalletButtons } from "@/components/wallet-buttons"
import { PartyStatusIndicator } from "@/components/party-status-indicator"
import { formatEventDate } from "@/lib/utils"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function TicketPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;
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

  const { checkedInCount, maxCapacity } = await getCheckedInCount(params.slug)

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="container bg-zinc-800 mx-auto px-4 py-8">
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

              <div className="mb-6 p-3 bg-zinc-900 rounded-lg w-full text-center">
                <p className="text-sm text-zinc-400 mb-1">Current Party Status:</p>
                <PartyStatusIndicator checkedInCount={checkedInCount} maxCapacity={maxCapacity} />
              </div>

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
                </div>                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-sm text-zinc-400">Date</p>
                    <p className="font-medium">{formatEventDate(party.event_date)}</p>
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

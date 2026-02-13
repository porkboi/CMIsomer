import { notFound, redirect } from "next/navigation";
import { getPartyTickBySlug, getTicketByToken } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, User, Calendar, MapPin, Clock } from "lucide-react";
import { WalletButtons } from "@/components/wallet-buttons";
import { formatEventDate } from "@/lib/utils";
import { buildWrappedScript, hasWrappedMatch, MATCH_WRAPPED_PARTY_SLUG } from "@/lib/match-wrapped";
import TicketMatchLiveHost from "@/components/ticket-match-live-host";

// This page is now server-rendered.
interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function TicketPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const {token} = await searchParams;
  if (!token) redirect(`/party/${slug}`);

  const party = await getPartyTickBySlug(slug);
  if (!party) notFound();

  const ticket = await getTicketByToken(slug, token);
  if (!ticket) redirect(`/party/${slug}?error=invalid_token`);

  const canShowMatchWrapped = slug === MATCH_WRAPPED_PARTY_SLUG && (await hasWrappedMatch(ticket.andrewID));
  const wrappedScript = canShowMatchWrapped ? await buildWrappedScript(slug, ticket.andrewID) : null;

  return (
    <div
      className="min-h-screen bg-zinc-900 text-white"
      style={{ color: "#fff", WebkitTextFillColor: "#fff" }}
    >
      <div className="container relative bg-zinc-800 mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text text-center mb-8">
          Your Ticket for {party.name}
        </h1>
        <div className="max-w-md mx-auto">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="bg-linear-to-r from-pink-600 to-purple-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Admission Ticket
              </CardTitle>
              <CardDescription className="text-white/80">
                Present this QR code at the entrance
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center">
              <TicketMatchLiveHost
                partySlug={slug}
                token={token}
                initialQr={ticket.qrCode}
                showMatchWrapped={canShowMatchWrapped}
                viewerAndrewID={ticket.andrewID}
                wrappedScript={wrappedScript}
              />
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
                {!party.enable_schedule && <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-sm text-zinc-400">Date</p>
                    <p className="font-medium">{formatEventDate(party.event_date)}</p>
                  </div>
                </div>}
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-purple-500 shrink-0" />
                  <div>
                    <p className="text-sm text-zinc-400">{party.enable_schedule ? "Timeslot" : "Time"}</p>
                    <p className="font-medium">{party.enable_schedule ? ticket.timeSlot : party.event_time || "TBA"}</p>
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
                <p className="text-sm text-zinc-400">
                  This ticket is non-transferable and must be presented at entry.
                </p>
                <p className="text-sm text-zinc-400 mt-1">Ticket ID: {ticket.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { getPartyTickBySlug, getTicketByToken } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, User, Calendar, MapPin, Clock, Sparkles } from "lucide-react";
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
    <div className="relative z-10 mx-auto min-h-[calc(100vh-11rem)] w-full max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
      <div className="site-panel relative mb-6 overflow-hidden rounded-[2rem] p-6 text-center sm:p-8">
        <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(244,162,97,0.24)_0%,transparent_70%)]" />
        <div className="relative mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[rgba(245,196,110,0.9)]">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          Admission Pass
        </div>
        <h1 className="relative font-[family:var(--font-brand)] text-4xl tracking-[0.12em] text-white sm:text-5xl">
          Ticket for {party.name}
        </h1>
        <p className="relative mt-3 text-sm text-white/60">
          Present the QR code below at the entrance.
        </p>
      </div>

      <div className="mx-auto max-w-md">
        <Card className="site-panel border-white/10 bg-[rgba(9,14,22,0.82)] text-white">
            <CardHeader className="rounded-t-2xl border-b border-white/10 bg-[linear-gradient(135deg,rgba(244,162,97,0.86),rgba(46,124,116,0.9))] text-white">
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
                  <User className="h-5 w-5 text-[rgba(118,214,198,0.92)] shrink-0" />
                  <div>
                    <p className="text-sm text-white/55">Attendee</p>
                    <p className="font-medium">{ticket.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-[rgba(245,196,110,0.9)] shrink-0" />
                  <div>
                    <p className="text-sm text-white/55">Andrew ID</p>
                    <p className="font-medium">{ticket.andrewID}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-[rgba(118,214,198,0.92)] shrink-0" />
                  <div>
                    <p className="text-sm text-white/55">Organization</p>
                    <p className="font-medium">{ticket.organization}</p>
                  </div>
                </div>
                {!party.enable_schedule && <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-[rgba(245,196,110,0.9)] shrink-0" />
                  <div>
                    <p className="text-sm text-white/55">Date</p>
                    <p className="font-medium">{formatEventDate(party.event_date)}</p>
                  </div>
                </div>}
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-[rgba(118,214,198,0.92)] shrink-0" />
                  <div>
                    <p className="text-sm text-white/55">{party.enable_schedule ? "Timeslot" : "Time"}</p>
                    <p className="font-medium">{party.enable_schedule ? ticket.timeSlot : party.event_time || "TBA"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-[rgba(245,196,110,0.9)] shrink-0" />
                  <div>
                    <p className="text-sm text-white/55">Location</p>
                    <p className="font-medium">{party.location || "TBA"}</p>
                  </div>
                </div>
                {ticket.tierName && (
                  <div className="flex items-center gap-3">
                    <Ticket className="h-5 w-5 text-[rgba(118,214,198,0.92)] shrink-0" />
                    <div>
                      <p className="text-sm text-white/55">Ticket Tier</p>
                      <p className="font-medium">
                        {ticket.tierName} (${ticket.tierPrice || ticket.price})
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-8 text-center">
                <p className="text-sm text-white/55">
                  This ticket is non-transferable and must be presented at entry.
                </p>
                <p className="mt-1 text-sm text-white/45">Ticket ID: {ticket.id}</p>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}

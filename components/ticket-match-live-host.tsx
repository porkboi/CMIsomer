"use client";

import { useState } from "react";
import AutoRefresh from "@/components/auto-refresh";
import TicketQR from "@/components/ticket-qr";
import MatchWrappedModal from "@/components/match-wrapped-modal";
import type { WrappedScript } from "@/lib/match-wrapped";

interface TicketMatchLiveHostProps {
  partySlug: string;
  token: string;
  initialQr: string;
  showMatchWrapped: boolean;
  viewerAndrewID: string;
  wrappedScript: WrappedScript | null;
}

export default function TicketMatchLiveHost({
  partySlug,
  token,
  initialQr,
  showMatchWrapped,
  viewerAndrewID,
  wrappedScript,
}: TicketMatchLiveHostProps) {
  const [matchWrappedOpen, setMatchWrappedOpen] = useState(false);

  return (
    <>
      <AutoRefresh disabled={matchWrappedOpen}>
        <TicketQR partySlug={partySlug} token={token} initialQr={initialQr} width={200} height={200} />
      </AutoRefresh>
      {showMatchWrapped && wrappedScript && (
        <MatchWrappedModal
          partyId={partySlug}
          viewerAndrewID={viewerAndrewID}
          initialScript={wrappedScript}
          onOpenChange={setMatchWrappedOpen}
        />
      )}
    </>
  );
}

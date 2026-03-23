"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { registrationTableName } from "@/lib/table-names";

interface TicketQRProps {
  partySlug: string;
  token: string;
  initialQr: string;
  width?: number;
  height?: number;
  pollingEnabled?: boolean;
  pollingMs?: number;
  onCheckedIn?: () => void;
}

export default function TicketQR({
  partySlug,
  token,
  initialQr,
  width = 200,
  height = 200,
  pollingEnabled = true,
  pollingMs = 1000,
}: TicketQRProps) {
  const [qr, setQr] = useState<string>(initialQr || "/placeholder.svg");
  const intervalRef = useRef<number | null>(null);
  const requestInFlightRef = useRef(false);

  useEffect(() => {
    if (!pollingEnabled) return;
    let isMounted = true;

    async function fetchTicket() {
      if (requestInFlightRef.current) return;
      requestInFlightRef.current = true;

      try {
        const tableName = registrationTableName(partySlug);
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .eq("confirmation_token", token)
          .single();

        if (error) {
          console.error("Error fetching ticket:", error);
          return;
        }

        if (isMounted && data && data.qr_code) {
          setQr(data.qr_code);
        }
      } finally {
        requestInFlightRef.current = false;
      }
    }

    // Initial fetch on mount.
    fetchTicket();

    // Poll on a fixed cadence without reloading the page.
    intervalRef.current = window.setInterval(fetchTicket, pollingMs);

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      requestInFlightRef.current = false;
    };
  }, [partySlug, token, pollingEnabled, pollingMs]);

  return (
    <div className="bg-white p-4 rounded-lg mb-6">
      <Image
        src={qr || "/placeholder.svg"}
        alt="Ticket QR Code"
        width={width}
        height={height}
        priority
      />
    </div>
  );
}

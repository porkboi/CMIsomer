"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface TicketQRProps {
  partySlug: string;
  token: string;
  initialQr: string;
  width?: number;
  height?: number;
}

function withTimestamp(src: string, tick: number) {
  return src.includes("?") ? `${src}&t=${tick}` : `${src}?t=${tick}`;
}

export default function TicketQR({
  partySlug,
  token,
  initialQr,
  width = 200,
  height = 200,
}: TicketQRProps) {
  const [qr, setQr] = useState<string>(initialQr);
  const [tick, setTick] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    async function fetchTicket() {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("party_slug", partySlug)
        .eq("confirmation_token", token)
        .single();

      if (error) {
        console.error("Error fetching ticket:", error);
        return;
      }

      if (data) {
        setQr(data.qr_code);
      }
      setTick(Date.now());
    }

    // Initial fetch on mount.
    fetchTicket();

    // Set up an interval to poll the ticket row every second.
    intervalRef.current = window.setInterval(fetchTicket, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [partySlug, token]);

  // If the current qr value appears to be a GIF (checked-in), then
  // display it directly (without cache busting) so that the animation plays.
  // Otherwise, append a timestamp to the QR code URL to force a refresh.
  const isGif =
    qr &&
    (/\.gif($|\?)/i.test(qr) ||
      qr.includes("giphy.com") ||
      qr.includes(".gif/"));
  const src = isGif ? qr : withTimestamp(qr, tick);

  return (
    <div className="bg-white p-4 rounded-lg mb-6">
      <Image
        src={src || "/placeholder.svg"}
        alt="Ticket QR Code"
        width={width}
        height={height}
        priority
      />
      {isGif && (
        <div className="mt-2 text-sm text-center text-zinc-600">
          Checked in — enjoy the GIF
        </div>
      )}
    </div>
  );
}
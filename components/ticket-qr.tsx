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

function withTimestamp(src: string | null, tick: number) {
  if (!src) return src;
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
    // Poll the tickets table by partySlug and token every second.
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

    // Set up an interval to re-fetch every second.
    intervalRef.current = window.setInterval(fetchTicket, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [partySlug, token]);

  // Determine if the current qr value appears to be a GIF URL.
  const isGif =
    qr && (/\.gif($|\?)/i.test(qr) || qr.includes("giphy.com") || qr.includes(".gif/"));

  // When displaying a QR code, we append a timestamp to help bust caches.
  // When it's a GIF (checked in) we display it as-is so that the animation can play.
  // const src = isGif ? qr || "/placeholder.svg" : withTimestamp(qr ?? "/placeholder.svg", tick);

  return (
    <div className="bg-white p-4 rounded-lg mb-6">
      <Image
        src={qr}
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
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
  onCheckedIn?: () => void;
}

function withTimestamp(src: string, tick: number): string {
  if (!src || src === "/placeholder.svg") return src;
  return src.includes("?") ? `${src}&t=${tick}` : `${src}?t=${tick}`;
}

export default function TicketQR({
  partySlug,
  token,
  initialQr,
  width = 200,
  height = 200,
  onCheckedIn,
}: TicketQRProps) {
  const [qr, setQr] = useState<string>(initialQr || "/placeholder.svg");
  const [tick, setTick] = useState<number>(Date.now());
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
        console.log("Error fetching ticket:", error);
        return;
      }

      if (data && data.qr_code) {
        setQr(data.qr_code);
      }
      setTick(Date.now());
    }

    // Initial fetch on mount.
    fetchTicket();

    // Poll every second.
    intervalRef.current = window.setInterval(fetchTicket, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [partySlug, token]);

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
"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";

interface TicketQRProps {
  partySlug: string;
  token: string;
  initialQr?: string | null;
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
  initialQr = null,
  width = 200,
  height = 200,
}: TicketQRProps) {
  // start with deterministic values so that server and client markup match:
  const [qr, setQr] = useState<string | null>(initialQr);
  const [tick, setTick] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchPageAndExtractImg = async () => {
      try {
        // Fetch the same server-rendered page and extract the QR image source.
        const url = `/party/${encodeURIComponent(partySlug)}/ticket?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const img = doc.querySelector('img[alt="Ticket QR Code"]') as HTMLImageElement | null;
        const srcFromPage = img?.getAttribute("src") ?? null;
        if (mounted && srcFromPage && srcFromPage !== qr) {
          setQr(srcFromPage);
        }
      } catch {
        // Ignore errors, keep current qr value.
      } finally {
        if (mounted) setTick(Date.now());
      }
    };

    // Do an initial fetch once the component mounts.
    fetchPageAndExtractImg();

    // Always poll every second.
    intervalRef.current = window.setInterval(fetchPageAndExtractImg, 1000);

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [partySlug, token]);

  // If the current QR indicates that the ticket has been checked in (i.e. it's a GIF URL),
  // we will render it without appending a cache-busting timestamp.
  const isGif = qr && (/\.gif($|\?)/i.test(qr) || qr.includes("giphy.com") || qr.includes(".gif/"));
  const src = isGif ? qr || "/placeholder.svg" : withTimestamp(qr ?? "/placeholder.svg", tick);

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
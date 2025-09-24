"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image"

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
  // start with deterministic values so server and client markup match
  const [qr, setQr] = useState<string | null>(initialQr);
  const [tick, setTick] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const isGifUrl = (u: string | null) => {
      if (!u) return false;
      return /\.gif($|\?)/i.test(u) || u.includes("giphy.com") || u.includes(".gif/");
    };

    const fetchPageAndExtractImg = async () => {
      try {
        // Fetch the same server page (no API endpoint). Parse HTML and extract the QR img src.
        const url = `/party/${encodeURIComponent(partySlug)}/ticket?token=${encodeURIComponent(
          token
        )}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const img = doc.querySelector('img[alt="Ticket QR Code"]') as HTMLImageElement | null;
        const src = img?.getAttribute("src") ?? null;
        if (mounted && src && src !== qr) {
          setQr(src);
        }
      } catch {
        // ignore errors - keep current QR
      } finally {
        // set tick only after mount to avoid SSR/CSR mismatch
        if (mounted && tick === 0) setTick(Date.now());
      }
    };

    // initial fetch
    fetchPageAndExtractImg();

    // Start polling after mount and only if current QR is not a GIF.
    // Use a small timeout to ensure the initial DOM update from the fetch has a chance to set `qr`.
    const startPolling = () => {
      if (!isGifUrl(qr)) {
        intervalRef.current = window.setInterval(fetchPageAndExtractImg, 1000);
      }
    };
    // start polling on next tick so client markup is stable
    const startId = window.setTimeout(startPolling, 0);

    return () => {
      mounted = false;
      clearTimeout(startId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [partySlug, token, qr, tick]);

  const isGif = qr && ( /\.gif($|\?)/i.test(qr) || qr.includes("giphy.com") || qr.includes(".gif/") );
  const src = isGif ? qr || "/placeholder.svg" : withTimestamp(qr ?? "/placeholder.svg", tick);

  return (
    <div className="bg-white p-4 rounded-lg mb-6">
      {/* If a GIF is present (checked-in) we render it directly and stop cache-busting so it plays */}
      {!isGif && <Image
        src={initialQr || "/placeholder.svg"}
        alt="Ticket QR Code"
        width={200}
        height={200}
        priority
      />}
      {isGif && <div className="mt-2 text-sm text-center text-zinc-600">Checked in — enjoy the GIF</div>}
    </div>
  );
}
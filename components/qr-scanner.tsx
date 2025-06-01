"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import QrScanner from "qr-scanner"

interface QRScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (data: string) => void
}

export function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)

  useEffect(() => {
    if (isOpen && videoRef.current) {
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          onScan(result.data)
        },
        { returnDetailedScanResult: true },
      )

      qrScannerRef.current.start()
    }

    return () => {
      qrScannerRef.current?.stop()
    }
  }, [isOpen, onScan])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle>Scan QR Code</CardTitle>
          <CardDescription>Position the QR code in front of your camera</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <video ref={videoRef} className="w-full h-auto" />
          <Button variant="outline" onClick={onClose} className="mt-4">
            Close Scanner
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

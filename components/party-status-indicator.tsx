"use client"

import { useEffect, useState } from "react"

interface PartyStatusIndicatorProps {
  checkedInCount: number
  maxCapacity: number
}

export function PartyStatusIndicator({ checkedInCount, maxCapacity }: PartyStatusIndicatorProps) {
  const [status, setStatus] = useState<{
    color: string
    text: string
    className: string
  }>({
    color: "green",
    text: "It's dead",
    className: "pulse-light-green",
  })

  useEffect(() => {
    const percentage = (checkedInCount / maxCapacity) * 100

    if (percentage < 33.33) {
      setStatus({
        color: "green",
        text: "It's dead",
        className: "pulse-light-green",
      })
    } else if (percentage < 66.66) {
      setStatus({
        color: "yellow",
        text: "Lively",
        className: "pulse-light-yellow",
      })
    } else {
      setStatus({
        color: "red",
        text: "WOOOO",
        className: "pulse-light-red",
      })
    }
  }, [checkedInCount, maxCapacity])

  return (
    <div className="flex items-center">
      <span className={`pulse-light-${status.className}`}></span>
      <span className="font-medium">{status.text}</span>
    </div>
  )
}

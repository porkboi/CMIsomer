"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { X } from "lucide-react"

interface OrgLimitsModalProps {
  organizations: string[]
  maxCapacity: number
  onClose: () => void
  onSave: (limits: Record<string, number>) => void
  currentLimits?: Record<string, number>
}

export function OrgLimitsModal({
  organizations,
  maxCapacity,
  onClose,
  onSave,
  currentLimits = {},
}: OrgLimitsModalProps) {
  const { toast } = useToast()
  const [limits, setLimits] = useState<Record<string, number>>({})
  const [totalAllocated, setTotalAllocated] = useState(0)
  const [autoDistribute, setAutoDistribute] = useState(Object.keys(currentLimits).length === 0)

  // Initialize limits with current values or distribute evenly
  useEffect(() => {
    if (Object.keys(currentLimits).length > 0) {
      setLimits(currentLimits)
      setTotalAllocated(Object.values(currentLimits).reduce((sum, value) => sum + value, 0))
    } else if (autoDistribute) {
      const baseValue = Math.floor(maxCapacity / organizations.length)
      const remainder = maxCapacity % organizations.length

      const newLimits: Record<string, number> = {}
      let allocated = 0

      organizations.forEach((org, index) => {
        // Add one extra to the first 'remainder' organizations
        const value = index < remainder ? baseValue + 1 : baseValue
        newLimits[org] = value
        allocated += value
      })

      setLimits(newLimits)
      setTotalAllocated(allocated)
      setAutoDistribute(false)
    }
  }, [organizations, maxCapacity, currentLimits, autoDistribute])

  const handleLimitChange = (org: string, value: string) => {
    const numValue = Number.parseInt(value) || 0
    const newLimits = { ...limits, [org]: numValue }
    setLimits(newLimits)

    const newTotal = Object.values(newLimits).reduce((sum, val) => sum + val, 0)
    setTotalAllocated(newTotal)
  }

  const handleAutoDistribute = () => {
    const baseValue = Math.floor(maxCapacity / organizations.length)
    const remainder = maxCapacity % organizations.length

    const newLimits: Record<string, number> = {}
    let allocated = 0

    organizations.forEach((org, index) => {
      // Add one extra to the first 'remainder' organizations
      const value = index < remainder ? baseValue + 1 : baseValue
      newLimits[org] = value
      allocated += value
    })

    setLimits(newLimits)
    setTotalAllocated(allocated)
  }

  const handleSave = () => {
    if (totalAllocated !== maxCapacity) {
      toast({
        title: "Validation Error",
        description: `Total allocation (${totalAllocated}) must equal maximum capacity (${maxCapacity})`,
        variant: "destructive",
      })
      return
    }

    onSave(limits)
    onClose()
  }

  const getProgressColor = () => {
    if (totalAllocated === maxCapacity) return "bg-green-500"
    if (totalAllocated > maxCapacity) return "bg-red-500"
    return "bg-blue-500"
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl bg-zinc-950 border-zinc-800 text-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Organization Capacity Limits</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-zinc-400">
            Set capacity limits for each organization. The total must equal the maximum capacity ({maxCapacity}).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Allocated: {totalAllocated}</span>
              <span className={totalAllocated === maxCapacity ? "text-green-500" : "text-red-500"}>
                {totalAllocated === maxCapacity
                  ? "✓ Matches capacity"
                  : totalAllocated > maxCapacity
                    ? `${totalAllocated - maxCapacity} over capacity`
                    : `${maxCapacity - totalAllocated} remaining`}
              </span>
            </div>
            <Progress
              value={(totalAllocated / maxCapacity) * 100}
              className="h-2 bg-zinc-800"
              indicatorClassName={getProgressColor()}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {organizations.map((org) => (
              <div key={org} className="space-y-2">
                <Label htmlFor={`limit-${org}`} className="text-zinc-300">
                  {org}
                </Label>
                <Input
                  id={`limit-${org}`}
                  type="number"
                  min="0"
                  value={limits[org] || 0}
                  onChange={(e) => handleLimitChange(org, e.target.value)}
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleAutoDistribute} className="bg-zinc-900 border-zinc-800">
            Auto-Distribute
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose} className="bg-zinc-900 border-zinc-800">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={totalAllocated !== maxCapacity}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
            >
              Save Limits
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}


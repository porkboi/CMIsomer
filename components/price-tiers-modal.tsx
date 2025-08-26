"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { X, Plus, Trash2 } from "lucide-react"

export interface PriceTier {
  id: string
  name: string
  price: number
  capacity: number
}

interface PriceTiersModalProps {
  maxCapacity: number
  onClose: () => void
  onSave: (tiers: PriceTier[]) => void
  currentTiers?: PriceTier[]
}

export function PriceTiersModal({ maxCapacity, onClose, onSave, currentTiers = [] }: PriceTiersModalProps) {
  const { toast } = useToast()
  const [tiers, setTiers] = useState<PriceTier[]>([])
  const [totalCapacity, setTotalCapacity] = useState(0)

  // Initialize tiers with current values or create a default tier
  useEffect(() => {
    if (currentTiers.length > 0) {
      setTiers(currentTiers)
      setTotalCapacity(currentTiers.reduce((sum, tier) => sum + tier.capacity, 0))
    } else {
      // Create a default tier
      const defaultTier: PriceTier = {
        id: Date.now().toString(),
        name: "Standard",
        price: 15,
        capacity: maxCapacity,
      }
      setTiers([defaultTier])
      setTotalCapacity(maxCapacity)
    }
  }, [currentTiers, maxCapacity])

  const handleTierChange = (id: string, field: keyof PriceTier, value: string | number) => {
    const updatedTiers = tiers.map((tier) => {
      if (tier.id === id) {
        return {
          ...tier,
          [field]: typeof value === "string" && field === "capacity" ? Number.parseInt(value) || 0 : value,
        }
      }
      return tier
    })

    setTiers(updatedTiers)
    setTotalCapacity(updatedTiers.reduce((sum, tier) => sum + tier.capacity, 0))
  }

  const handleAddTier = () => {
    // Create a new tier with a unique ID
    const newTier: PriceTier = {
      id: Date.now().toString(),
      name: `Tier ${tiers.length + 1}`,
      price: 20,
      capacity: 0,
    }
    setTiers([...tiers, newTier])
  }

  const handleRemoveTier = (id: string) => {
    if (tiers.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "You must have at least one price tier",
        variant: "destructive",
      })
      return
    }

    const updatedTiers = tiers.filter((tier) => tier.id !== id)
    setTiers(updatedTiers)
    setTotalCapacity(updatedTiers.reduce((sum, tier) => sum + tier.capacity, 0))
  }

  const handleDistributeEvenly = () => {
    const baseCapacity = Math.floor(maxCapacity / tiers.length)
    const remainder = maxCapacity % tiers.length

    const updatedTiers = tiers.map((tier, index) => ({
      ...tier,
      capacity: index < remainder ? baseCapacity + 1 : baseCapacity,
    }))

    setTiers(updatedTiers)
    setTotalCapacity(maxCapacity)
  }

  const handleSave = () => {
    if (totalCapacity !== maxCapacity) {
      toast({
        title: "Validation Error",
        description: `Total capacity (${totalCapacity}) must equal maximum capacity (${maxCapacity})`,
        variant: "destructive",
      })
      return
    }

    onSave(tiers)
    onClose()
  }

  const getProgressColor = () => {
    if (totalCapacity === maxCapacity) return "bg-green-500"
    if (totalCapacity > maxCapacity) return "bg-red-500"
    return "bg-blue-500"
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl bg-zinc-950 border-zinc-800 text-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Price Tiers</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-zinc-400">
            Set up price tiers for your party. The total capacity must equal the maximum capacity ({maxCapacity}).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Capacity: {totalCapacity}</span>
              <span className={totalCapacity === maxCapacity ? "text-green-500" : "text-red-500"}>
                {totalCapacity === maxCapacity
                  ? "✓ Matches capacity"
                  : totalCapacity > maxCapacity
                    ? `${totalCapacity - maxCapacity} over capacity`
                    : `${maxCapacity - totalCapacity} remaining`}
              </span>
            </div>
            <Progress
              value={(totalCapacity / maxCapacity) * 100}
              className="h-2 bg-zinc-800"
              indicatorClassName={getProgressColor()}
            />
          </div>

          <div className="space-y-4">
            {tiers.map((tier) => (
              <div key={tier.id} className="grid grid-cols-12 gap-4 items-center p-3 rounded-md border border-zinc-800">
                <div className="col-span-3">
                  <Label htmlFor={`tier-name-${tier.id}`} className="text-zinc-300 mb-1 block">
                    Tier Name
                  </Label>
                  <Input
                    id={`tier-name-${tier.id}`}
                    value={tier.name}
                    onChange={(e) => handleTierChange(tier.id, "name", e.target.value)}
                    className="bg-zinc-900 border-zinc-800"
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor={`tier-price-${tier.id}`} className="text-zinc-300 mb-1 block">
                    Price ($)
                  </Label>
                  <Input
                    id={`tier-price-${tier.id}`}
                    type="number"
                    min="0"
                    value={tier.price}
                    onChange={(e) => handleTierChange(tier.id, "price", Number.parseFloat(e.target.value) || 0)}
                    className="bg-zinc-900 border-zinc-800"
                  />
                </div>
                <div className="col-span-4">
                  <Label htmlFor={`tier-capacity-${tier.id}`} className="text-zinc-300 mb-1 block">
                    Capacity
                  </Label>
                  <Input
                    id={`tier-capacity-${tier.id}`}
                    type="number"
                    min="0"
                    value={tier.capacity}
                    onChange={(e) => handleTierChange(tier.id, "capacity", e.target.value)}
                    className="bg-zinc-900 border-zinc-800"
                  />
                </div>
                <div className="col-span-2 flex justify-end items-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTier(tier.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={handleAddTier} className="bg-zinc-900 border-zinc-800 w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Price Tier
          </Button>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleDistributeEvenly} className="bg-zinc-900 border-zinc-800">
            Distribute Evenly
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose} className="bg-zinc-900 border-zinc-800">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={totalCapacity !== maxCapacity}
              className="bg-linear-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
            >
              Save Price Tiers
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}


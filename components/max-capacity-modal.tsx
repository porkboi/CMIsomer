"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { X } from "lucide-react"

interface MaxCapacityModalProps {
  currentCapacity: number
  confirmedCount: number
  onClose: () => void
  onSave: (newCapacity: number) => void
}

export function MaxCapacityModal({ currentCapacity, confirmedCount, onClose, onSave }: MaxCapacityModalProps) {
  const { toast } = useToast()
  const [newCapacity, setNewCapacity] = useState(currentCapacity)

  const handleCapacityChange = (value: string) => {
    const numValue = Number.parseInt(value) || 0
    setNewCapacity(numValue)
  }

  const handleSave = () => {
    if (newCapacity < 1) {
      toast({
        title: "Validation Error",
        description: "Maximum capacity must be at least 1",
        variant: "destructive",
      })
      return
    }

    if (newCapacity < confirmedCount) {
      toast({
        title: "Validation Error",
        description: `New capacity (${newCapacity}) cannot be less than current confirmed registrations (${confirmedCount})`,
        variant: "destructive",
      })
      return
    }

    onSave(newCapacity)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-zinc-950 border-zinc-800 text-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Update Maximum Capacity</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-zinc-400">
            Set the maximum number of attendees for this party.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max-capacity" className="text-zinc-300">
              Maximum Capacity
            </Label>
            <Input
              id="max-capacity"
              type="number"
              min={confirmedCount}
              value={newCapacity}
              onChange={(e) => handleCapacityChange(e.target.value)}
              className="bg-zinc-900 border-zinc-800"
            />
            <p className="text-xs text-zinc-400">Current confirmed registrations: {confirmedCount}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} className="bg-zinc-900 border-zinc-800">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={newCapacity === currentCapacity || newCapacity < confirmedCount}
            className="bg-linear-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}


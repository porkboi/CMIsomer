import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface EditPartyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (partyData: { name: string; date: string; location: string }) => void
}

export function EditPartyModal({ isOpen, onClose, onSave }: EditPartyModalProps) {
  const [partyName, setPartyName] = useState("")
  const [partyDate, setPartyDate] = useState("")
  const [partyLocation, setPartyLocation] = useState("")

  const handleSave = () => {
    onSave({
      name: partyName,
      date: partyDate,
      location: partyLocation,
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle>Edit Party Details</CardTitle>
          <CardDescription>Update party information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Party Name"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            className="bg-zinc-900 border-zinc-800"
          />
          <Input
            placeholder="Party Date"
            type="date"
            value={partyDate}
            onChange={(e) => setPartyDate(e.target.value)}
            className="bg-zinc-900 border-zinc-800"
          />
          <Input
            placeholder="Party Location"
            value={partyLocation}
            onChange={(e) => setPartyLocation(e.target.value)}
            className="bg-zinc-900 border-zinc-800"
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSave}>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
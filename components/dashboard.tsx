"use client"

import { useState, useCallback, useMemo, useEffect, type ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Users, UserCheck, Filter, RefreshCw, Scan, Settings, DollarSign, Users2, Pencil, Check, X, ArrowUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getRegistrations,
  getOrgAllocation,
  getTimeslotSelections,
  promoteFromWaitlist,
  removeFromList,
  verifyQRCode,
  updateOrgLimits,
  getPriceTiers,
  updatePriceTiers,
  updateMaxCapacity,
  addPromoCode,
  confirmAttendance,
  checkInGuest,
  setWaitlistStatus,
  updatePartyDetails,
  updateRegistrationEntry,
} from "@/lib/actions"
import { OrgLimitsModal } from "./org-limits-modal"
import { PriceTiersModal, type PriceTier } from "./price-tiers-modal"
import { MaxCapacityModal } from "./max-capacity-modal"
import { EditPartyModal } from "./edit-party-modal"
import { QRScanner } from "./qr-scanner"
import { Party } from "@/lib/types"

interface DashboardData {
  registrations: Registration[]
  orgAllocation: any[]
  priceTiers: PriceTier[]
  orgLimits: Record<string, number>
  timeslotSelections: { confirmed: Record<string, number>; pending: Record<string, number> }
}

interface DashboardProps {
  party: Party
  partySlug: string
  initialData: DashboardData
}

interface Registration {
  id: number
  name: string
  andrew_id: string
  age: number
  organization: string
  status: "confirmed" | "waitlist" | "pending"
  payment_method: string
  tierName?: string
  tierPrice?: number
  price: number
  timeslot?: string
  checked_in: boolean
  created_at?: string
}

// Group registrations into hourly buckets based on created_at
// Buckets registrations per hour and returns cumulative totals
const bucketRegistrationsByHour = (regs: Registration[]) => {
  const bucketMs = 60 * 60 * 1000 // 1 hour
  const buckets: Record<number, number> = {}

  regs.forEach((reg) => {
    if (!reg.created_at) return
    const ts = new Date(reg.created_at).getTime()
    if (Number.isNaN(ts)) return
    const bucketStart = Math.floor(ts / bucketMs) * bucketMs
    buckets[bucketStart] = (buckets[bucketStart] || 0) + 1
  })

  const sortedBuckets = Object.entries(buckets)
    .map(([bucketStart, count]) => ({
      bucket: Number(bucketStart),
      count,
    }))
    .sort((a, b) => a.bucket - b.bucket)

  let runningTotal = 0

  return sortedBuckets.map(({ bucket, count }) => {
    runningTotal += count
    const date = new Date(bucket)
    const label = date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      hour12: true,
    })

    return { bucket, time: label, cumulative: runningTotal }
  })
}

// Helper components for repeated UI blocks
interface RegistrationRowProps {
  reg: Registration
  actions: ReactNode[]
  columns?: number
  colorClass?: string
}

const RegistrationRow = ({ reg, actions, columns = 8, colorClass = "" }: RegistrationRowProps) => (
  <div className={`grid ${columns === 7 ? "grid-cols-7" : "grid-cols-8"} gap-4 p-4 text-white ${colorClass}`}>
    <div>{reg.name}</div>
    <div>{reg.andrew_id}</div>
    <div>{reg.age}</div>
    <div>
      <Badge variant="outline" className="bg-zinc-900 border-zinc-700">
        {reg.organization}
      </Badge>
    </div>
    <div>
      {reg.tierName ? (
        <Badge className="bg-purple-900/50 text-purple-300 border-purple-700">
          {reg.tierName} (${reg.tierPrice || reg.price})
        </Badge>
      ) : (
        <span>${reg.price}</span>
      )}
    </div>
    <div className="capitalize">{reg.payment_method}</div>
    <div className="capitalize">{reg.timeslot}</div>
    <div className="flex gap-2">{actions}</div>
  </div>
)

interface EditEntryModalProps {
  isOpen: boolean
  registration: Registration | null
  organizations: string[]
  schedule: string[]
  onClose: () => void
  onSave: (registration: Registration) => Promise<void>
}

const EditEntryModal = ({ isOpen, registration, organizations, schedule, onClose, onSave }: EditEntryModalProps) => {
  const [form, setForm] = useState<Registration | null>(registration)

  useEffect(() => {
    setForm(registration)
  }, [registration])

  if (!isOpen || !form) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-xl bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Edit Entry</CardTitle>
          <CardDescription className="text-zinc-400">Update registration details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
            className="bg-zinc-900 border-zinc-800"
          />
          <Input
            value={form.andrew_id}
            onChange={(e) => setForm({ ...form, andrew_id: e.target.value })}
            placeholder="Andrew ID"
            className="bg-zinc-900 border-zinc-800"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min={18}
              value={form.age}
              onChange={(e) => setForm({ ...form, age: Number.parseInt(e.target.value || "18", 10) })}
              placeholder="Age"
              className="bg-zinc-900 border-zinc-800"
            />
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number.parseInt(e.target.value || "0", 10) })}
              placeholder="Price"
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
          <select
            value={form.organization}
            onChange={(e) => setForm({ ...form, organization: e.target.value })}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
          >
            {organizations.map((org) => (
              <option key={org} value={org}>
                {org}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-3">
            <select
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
            >
              <option value="venmo">venmo</option>
              <option value="zelle">zelle</option>
            </select>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as Registration["status"] })
              }
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
            >
              <option value="confirmed">confirmed</option>
              <option value="pending">pending</option>
              <option value="waitlist">waitlist</option>
            </select>
            <select
              value={form.timeslot || ""}
              onChange={(e) => setForm({ ...form, timeslot: e.target.value })}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
            >
              <option value="">No timeslot</option>
              {schedule.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
        <div className="flex justify-end gap-2 p-6 pt-0">
          <Button variant="outline" onClick={onClose} className="bg-zinc-900 border-zinc-800">
            Cancel
          </Button>
          <Button variant="outline" onClick={() => onSave(form)} className="bg-zinc-900 border-zinc-800">
            Save
          </Button>
        </div>
      </Card>
    </div>
  )
}

export function Dashboard({ party, partySlug, initialData }: DashboardProps) {
  const organizations = party.organizations
  const maxCapacity = party.max_capacity
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredOrgs, setFilteredOrgs] = useState<string[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>(initialData.registrations)
  const [orgAllocation, setOrgAllocation] = useState<any[]>(initialData.orgAllocation)
  const [timeslotSelections, setTimeslotSelections] = useState(initialData.timeslotSelections)
  const [showScanner, setShowScanner] = useState(false)
  const [showOrgLimitsModal, setShowOrgLimitsModal] = useState(false)
  const [showPriceTiersModal, setShowPriceTiersModal] = useState(false)
  const [orgLimits, setOrgLimits] = useState<Record<string, number>>(initialData.orgLimits)
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>(initialData.priceTiers)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showMaxCapacityModal, setShowMaxCapacityModal] = useState(false)
  const [showPartyModal, setShowPartyModal] = useState(false)
  const [showEditEntryModal, setShowEditEntryModal] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [newPromo, setNewPromo] = useState<string>("")
  const [allowWaitlist, setAllowWaitlist] = useState<boolean>(party.allow_waitlist)
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
  const { toast } = useToast()

  const withLoading = useCallback(async <T,>(message: string, action: () => Promise<T>) => {
    setLoadingMessage(message)
    try {
      return await action()
    } finally {
      setLoadingMessage(null)
    }
  }, [])
  const generatePromoCode = (length = 5) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return Array.from({ length }).map(() => chars[Math.floor(Math.random() * chars.length)]).join("")
  }

  const handleGeneratePromo = useCallback(async () => {
    const code = generatePromoCode(5)
    setNewPromo(code)
    try {
      const result = await withLoading("Generating promo code...", () => addPromoCode(partySlug, code))
      if (!result?.success) {
        toast({
          title: "Failed to add promo code",
          description: result?.message || "Server error",
          variant: "destructive",
        })
        return
      }
      toast({ title: "Promo code created", description: code })
    } catch (error) {
      toast({ title: "Error", description: "Unable to create promo code", variant: "destructive" })
    }
  }, [partySlug, toast, withLoading])

  const handleCloseWaitlist = useCallback(async () => {
    try {
      const result = await withLoading("Closing waitlist...", () => setWaitlistStatus(partySlug, false))
      if (!result?.success) {
        toast({
          title: "Failed to close waitlist",
          description: result?.message || "Server error",
          variant: "destructive",
        })
        return
      }
      setAllowWaitlist(false)
      toast({
        title: "Waitlist closed",
        description: "New waitlist signups are disabled.",
      })
    } catch (error) {
      toast({ title: "Error", description: "Unable to update waitlist status", variant: "destructive" })
    }
  }, [partySlug, toast, withLoading])

  // Data fetching logic
  const fetchData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const [newRegistrations, newOrgAllocation, newPriceTiers, newTimeslotSelections] = await withLoading(
        "Refreshing dashboard data...",
        () =>
          Promise.all([
            getRegistrations(partySlug),
            getOrgAllocation(partySlug),
            getPriceTiers(partySlug),
            getTimeslotSelections(partySlug),
          ]),
      )

      // Get organization limits from orgAllocation data
      const newOrgLimits: Record<string, number> = {}
      newOrgAllocation.forEach((item: any) => {
        newOrgLimits[item.name] = item.total
      })

      setRegistrations(newRegistrations)
      setOrgAllocation(newOrgAllocation)
      setPriceTiers(newPriceTiers)
      setOrgLimits(newOrgLimits)
      setTimeslotSelections(newTimeslotSelections)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [partySlug, toast, withLoading])

  const handleRefresh = () => {
    fetchData()
  }

  const handleScan = async (data: string) => {
    try {
      const result = await withLoading("Verifying QR code...", () => verifyQRCode(partySlug, data))
      if (result.success) {
        toast({
          title: "Valid Registration",
          description: `Verified: ${result.registration.name} (${result.registration.andrew_id})`,
          variant: "default",
        })
        await withLoading("Checking in guest...", () => checkInGuest(partySlug, result.registration.name))
      } else {
        toast({
          title: "Invalid QR Code",
          description: result.message,
          variant: "destructive",
        })
      }
      setShowScanner(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify QR code",
        variant: "destructive",
      })
      setShowScanner(false)
    }
  }

  const handleRemoveFromList = async (id: number) => {
    const result = await withLoading("Removing entry...", () => removeFromList(partySlug, id))
    if (result.success) {
      toast({
        title: "Success",
        description: "Registration removed from list",
        variant: "default",
      })
      handleRefresh()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const handlePromoteFromWaitlist = async (andrew_id: string) => {
    const result = await withLoading("Promoting from waitlist...", () => promoteFromWaitlist(partySlug, andrew_id))
    if (result.success) {
      toast({
        title: "Success",
        description: "Registration promoted to confirmed",
        variant: "default",
      })
      handleRefresh()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const handleSaveOrgLimits = async (limits: Record<string, number>) => {
    try {
      const result = await withLoading("Saving organization limits...", () => updateOrgLimits(partySlug, limits))
      if (result.success) {
        toast({
          title: "Success",
          description: "Organization limits updated successfully",
          variant: "default",
        })
        setOrgLimits(limits)
        const orgAllocationData = await withLoading("Refreshing organization allocations...", () =>
          getOrgAllocation(partySlug),
        )
        setOrgAllocation(orgAllocationData)

        setShowOrgLimitsModal(false)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update organization limits",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleSavePriceTiers = async (tiers: PriceTier[]) => {
    try {
      const result = await withLoading("Saving price tiers...", () => updatePriceTiers(partySlug, tiers))
      if (result.success) {
        toast({
          title: "Success",
          description: "Price tiers updated successfully",
          variant: "default",
        })
        setPriceTiers(tiers)
        handleRefresh()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update price tiers",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleSaveMaxCapacity = async (newCapacity: number) => {
    try {
      const result = await withLoading("Saving max capacity...", () => updateMaxCapacity(partySlug, newCapacity))
      if (result.success) {
        toast({
          title: "Success",
          description: "Maximum capacity updated successfully",
          variant: "default",
        })
        setShowMaxCapacityModal(false)
        // Force a refresh to update the UI
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update maximum capacity",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }
  const handleSavePartyDetails = async (partyData: { name: string; date: string; location: string }) => {
    try {
      const result = await withLoading("Saving party details...", () => updatePartyDetails(partySlug, partyData))
      if (result.success) {
        toast({
          title: "Success",
          description: "Party details updated successfully",
          variant: "default",
        })
        setShowPartyModal(false)
        // Refresh the page to show updated data
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update party details",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleEditEntry = (registration: Registration) => {
    setSelectedRegistration(registration)
    setShowEditEntryModal(true)
  }

  const handleSaveEntry = async (registration: Registration) => {
    try {
      const result = await withLoading("Saving entry...", () =>
        updateRegistrationEntry(partySlug, {
          id: registration.id,
          name: registration.name,
          andrew_id: registration.andrew_id,
          age: registration.age,
          organization: registration.organization,
          payment_method: registration.payment_method,
          timeslot: registration.timeslot || "",
          status: registration.status,
          price: registration.price,
        }),
      )

      if (result.success) {
        toast({ title: "Success", description: "Entry updated", variant: "default" })
        setShowEditEntryModal(false)
        setSelectedRegistration(null)
        handleRefresh()
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update entry", variant: "destructive" })
    }
  }

  // Memoized derived data
  const confirmedRegistrations = useMemo(() => registrations.filter((reg) => reg.status === "confirmed"), [registrations]);
  const waitlistedRegistrations = useMemo(() => registrations.filter((reg) => reg.status === "waitlist"), [registrations]);
  const pendingRegistrations = useMemo(() => registrations.filter((reg) => reg.status === "pending"), [registrations]);
  const venmoList = useMemo(() => confirmedRegistrations.filter((reg) => reg.payment_method === "venmo"), [confirmedRegistrations]);
  const zelleList = useMemo(() => confirmedRegistrations.filter((reg) => reg.payment_method === "zelle"), [confirmedRegistrations]);
  const checkedIn = useMemo(() => registrations.filter((reg) => reg.checked_in === true), [registrations]);
  const totalMoney = useMemo(() => confirmedRegistrations.reduce((sum, reg) => sum + reg.price, 0), [confirmedRegistrations]);
  const venmoMoney = useMemo(() => venmoList.reduce((sum, reg) => sum + reg.price, 0), [venmoList]);
  const zelleMoney = useMemo(() => zelleList.reduce((sum, reg) => sum + reg.price, 0), [zelleList]);
  const timeslotData = useMemo(() => {
    const slots = new Set<string>([
      ...(party.schedule || []),
      ...Object.keys(timeslotSelections.confirmed || {}),
      ...Object.keys(timeslotSelections.pending || {}),
    ])

    return Array.from(slots).map((slot) => ({
      name: slot,
      confirmed: timeslotSelections.confirmed?.[slot] || 0,
      pending: timeslotSelections.pending?.[slot] || 0,
    }))
  }, [party.schedule, timeslotSelections]);
  const registrationTrend = useMemo(() => bucketRegistrationsByHour(registrations), [registrations]);
  const formatRegistrationTime = (value: number | string) =>
    new Date(Number(value)).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      hour12: true,
    })

  // Filtering logic
  const filterRegs = useCallback(
    (regs: Registration[]) =>
      regs.filter((reg) => {
        const matchesSearch =
          reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reg.andrew_id.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesOrg = filteredOrgs.length === 0 || filteredOrgs.includes(reg.organization)
        return matchesSearch && matchesOrg
      }),
    [searchTerm, filteredOrgs],
  )

  const filteredConfirmed = filterRegs(confirmedRegistrations);
  const filteredWaitlist = filterRegs(waitlistedRegistrations);
  const filteredPending = filterRegs(pendingRegistrations);

  // Calculate tier progress based on dynamic price tiers  const tierData =
    priceTiers.length > 0
      ? priceTiers.map((tier) => {
          const count = confirmedRegistrations.length <= tier.capacity ? confirmedRegistrations.length : tier.capacity
          return {
            name: tier.name,
            count,
            capacity: tier.capacity,
          }
        })
      : [
          {
            name: "Standard",
            count: confirmedRegistrations.length,
            capacity: maxCapacity,
          },
        ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="bg-zinc-900 border-zinc-800">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button variant="outline" onClick={() => setShowScanner(true)} className="bg-zinc-900 border-zinc-800">
            <Scan className="mr-2 h-4 w-4" />
            Scan QR Code
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-zinc-900 border-zinc-800"
            onClick = {() => setShowPartyModal(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Party Details
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowMaxCapacityModal(true)}
            className="bg-zinc-900 border-zinc-800"
          >
            <Users2 className="mr-2 h-4 w-4" />
            Max Capacity
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPriceTiersModal(true)}
            className="bg-zinc-900 border-zinc-800"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Price Tiers
          </Button>
          <Button variant="outline" onClick={() => setShowOrgLimitsModal(true)} className="bg-zinc-900 border-zinc-800">
            <Settings className="mr-2 h-4 w-4" />
            Organization Limits
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{registrations.length}</div>
            <p className="text-xs text-zinc-400">
              {confirmedRegistrations.length} confirmed, {waitlistedRegistrations.length} waitlisted,{" "}
              {pendingRegistrations.length} pending
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Checked In</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{checkedIn.length}</div>
            <p className="text-xs text-zinc-400">
              {Math.round(checkedIn.length/confirmedRegistrations.length)*100}% of confirmed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Spots Remaining</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{maxCapacity - confirmedRegistrations.length}</div>
            <p className="text-xs text-zinc-400">Out of {maxCapacity} total capacity</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Money Received</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${totalMoney}</div>
            <p className="text-xs text-zinc-400">Venmo: ${venmoMoney} | Zelle: ${zelleMoney}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleGeneratePromo}
          className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Generate Promo
        </button>
        <div className="w-28 h-10 bg-zinc-900 text-white flex items-center justify-center rounded border border-zinc-700 font-mono">
            {newPromo || "—"}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCloseWaitlist}
          disabled={!allowWaitlist}
          className="px-3 py-1 rounded bg-red-600 hover:bg-amber-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Close Waitlist
        </button>
        <div className="w-28 h-10 bg-zinc-900 text-white flex items-center justify-center rounded border border-zinc-700 font-mono">
          {allowWaitlist ? "Open" : "Closed"}
        </div>
      </div>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Organization Allocation</CardTitle>
          <CardDescription className="text-white">Distribution of registrations by organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-200">
            <ChartContainer
              config={{
                confirmed: {
                  label: "Confirmed",
                  color: "purple",
                },
                waitlisted: {
                  label: "Waitlisted",
                  color: "blue",
                },
                limit: {
                  label: "Capacity Limit",
                  color: "white",
                },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={orgAllocation.map((item) => ({
                    name: item.name,
                    confirmed: item.used,
                    waitlisted: waitlistedRegistrations.filter((reg) => reg.organization === item.name).length,
                    limit: item.total,
                  }))}
                  layout="vertical"
                >
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={50} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="confirmed" stackId="a" fill="purple" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pending" stackId="a" fill="pink" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="waitlisted" stackId="a" fill="blue" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="limit" fill="none" stroke="white" strokeWidth={2} strokeDasharray="5 5" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Registrations Over Time</CardTitle>
          <CardDescription className="text-white">Cumulative total registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              registrations: { label: "Registrations", color: "#a855f7" },
            }}
            className="h-[320px]"
          >
            <LineChart data={registrationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                type="number"
                dataKey="bucket"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tick={{ fill: "#a1a1aa" }}
                tickFormatter={formatRegistrationTime}
              />
              <YAxis tick={{ fill: "#a1a1aa" }} allowDecimals={false} />
              <Tooltip content={<ChartTooltipContent labelFormatter={formatRegistrationTime} />} />
              <Line
                type="basis"
                dataKey="cumulative"
                stroke="var(--color-registrations)"
                strokeWidth={2}
                dot={(props: any) => (
                  <circle
                    key={`reg-dot-${props.payload?.bucket ?? "na"}-${props.index}`}
                    cx={props.cx}
                    cy={props.cy}
                    r={props.index % 10 === 0 ? 3 : 0}
                    stroke={props.index % 10 === 0 ? "#fff" : "none"}
                    strokeWidth={props.index % 10 === 0 ? 1 : 0}
                    fill={props.index % 10 === 0 ? "var(--color-registrations)" : "transparent"}
                  />
                )}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {party.enableSchedule && timeslotData.length > 0 && (
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Timeslot Selection</CardTitle>
            <CardDescription className="text-white">Confirmed vs pending selections per slot</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-200">
              <ChartContainer
                config={{
                  confirmed: {
                    label: "Confirmed",
                    color: "purple",
                  },
                  pending: {
                    label: "Pending",
                    color: "pink",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={timeslotData}
                    layout="vertical"
                  >
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="confirmed" stackId="a" fill="purple" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="pending" stackId="a" fill="pink" radius={[0, 0, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Search by name or Andrew ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-zinc-900 border-zinc-800"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-zinc-900 border-zinc-800">
              <Filter className="mr-2 h-4 w-4" />
              Filter Organizations
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800">
            {organizations.map((org) => (
              <DropdownMenuCheckboxItem
                key={org}
                checked={filteredOrgs.includes(org)}
                onCheckedChange={(checked) => {
                  setFilteredOrgs(checked ? [...filteredOrgs, org] : filteredOrgs.filter((item) => item !== org))
                }}
              >
                {org}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="confirmed" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-900">
          <TabsTrigger value="confirmed">Confirmed ({filteredConfirmed.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({filteredPending.length})</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist ({filteredWaitlist.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="confirmed" className="mt-4">
          <div className="rounded-md border border-zinc-800 bg-zinc-950">
            <div className="grid grid-cols-8 gap-4 p-4 font-medium text-zinc-400 border-b border-zinc-800">
              <div>Name</div>
              <div>Andrew ID</div>
              <div>Age</div>
              <div>Organization</div>
              <div>Tier</div>
              <div>Payment</div>
              <div>Timeslot</div>
              <div>Actions</div>
            </div>
            <div className="divide-y divide-zinc-800">
              {filteredConfirmed.length > 0 ? (
                filteredConfirmed.map((reg) => (
                  <RegistrationRow
                    key={reg.id}
                    reg={reg}
                    actions={[
                      reg.status === "pending" && (
                        <Button
                          key="confirm"
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const result = await withLoading("Confirming attendee...", () =>
                              confirmAttendance(partySlug, reg.id, reg.andrew_id),
                            )
                            if (result.success) {
                              toast({ title: "Success", description: result.message, variant: "default" })
                              handleRefresh()
                            } else {
                              toast({ title: "Error", description: result.message, variant: "destructive" })
                            }
                          }}
                          className="bg-green-900/20 hover:bg-green-900/40"
                          aria-label="Confirm entry"
                          title="Confirm"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      ),
                      <Button
                        key="edit"
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditEntry(reg)}
                        className="bg-zinc-900/50 hover:bg-zinc-800/70"
                        aria-label="Edit entry"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>,
                      <Button
                        key="remove"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFromList(reg.id)}
                        className="bg-red-900/20 hover:bg-red-900/40"
                        aria-label="Remove entry"
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ]}
                  />
                ))
              ) : (
                <div className="p-4 text-center text-zinc-500">No confirmed registrations found</div>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <div className="rounded-md border border-zinc-800 bg-zinc-950">
            <div className="grid grid-cols-8 gap-4 p-4 font-medium text-zinc-400 border-b border-zinc-800">
              <div>Name</div>
              <div>Andrew ID</div>
              <div>Age</div>
              <div>Organization</div>
              <div>Tier</div>
              <div>Payment</div>
              <div>Timeslot</div>
              <div>Actions</div>
            </div>
            <div className="divide-y divide-zinc-800">
              {filteredPending.length > 0 ? (
                filteredPending.map((reg) => (
                  <RegistrationRow
                    key={reg.id}
                    reg={reg}
                    actions={[
                      <Button
                        key="confirm"
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const result = await withLoading("Confirming attendee...", () =>
                            confirmAttendance(partySlug, reg.id, reg.andrew_id),
                          )
                          if (result.success) {
                            toast({ title: "Success", description: result.message, variant: "default" })
                            handleRefresh()
                          } else {
                            toast({ title: "Error", description: result.message, variant: "destructive" })
                          }
                        }}
                        className="bg-green-900/20 hover:bg-green-900/40"
                        aria-label="Confirm entry"
                        title="Confirm"
                      >
                        <Check className="h-4 w-4" />
                      </Button>,
                      <Button
                        key="edit"
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditEntry(reg)}
                        className="bg-zinc-900/50 hover:bg-zinc-800/70"
                        aria-label="Edit entry"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>,
                      <Button
                        key="remove"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFromList(reg.id)}
                        className="bg-red-900/20 hover:bg-red-900/40"
                        aria-label="Remove entry"
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ]}
                  />
                ))
              ) : (
                <div className="p-4 text-center text-zinc-500">No pending registrations found</div>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="waitlist" className="mt-4">
          <div className="rounded-md border border-zinc-800 bg-zinc-950">
            <div className="grid grid-cols-8 gap-4 p-4 font-medium text-zinc-400 border-b border-zinc-800">
              <div>Name</div>
              <div>Andrew ID</div>
              <div>Age</div>
              <div>Organization</div>
              <div>Tier</div>
              <div>Payment</div>
              <div>Timeslot</div>
              <div>Actions</div>
            </div>
            <div className="divide-y divide-zinc-800">
              {filteredWaitlist.length > 0 ? (
                filteredWaitlist.map((reg) => (
                  <RegistrationRow
                    key={reg.id}
                    reg={reg}
                    columns={8}
                    colorClass="text-zinc-400 bg-zinc-900/20"
                    actions={[
                      <Button
                        key="promote"
                        size="sm"
                        variant="outline"
                        onClick={() => handlePromoteFromWaitlist(reg.andrew_id)}
                        className="bg-yellow-900/30 hover:bg-yellow-900/50"
                        aria-label="Promote entry"
                        title="Promote"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>,
                      <Button
                        key="edit"
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditEntry(reg)}
                        className="bg-zinc-900/50 hover:bg-zinc-800/70"
                        aria-label="Edit entry"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>,
                      <Button
                        key="remove"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFromList(reg.id)}
                        className="bg-red-900/20 hover:bg-red-900/40"
                        aria-label="Remove entry"
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ]}
                  />
                ))
              ) : (
                <div className="p-4 text-center text-zinc-500">No waitlisted registrations found</div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />

      <EditEntryModal
        isOpen={showEditEntryModal}
        registration={selectedRegistration}
        organizations={organizations}
        schedule={party.schedule || []}
        onClose={() => {
          setShowEditEntryModal(false)
          setSelectedRegistration(null)
        }}
        onSave={handleSaveEntry}
      />

      {showOrgLimitsModal && (
        <OrgLimitsModal
          organizations={organizations}
          maxCapacity={maxCapacity}
          onClose={() => setShowOrgLimitsModal(false)}
          onSave={handleSaveOrgLimits}
          currentLimits={orgLimits}
        />
      )}

      {showPriceTiersModal && (
        <PriceTiersModal
          maxCapacity={maxCapacity}
          onClose={() => setShowPriceTiersModal(false)}
          onSave={handleSavePriceTiers}
          currentTiers={priceTiers}
        />
      )}

      {showMaxCapacityModal && (
        <MaxCapacityModal
          currentCapacity={maxCapacity}
          confirmedCount={confirmedRegistrations.length}
          onClose={() => setShowMaxCapacityModal(false)}
          onSave={handleSaveMaxCapacity}
        />      )}

        <EditPartyModal
        isOpen={showPartyModal}
        onClose={() => setShowPartyModal(false)}
        onSave={handleSavePartyDetails}
        party={party}
      />

      <Toaster />

      {loadingMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-sm bg-zinc-950 border-zinc-800">
            <CardContent className="flex items-center gap-3 p-6">
              <RefreshCw className="h-5 w-5 animate-spin text-purple-400" />
              <p className="text-sm text-white">{loadingMessage}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

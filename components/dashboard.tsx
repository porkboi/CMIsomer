"use client"

import { useState, useCallback, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Users, UserCheck, Clock, Filter, RefreshCw, Scan, Settings, DollarSign, Users2, Pencil } from "lucide-react"
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
  removeFromWaitlist,
  promoteFromWaitlist,
  removeFromList,
  verifyQRCode,
  updateOrgLimits,
  getPriceTiers,
  updatePriceTiers,
  updateMaxCapacity,
  updatePartyDetails,
  addPromoCode
  confirmAttendance,
  checkInGuest,
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
  checked_in: boolean
}

// Helper components for repeated UI blocks
const RegistrationRow = ({ reg, actions, columns = 8, colorClass = "" }) => (
  <div className={`grid grid-cols-${columns} gap-4 p-4 text-white ${colorClass}`}>
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
    {columns === 8 && (
      <div>
        <Badge
          className={
            reg.status === "confirmed"
              ? "bg-green-900/50 text-green-300 border-green-700"
              : reg.status === "pending"
              ? "bg-yellow-900/50 text-yellow-300 border-yellow-700"
              : "bg-red-900/50 text-red-300 border-red-700"
          }
        >
          {reg.status}
        </Badge>
      </div>
    )}
    <div className="flex gap-2">{actions}</div>
  </div>
)

export function Dashboard({ party, partySlug, initialData }: DashboardProps) {
  const organizations = party.organizations
  const maxCapacity = party.max_capacity
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredOrgs, setFilteredOrgs] = useState<string[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>(initialData.registrations)
  const [orgAllocation, setOrgAllocation] = useState<any[]>(initialData.orgAllocation)
  const [showScanner, setShowScanner] = useState(false)
  const [showOrgLimitsModal, setShowOrgLimitsModal] = useState(false)
  const [showPriceTiersModal, setShowPriceTiersModal] = useState(false)
  const [orgLimits, setOrgLimits] = useState<Record<string, number>>(initialData.orgLimits)
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>(initialData.priceTiers)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showMaxCapacityModal, setShowMaxCapacityModal] = useState(false)
  const [showPartyModal, setShowPartyModal] = useState(false)
  const [newPromo, setNewPromo] = useState<string>("")
  const { toast } = useToast()
  const generatePromoCode = (length = 5) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return Array.from({ length }).map(() => chars[Math.floor(Math.random() * chars.length)]).join("")
  }
  const handleGeneratePromo = useCallback(async () => {
    const code = generatePromoCode(5)
    setNewPromo(code)
    try {
      const result = await addPromoCode(partySlug, code)
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
  }, [partySlug, toast, addPromoCode])

  // Data fetching logic
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [newRegistrations, newOrgAllocation, newPriceTiers] = await Promise.all([
        getRegistrations(partySlug),
        getOrgAllocation(partySlug),
        getPriceTiers(partySlug),
      ]);

      // Get organization limits from orgAllocation data
      const newOrgLimits: Record<string, number> = {};
      newOrgAllocation.forEach((item: any) => {
        newOrgLimits[item.name] = item.total;
      });

      setRegistrations(newRegistrations);
      setOrgAllocation(newOrgAllocation);
      setPriceTiers(newPriceTiers);
      setOrgLimits(newOrgLimits);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }  }, [partySlug, toast]);

  const handleRefresh = () => {
    fetchData()
  }

  const handleScan = async (data: string) => {
    try {
      const result = await verifyQRCode(partySlug, data)
      if (result.success) {
        toast({
          title: "Valid Registration",
          description: `Verified: ${result.registration.name} (${result.registration.andrew_id})`,
          variant: "default",
        })
        checkInGuest(partySlug, result.registration.name)
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
    console.log(id)
    const result = await removeFromList(partySlug, id)
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

  const handleRemoveFromWaitlist = async (andrew_id: string) => {
    const result = await removeFromWaitlist(partySlug, andrew_id)
    if (result.success) {
      toast({
        title: "Success",
        description: "Registration removed from waitlist",
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
    const result = await promoteFromWaitlist(partySlug, andrew_id)
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
      const result = await updateOrgLimits(partySlug, limits)
      if (result.success) {
        toast({
          title: "Success",
          description: "Organization limits updated successfully",
          variant: "default",
        })
        setOrgLimits(limits)
        const orgAllocationData = await getOrgAllocation(partySlug)
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
      const result = await updatePriceTiers(partySlug, tiers)
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
      const result = await updateMaxCapacity(partySlug, newCapacity)
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
      const result = await updatePartyDetails(partySlug, partyData)
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

  // Memoized derived data
  const confirmedRegistrations = useMemo(() => registrations.filter((reg) => reg.status === "confirmed"), [registrations]);
  const waitlistedRegistrations = useMemo(() => registrations.filter((reg) => reg.status === "waitlist"), [registrations]);
  const pendingRegistrations = useMemo(() => registrations.filter((reg) => reg.status === "pending"), [registrations]);
  const checkedIn = useMemo(() => registrations.filter((reg) => reg.checked_in === true), [registrations]);

  // Filtering logic
  const filterRegs = useCallback((regs) => regs.filter((reg) => {
    const matchesSearch =
      reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.andrew_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrg = filteredOrgs.length === 0 || filteredOrgs.includes(reg.organization);
    return matchesSearch && matchesOrg;
  }), [searchTerm, filteredOrgs]);

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
            <CardTitle className="text-sm font-medium text-white">Confirmed</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{confirmedRegistrations.length}</div>
            <p className="text-xs text-zinc-400">
              {Math.round((confirmedRegistrations.length / maxCapacity) * 100)}% of capacity
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
            <CardTitle className="text-sm font-medium text-white">Waitlisted</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{waitlistedRegistrations.length}</div>
            <p className="text-xs text-zinc-400">May be admitted if spots open up</p>
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
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleGeneratePromo}
          className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Generate Promo
        </button>
      </div>

      <div className="w-28 h-10 bg-zinc-900 text-white flex items-center justify-center rounded border border-zinc-700 font-mono">
          {newPromo || "—"}
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
              <div>Status</div>
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
                            const result = await confirmAttendance(partySlug, reg.name, reg.andrew_id);
                            if (result.success) {
                              toast({ title: "Success", description: result.message, variant: "default" });
                              handleRefresh();
                            } else {
                              toast({ title: "Error", description: result.message, variant: "destructive" });
                            }
                          }}
                          className="bg-green-900/20 hover:bg-green-900/40"
                        >
                          Confirm
                        </Button>
                      ),
                      <Button
                        key="remove"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFromList(Number.parseInt(reg.id))}
                        className="bg-red-900/20 hover:bg-red-900/40"
                      >
                        Remove
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
              <div>Status</div>
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
                          const result = await confirmAttendance(partySlug, reg.id, reg.andrew_id);
                          if (result.success) {
                            toast({ title: "Success", description: result.message, variant: "default" });
                            handleRefresh();
                          } else {
                            toast({ title: "Error", description: result.message, variant: "destructive" });
                          }
                        }}
                        className="bg-green-900/20 hover:bg-green-900/40"
                      >
                        Confirm
                      </Button>,
                      <Button
                        key="remove"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFromList(Number.parseInt(reg.id))}
                        className="bg-red-900/20 hover:bg-red-900/40"
                      >
                        Remove
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
            <div className="grid grid-cols-7 gap-4 p-4 font-medium text-zinc-400 border-b border-zinc-800">
              <div>Name</div>
              <div>Andrew ID</div>
              <div>Age</div>
              <div>Organization</div>
              <div>Tier</div>
              <div>Payment</div>
              <div>Actions</div>
            </div>
            <div className="divide-y divide-zinc-800">
              {filteredWaitlist.length > 0 ? (
                filteredWaitlist.map((reg) => (
                  <RegistrationRow
                    key={reg.id}
                    reg={reg}
                    columns={7}
                    colorClass="text-zinc-400 bg-zinc-900/20"
                    actions={[
                      <Button
                        key="promote"
                        size="sm"
                        variant="outline"
                        onClick={() => handlePromoteFromWaitlist(reg.andrew_id)}
                        className="bg-green-900/20 hover:bg-green-900/40"
                      >
                        Promote
                      </Button>,
                      <Button
                        key="remove"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFromList(reg.id)}
                        className="bg-red-900/20 hover:bg-red-900/40"
                      >
                        Remove
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
    </div>
  )
}


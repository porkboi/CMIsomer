"use client"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Users, UserCheck, Clock, Filter, RefreshCw, Scan, Settings, DollarSign, Users2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import QrScanner from "qr-scanner"
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
  confirmAttendance,
} from "@/lib/actions"
import { OrgLimitsModal } from "./org-limits-modal"
import { PriceTiersModal, type PriceTier } from "./price-tiers-modal"
import { MaxCapacityModal } from "./max-capacity-modal"

interface DashboardProps {
  partySlug: string
  organizations: string[]
  maxCapacity: number
}

interface Registration {
  id: string
  name: string
  andrewID: string
  age: number
  organization: string
  status: "confirmed" | "waitlist" | "pending"
  paymentMethod: string
  tierName?: string
  tierPrice?: number
  price: number
}

export function Dashboard({ partySlug, organizations, maxCapacity }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredOrgs, setFilteredOrgs] = useState<string[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [orgAllocation, setOrgAllocation] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showScanner, setShowScanner] = useState(false)
  const [showOrgLimitsModal, setShowOrgLimitsModal] = useState(false)
  const [showPriceTiersModal, setShowPriceTiersModal] = useState(false)
  const [orgLimits, setOrgLimits] = useState<Record<string, number>>({})
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([])
  const [showMaxCapacityModal, setShowMaxCapacityModal] = useState(false)
  const { toast } = useToast()
  const videoRef = useRef(null)
  const qrScannerRef = useRef(null)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [registrationsData, orgAllocationData, priceTiersData] = await Promise.all([
          getRegistrations(partySlug),
          getOrgAllocation(partySlug),
          getPriceTiers(partySlug),
        ])
        setRegistrations(registrationsData)
        setOrgAllocation(orgAllocationData)
        setPriceTiers(priceTiersData)

        // Extract org limits from allocation data
        const limits: Record<string, number> = {}
        orgAllocationData.forEach((item) => {
          limits[item.name] = item.total
        })
        setOrgLimits(limits)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [partySlug, toast]) // Removed refreshKey from dependencies

  useEffect(() => {
    if (showScanner && videoRef.current) {
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          handleScan(result.data)
        },
        { returnDetailedScanResult: true },
      )

      qrScannerRef.current.start()
    }

    return () => {
      qrScannerRef.current?.stop()
    }
  }, [showScanner])

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
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

  const handleRemoveFromWaitlist = async (andrewID: string) => {
    const result = await removeFromWaitlist(partySlug, andrewID)
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

  const handlePromoteFromWaitlist = async (andrewID: string) => {
    const result = await promoteFromWaitlist(partySlug, andrewID)
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
        handleRefresh()
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

  const confirmedRegistrations = registrations.filter((reg) => reg.status === "confirmed")
  const waitlistedRegistrations = registrations.filter((reg) => reg.status === "waitlist")
  const pendingRegistrations = registrations.filter((reg) => reg.status === "pending")

  const filteredConfirmed = confirmedRegistrations.filter((reg) => {
    const matchesSearch =
      reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.andrewID.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesOrg = filteredOrgs.length === 0 || filteredOrgs.includes(reg.organization)
    return matchesSearch && matchesOrg
  })

  const filteredWaitlist = waitlistedRegistrations.filter((reg) => {
    const matchesSearch =
      reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.andrewID.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesOrg = filteredOrgs.length === 0 || filteredOrgs.includes(reg.organization)
    return matchesSearch && matchesOrg
  })

  const filteredPending = pendingRegistrations.filter((reg) => {
    const matchesSearch =
      reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.andrewID.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesOrg = filteredOrgs.length === 0 || filteredOrgs.includes(reg.organization)
    return matchesSearch && matchesOrg
  })

  // Calculate tier progress based on dynamic price tiers
  const tierData =
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
        <span className="ml-2 text-lg">Loading data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} className="bg-zinc-900 border-zinc-800">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Button variant="outline" onClick={() => setShowScanner(true)} className="bg-zinc-900 border-zinc-800">
            <Scan className="mr-2 h-4 w-4" />
            Scan QR Code
          </Button>
        </div>
        <div className="flex gap-2">
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

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Price Tier Progress</CardTitle>
          <CardDescription className="text-white">Distribution of registrations across price tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-112">
            <ChartContainer
              config={tierData.reduce(
                (config, tier, index) => {
                  config[`tier${index + 1}`] = {
                    label: tier.name,
                    color: `hsl(var(--chart-${index + 1}))`,
                  }
                  return config
                },
                {} as Record<string, { label: string; color: string }>,
              )}
            >
              <ResponsiveContainer width="100%" height={100}>
                <BarChart
                  data={[
                    tierData.reduce(
                      (data, tier, index) => {
                        data[`tier${index + 1}`] = tier.count
                        return data
                      },
                      { name: "Tiers" } as any,
                    ),
                  ]}
                  layout="vertical"
                  stackOffset="expand"
                >
                  <XAxis type="number" domain={[0, maxCapacity]} />
                  <YAxis type="category" dataKey="name" hide />
                  <Tooltip content={<ChartTooltipContent />} />
                  {tierData.map((_, index) => (
                    <Bar
                      key={`tier${index + 1}`}
                      dataKey={`tier${index + 1}`}
                      stackId="a"
                      fill={`hsl(var(--chart-${index + 1}))`}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Organization Allocation</CardTitle>
          <CardDescription className="text-white">Distribution of registrations by organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-112">
            <ChartContainer
              config={{
                confirmed: {
                  label: "Confirmed",
                  color: "hsl(var(--chart-1))",
                },
                waitlisted: {
                  label: "Waitlisted",
                  color: "hsl(var(--chart-2))",
                },
                limit: {
                  label: "Capacity Limit",
                  color: "hsl(var(--chart-3))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={organizations.map((org) => ({
                    name: org,
                    confirmed: confirmedRegistrations.filter((reg) => reg.organization === org).length,
                    waitlisted: waitlistedRegistrations.filter((reg) => reg.organization === org).length,
                    limit: orgLimits[org] || 0,
                  }))}
                  layout="vertical"
                >
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={50} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="confirmed" stackId="a" fill="hsl(var(--chart-1))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="waitlisted" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 0, 0, 0]} />
                  {/* Render limit as a reference line or separate bar */}
                  <Bar dataKey="limit" fill="none" stroke="hsl(var(--chart-3))" strokeWidth={2} strokeDasharray="5 5" />
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
                  <div key={reg.id} className="grid grid-cols-8 gap-4 p-4 text-white bg-red-950/20">
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
                    <div className="flex gap-2">
                      {reg.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const result = await confirmAttendance(partySlug, reg.andrewID)
                            if (result.success) {
                              toast({
                                title: "Success",
                                description: result.message,
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
                          }}
                          className="bg-green-900/20 hover:bg-green-900/40"
                        >
                          Confirm
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFromList(Number.parseInt(reg.id))}
                        className="bg-red-900/20 hover:bg-red-900/40"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
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
                  <div key={reg.id} className="grid grid-cols-8 gap-4 p-4 text-white bg-yellow-950/20">
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
                        <Badge className="bg-purple-900/50 text-white-300 border-purple-700">
                          {reg.tierName} (${reg.tierPrice || reg.price})
                        </Badge>
                      ) : (
                        <span>${reg.price}</span>
                      )}
                    </div>
                    <div className="capitalize">{reg.payment_method}</div>
                    <div>
                      <Badge className="bg-yellow-900/50 text-yellow-300 border-yellow-700">{reg.status}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const result = await confirmAttendance(partySlug, reg.andrew_id)
                          if (result.success) {
                            toast({
                              title: "Success",
                              description: result.message,
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
                        }}
                        className="bg-green-900/20 hover:bg-green-900/40"
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFromList(Number.parseInt(reg.id))}
                        className="bg-red-900/20 hover:bg-red-900/40"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
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
                  <div key={reg.id} className="grid grid-cols-7 gap-4 p-4 text-zinc-400 bg-zinc-900/20">
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
                        <Badge variant="outline" className="bg-zinc-900 border-zinc-700">
                          {reg.tierName} (${reg.tierPrice || reg.price})
                        </Badge>
                      ) : (
                        <span>${reg.price}</span>
                      )}
                    </div>
                    <div className="capitalize">{reg.payment_method}</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePromoteFromWaitlist(reg.andrewID)}
                        className="bg-green-900/20 hover:bg-green-900/40"
                      >
                        Promote
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFromWaitlist(reg.andrewID)}
                        className="bg-red-900/20 hover:bg-red-900/40"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-zinc-500">No waitlisted registrations found</div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {showScanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle>Scan QR Code</CardTitle>
              <CardDescription>Position the QR code in front of your camera</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <video ref={videoRef} className="w-full h-auto" />
              <Button variant="outline" onClick={() => setShowScanner(false)} className="mt-4">
                Close Scanner
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

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
        />
      )}
      <Toaster />
    </div>
  )
}


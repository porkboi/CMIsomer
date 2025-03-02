"use client"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Users, UserCheck, Clock, Filter, RefreshCw, Scan } from "lucide-react"
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
} from "@/lib/actions"

interface Registration {
  id: string
  name: string
  andrewID: string
  age: number
  organization: string
  status: "confirmed" | "waitlist"
  paymentMethod: string
}

export function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredOrgs, setFilteredOrgs] = useState<string[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [orgAllocation, setOrgAllocation] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showScanner, setShowScanner] = useState(false)
  const { toast } = useToast()
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [registrationsData, orgAllocationData] = await Promise.all([getRegistrations(), getOrgAllocation()])
        setRegistrations(registrationsData)
        setOrgAllocation(orgAllocationData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (showScanner && videoRef.current) {
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          handleScan(result.data);
        },
        { returnDetailedScanResult: true }
      );

      qrScannerRef.current.start();
    }

    return () => {
      qrScannerRef.current?.stop();
    };
  }, [showScanner]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleScan = async (data: string) => {
    try {
      const result = await verifyQRCode(data)
      if (result.success) {
        toast({
          title: "Valid Registration",
          description: `Verified: ${result.registration.name} (${result.registration.andrewID})`,
          variant: "default",
        })
      } else {
        toast({
          title: "Invalid QR Code",
          description: result.message,
          variant: "destructive",
        })
      }
      setShowScanner(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify QR code",
        variant: "destructive",
      })
    }
  }

  const handleRemoveFromList = async (id: number) => {
    const result = await removeFromList(id)
    if (result.success) {
      toast({
        title: "Success",
        description: "Registration removed from list",
        variant: "default",
      })
      // Refresh the data
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
    const result = await removeFromWaitlist(andrewID)
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
    const result = await promoteFromWaitlist(andrewID)
    if (result.success) {
      toast({
        title: "Success",
        description: "Registration promoted to confirmed",
        variant: "default",
      })
      // Refresh the data
      handleRefresh()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const confirmedRegistrations = registrations.filter((reg) => reg.status === "confirmed")
  const waitlistedRegistrations = registrations.filter((reg) => reg.status === "waitlist")

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
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleRefresh} className="bg-zinc-900 border-zinc-800">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
        <Button variant="outline" onClick={() => setShowScanner(true)} className="bg-zinc-900 border-zinc-800">
          <Scan className="mr-2 h-4 w-4" />
          Scan QR Code
        </Button>
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
              {confirmedRegistrations.length} confirmed, {waitlistedRegistrations.length} waitlisted
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
              {Math.round((confirmedRegistrations.length / 300) * 100)}% of capacity
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
            <div className="text-2xl font-bold text-white">{300 - confirmedRegistrations.length}</div>
            <p className="text-xs text-zinc-400">Out of 300 total capacity</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Organization Allocation</CardTitle>
          <CardDescription className="text-white">Spots allocated and used by each organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-112">
            <ChartContainer
              config={{
                total: {
                  label: "Total Slots",
                  color: "hsl(var(--chart-1))",
                },
                used: {
                  label: "Used Slots",
                  color: "hsl(var(--chart-2))",
                },
                available: {
                  label: "Available Slots",
                  color: "hsl(var(--chart-3))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orgAllocation} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={50} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="used" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="available" stackId="a" fill="hsl(var(--chart-3))" radius={[0, 0, 0, 0]} />
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
            {["SSA", "HKSA", "SIAM", "KSA", "CSA", "TSA", "ASA"].map((org) => (
              <DropdownMenuCheckboxItem
                key={org}
                checked={filteredOrgs.includes(org)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFilteredOrgs([...filteredOrgs, org])
                  } else {
                    setFilteredOrgs(filteredOrgs.filter((item) => item !== org))
                  }
                }}
              >
                {org}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="confirmed" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-900">
          <TabsTrigger value="confirmed">Confirmed ({filteredConfirmed.length})</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist ({filteredWaitlist.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="confirmed" className="mt-4">
          <div className="rounded-md border border-zinc-800 bg-zinc-950">
            <div className="grid grid-cols-5 gap-4 p-4 font-medium text-zinc-400 border-b border-zinc-800">
              <div>Name</div>
              <div>Andrew ID</div>
              <div>Age</div>
              <div>Organization</div>
              <div>Payment</div>
            </div>
            <div className="divide-y divide-zinc-800">
              {filteredConfirmed.length > 0 ? (
                filteredConfirmed.map((reg) => (
                  <div key={reg.id} className="grid grid-cols-5 gap-4 p-4 text-white bg-red-950/20">
                    <div>{reg.name}</div>
                    <div>{reg.andrewID}</div>
                    <div>{reg.age}</div>
                    <div>
                      <Badge variant="outline" className="bg-zinc-900 border-zinc-700">
                        {reg.organization}
                      </Badge>
                    </div>
                    <div className="capitalize">{reg.paymentMethod}</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFromList(parseInt(reg.id))}
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

        <TabsContent value="waitlist" className="mt-4">
          <div className="rounded-md border border-zinc-800 bg-zinc-950">
            <div className="grid grid-cols-6 gap-4 p-4 font-medium text-zinc-400 border-b border-zinc-800">
              <div>Name</div>
              <div>Andrew ID</div>
              <div>Age</div>
              <div>Organization</div>
              <div>Payment</div>
              <div>Actions</div>
            </div>
            <div className="divide-y divide-zinc-800">
              {filteredWaitlist.length > 0 ? (
                filteredWaitlist.map((reg) => (
                  <div key={reg.id} className="grid grid-cols-6 gap-4 p-4 text-zinc-400 bg-zinc-900/20">
                    <div>{reg.name}</div>
                    <div>{reg.andrewID}</div>
                    <div>{reg.age}</div>
                    <div>
                      <Badge variant="outline" className="bg-zinc-900 border-zinc-700">
                        {reg.organization}
                      </Badge>
                    </div>
                    <div className="capitalize">{reg.paymentMethod}</div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
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
      <Toaster />
    </div>
  )
}


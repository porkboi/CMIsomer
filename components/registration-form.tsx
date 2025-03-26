"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Music, PartyPopper, Send, Ticket } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { submitRegistration, getPriceTiers } from "@/lib/actions"

interface RegistrationFormProps {
  partySlug: string
  maxCapacity: number
  allowWaitlist: boolean
  ticketPrice: number
  venmoUsername: string
  zelleInfo: string
  organizations: string[]
}

export function RegistrationForm({
  partySlug,
  maxCapacity,
  allowWaitlist,
  ticketPrice,
  venmoUsername,
  zelleInfo,
  organizations,
}: RegistrationFormProps) {
  const formSchema = z.object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters.",
    }),
    age: z.string().refine((val) => !isNaN(Number.parseInt(val)) && Number.parseInt(val) >= 18, {
      message: "You must be at least 18 years old.",
    }),
    andrewID: z.string().min(3, {
      message: "Andrew ID must be at least 3 characters.",
    }),
    paymentMethod: z.enum(["venmo", "zelle"], {
      required_error: "Please select a payment method.",
    }),
    paymentConfirmed: z.enum(["yes", "no"], {
      required_error: "Please confirm if you've paid.",
    }),
    organization: z.enum(organizations as [string, ...string[]], {
      required_error: "Please select your organization.",
    }),
    promoCode: z.string().optional(),
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationCount, setRegistrationCount] = useState(0)
  const [currentTierCap, setCurrentTierCap] = useState(0)
  const [priceTiers, setPriceTiers] = useState<any[]>([])
  const [currentTierIndex, setCurrentTierIndex] = useState(0)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: "",
      andrewID: "",
      promoCode: "",
    },
  })

  useEffect(() => {
    // Fetch registration count
    const fetchRegistrationCount = async () => {
      try {
        const response = await fetch(`/api/registrations/count?partySlug=${partySlug}`)
        if (response.ok) {
          const data = await response.json()
          setRegistrationCount(data.count)
        }
      } catch (error) {
        console.error("Error fetching registration count:", error)
      }
    }

    // Fetch price tiers
    const fetchPriceTiers = async () => {
      try {
        const tiers = await getPriceTiers(partySlug)
        setPriceTiers(tiers)

        // Determine current tier based on registration count
        let cumulativeCapacity = 0
        let currentIndex = 0

        for (let i = 0; i < tiers.length; i++) {
          cumulativeCapacity += tiers[i].capacity
          if (registrationCount < cumulativeCapacity) {
            currentIndex = i
            break
          }
        }
        setCurrentTierCap(cumulativeCapacity)
        setCurrentTierIndex(currentIndex)
      } catch (error) {
        console.error("Error fetching price tiers:", error)
      }
    }

    fetchRegistrationCount()
    fetchPriceTiers()
  }, [partySlug, registrationCount])

  const venmoPaymentLink = `venmo://paycharge?txn=pay&recipients=${venmoUsername}&amount=${
    priceTiers.length > 0 ? priceTiers[currentTierIndex].price : ticketPrice
  }&note=Party%20Registration`

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      const result = await submitRegistration(partySlug, values)

      if (result.success) {
        toast({
          title: "Registration submitted!",
          description: "We are confirming your attendance. Please check your CMU email inbox for more details.",
          variant: "default",
        })
        form.reset()
      } else {
        toast({
          title: "Registration failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const spotsRemaining = currentTierCap - registrationCount
  const isSoldOut = spotsRemaining <= 0
  const currentTierPrice = priceTiers.length > 0 ? priceTiers[currentTierIndex].price : ticketPrice

  return (
    <div className="space-y-6">
      {/* Price Tiers Display */}
      <div className="grid gap-4 md:grid-cols-3">
        {priceTiers.length > 0 ? (
          priceTiers.map((tier, index) => {
            const isCurrent = index === currentTierIndex
            const isPast = index < currentTierIndex
            const isFuture = index > currentTierIndex

            return (
              <Card
                key={tier.id}
                className={`bg-zinc-950 border-zinc-800 transition-all ${
                  isCurrent ? "ring-2 ring-primary scale-105 z-10" : ""
                } ${isPast ? "opacity-60" : ""}`}
              >
                <CardHeader className={`${isCurrent ? "bg-primary/10" : ""}`}>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    {tier.name}
                    {isCurrent && (
                      <span className="ml-auto text-xs bg-primary text-white px-2 py-1 rounded-full">Current</span>
                    )}
                    {isPast && (
                      <span className="ml-auto text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full">Sold Out</span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    {isPast
                      ? "No longer available"
                      : isCurrent
                        ? `Spots avaliable`
                        : "Available after current tier sells out"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold text-white">${tier.price}</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm ${
                        isPast
                          ? "bg-zinc-800 text-zinc-400"
                          : isCurrent
                            ? isSoldOut
                              ? "bg-red-900/50 text-red-300"
                              : spotsRemaining < 20
                                ? "bg-yellow-900/50 text-yellow-300"
                                : "bg-green-900/50 text-green-300"
                            : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {isPast
                        ? "Closed"
                        : isCurrent
                          ? isSoldOut
                            ? "Sold Out"
                            : spotsRemaining < 20
                              ? "Limited"
                              : "Available"
                          : "Coming Soon"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          // Fallback to single tier if no price tiers are defined
          <Card className="bg-zinc-950 border-zinc-800 md:col-span-3">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Ticket Information
              </CardTitle>
              <CardDescription className="text-zinc-400">
                {isSoldOut ? "Sold out - join the waitlist" : `${spotsRemaining} spots remaining`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-white">${ticketPrice}</p>
                  <p className="text-xs text-zinc-400">Standard admission</p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm ${
                    isSoldOut
                      ? "bg-red-900/50 text-red-300"
                      : spotsRemaining < 20
                        ? "bg-yellow-900/50 text-yellow-300"
                        : "bg-green-900/50 text-green-300"
                  }`}
                >
                  {isSoldOut ? "Sold Out" : spotsRemaining < 20 ? "Limited Availability" : "Available"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-lg">
        <div className="mb-6 flex items-center gap-2">
          <PartyPopper className="h-5 w-5 text-pink-500" />
          <h2 className="text-xl font-semibold">Party Registration</h2>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} className="bg-zinc-900 border-zinc-800" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input placeholder="18" {...field} className="bg-zinc-900 border-zinc-800" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="andrewID"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Andrew ID</FormLabel>
                  <FormControl>
                    <Input placeholder="jdoe" {...field} className="bg-zinc-900 border-zinc-800" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="promoCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Promo Code (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter promo code" {...field} className="bg-zinc-900 border-zinc-800" />
                  </FormControl>
                  <FormDescription>Have a promo code? Enter it here for special pricing.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4 sm:grid-cols-4"
                    >
                      {organizations.map((org) => (
                        <FormItem key={org} className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={org} />
                          </FormControl>
                          <FormLabel className="font-normal">{org}</FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="venmo" />
                        </FormControl>
                        <FormLabel className="font-normal">Venmo</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="zelle" />
                        </FormControl>
                        <FormLabel className="font-normal">Zelle</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>
                    Please send the above quoted amount using one of these methods, and include your andrewID in the description:
                    <br />
                    <span className="font-medium">Venmo:</span> {venmoUsername}
                    <br />
                    <span className="font-medium">Zelle:</span> {zelleInfo}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center">
              <a href={venmoPaymentLink}>
                <Send className="mr-2 h-4 w-4" />
                Pay with Venmo - ${currentTierPrice}
              </a>
            </Button>

            <FormField
              control={form.control}
              name="paymentConfirmed"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Have you Venmo/Zelle'd?</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="yes" />
                        </FormControl>
                        <FormLabel className="font-normal">Yes</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>
                        <FormLabel className="font-normal">No</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
            >
              {isSubmitting ? <Music className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Registration (${currentTierPrice})
            </Button>
          </form>
        </Form>
        <Toaster />
      </div>
    </div>
  )
}


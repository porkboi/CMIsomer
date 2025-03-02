"use client"

import { useState, useEffect, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Music, PartyPopper, Send, Ticket } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { submitRegistration, getTicketTierInfo } from "@/lib/actions"

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
  organization: z.enum(["SSA", "HKSA", "SIAM", "KSA", "CSA", "TSA", "ASA"], {
    required_error: "Please select your organization.",
  }),
  promoCode: z.string().optional(),
})

export function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [qrCode, setQrCode] = useState<string>()
  const [tierInfo, setTierInfo] = useState<any>()
  const { toast } = useToast()

  const qrRef = useRef(null);

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
    const fetchTierInfo = async () => {
      const info = await getTicketTierInfo()
      setTierInfo(info)
    }
    fetchTierInfo()
  }, [])

  const venmoUsername = "Steven_Shi121"; // Replace with actual Venmo username
  const amount = tierInfo?.currentPrice || 18; // Default price
  const venmoPaymentLink = `venmo://paycharge?txn=pay&recipients=${venmoUsername}&amount=${amount}&note=Party%20Registration`;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      const result = await submitRegistration(values)

      if (result.success) {
        toast({
          title: "Registration submitted!",
          description: result.message,
          variant: "default",
        })
        if (result.qrCode) {
          setQrCode(result.qrCode);
          setTimeout(() => {
            qrRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 300);
        }
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className={`bg-zinc-950 border-zinc-800 ${tierInfo?.currentTier === "Tier 1" ? "ring-2 ring-purple-500" : ""}`}
        >
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Tier 1
            </CardTitle>
            <CardDescription className="text-zinc-400">Early Bird Special</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">$15</p>
            <p className="text-xs text-zinc-400">First 100 registrations</p>
          </CardContent>
        </Card>

        <Card
          className={`bg-zinc-950 border-zinc-800 ${tierInfo?.currentTier === "Tier 2" ? "ring-2 ring-purple-500" : ""}`}
        >
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Tier 2
            </CardTitle>
            <CardDescription className="text-zinc-400">Regular Price</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">$18</p>
            <p className="text-xs text-zinc-400">Registrations 101-200</p>
          </CardContent>
        </Card>

        <Card
          className={`bg-zinc-950 border-zinc-800 ${tierInfo?.currentTier === "Last Call" ? "ring-2 ring-purple-500" : ""}`}
        >
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Last Call
            </CardTitle>
            <CardDescription className="text-zinc-400">Final Tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">$22</p>
            <p className="text-xs text-zinc-400">Registrations 201-240</p>
          </CardContent>
        </Card>
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
                      <Input placeholder="21" {...field} className="bg-zinc-900 border-zinc-800" />
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
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="SSA" />
                        </FormControl>
                        <FormLabel className="font-normal">SSA</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="HKSA" />
                        </FormControl>
                        <FormLabel className="font-normal">HKSA</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="SIAM" />
                        </FormControl>
                        <FormLabel className="font-normal">SIAM</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="KSA" />
                        </FormControl>
                        <FormLabel className="font-normal">KSA</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="CSA" />
                        </FormControl>
                        <FormLabel className="font-normal">CSA</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="TSA" />
                        </FormControl>
                        <FormLabel className="font-normal">TSA</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="ASA" />
                        </FormControl>
                        <FormLabel className="font-normal">ASA</FormLabel>
                      </FormItem>
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
                  <FormDescription>Please send the above quoted amount to Steven Shi before submitting this form.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              asChild
              className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
            >
              <a href={venmoPaymentLink}>
                <Send className="mr-2 h-4 w-4" />
                Pay with Venmo - ${amount}
              </a>
            </Button>

            <FormField
              control={form.control}
              name="paymentConfirmed"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Have you Venmo/Zelle'd Steven Shi?</FormLabel>
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
              Submit Registration (Current Price: ${tierInfo?.currentPrice})
            </Button>
          </form>
        </Form>

        {qrCode && (
          <div ref={qrRef} className="mt-6 text-center">
            <h3 className="text-lg font-semibold mb-4">Your Registration QR Code</h3>
            <div className="inline-block bg-white p-4 rounded-lg">
              <Image src={qrCode || "/placeholder.svg"} alt="Registration QR Code" width={200} height={200} />
            </div>
            <p className="mt-4 text-sm text-zinc-400">
              Please save this QR code. You'll need it for entry to the party.
            </p>
          </div>
        )}
        <Toaster />
      </div>
    </div>
  )
}


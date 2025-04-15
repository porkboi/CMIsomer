"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Check, Copy, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createParty } from "@/lib/actions"

interface FormData {
  name: string
  organizations: string
  maxCapacity: string
  allowWaitlist: boolean
  ticketPrice: string
  venmoUsername: string
  zelleInfo: string
  adminUsername: string
  adminPassword: string
  eventDate: string
  eventTime: string
  location: string
}

export function CreatePartyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<{ slug: string; url: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      organizations: "",
      maxCapacity: "",
      allowWaitlist: true,
      ticketPrice: "",
      venmoUsername: "",
      zelleInfo: "",
      adminUsername: "",
      adminPassword: "",
      eventDate: "",
      eventTime: "",
      location: "",
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form

  const onSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true)

      const partyData = {
        name: formData.name,
        organizations: formData.organizations,
        maxCapacity: Number(formData.maxCapacity),
        allowWaitlist: formData.allowWaitlist,
        ticketPrice: Number(formData.ticketPrice),
        venmoUsername: formData.venmoUsername,
        zelleInfo: formData.zelleInfo,
        adminUsername: formData.adminUsername,
        adminPassword: formData.adminPassword,
        eventDate: formData.eventDate,
        eventTime: formData.eventTime,
        location: formData.location,
      }

      const result = await createParty(partyData)

      if (result.success) {
        const url = `${window.location.origin}/party/${result.slug}`
        setSuccessData({ slug: result.slug, url })
        form.reset()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = async () => {
    if (successData) {
      await navigator.clipboard.writeText(successData.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (successData) {
    return (
      <Card className="bg-zinc-800 animate-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-500">
            <Check className="h-6 w-6" />
            Party Created Successfully!
          </CardTitle>
          <CardDescription>Your party registration page is ready.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium">Your unique party URL:</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="rounded bg-muted px-2 py-1 flex-1">{successData.url}</code>
              <Button
                size="icon"
                variant="outline"
                onClick={copyToClipboard}
                className={copied ? "text-green-500" : ""}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => setSuccessData(null)} variant="outline" className="flex-1">
              Create Another Party
            </Button>
            <Button asChild className="flex-1">
              <a href={`/party/${successData.slug}`} target="_blank" rel="noopener noreferrer">
                View Party Page
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card classname="bg-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Create a New Party
        </CardTitle>
        <CardDescription>Set up a new party registration page with custom settings.</CardDescription>
      </CardHeader>
      <CardContent classname="bg-zinc-800">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <label className="text-sm font-medium">Party Name</label>
            <Input
              {...register("name", {
                required: "Party name is required",
                minLength: { value: 2, message: "Party name must be at least 2 characters" },
              })}
              placeholder="My Super Cool Party"
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Organizations</label>
            <Input
              {...register("organizations", {
                required: "Organizations are required",
                minLength: { value: 2, message: "Organizations must be at least 2 characters" },
              })}
              placeholder="Orgs, Separated, By, Comma"
            />
            <p className="text-sm text-muted-foreground mt-1">Enter organization names separated by commas.</p>
            {errors.organizations && <p className="text-sm text-red-500">{errors.organizations.message}</p>}
          </div>

          <div className="space-y-8">
            <div>
              <label className="text-sm font-medium">Event Date</label>
              <Input
                type="date"
                {...register("eventDate", {
                  required: "Event date is required",
                })}
                className="mt-1"
              />
              {errors.eventDate && <p className="text-sm text-red-500 mt-1">{errors.eventDate.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Event Time</label>
              <Input
                type="time"
                {...register("eventTime", {
                  required: "Event time is required",
                })}
                className="mt-1"
              />
              {errors.eventTime && <p className="text-sm text-red-500 mt-1">{errors.eventTime.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Location</label>
              <Input
                {...register("location", {
                  required: "Location is required",
                })}
                placeholder="e.g., Cohon University Center, Rangos Ballroom"
                className="mt-1"
              />
              {errors.location && <p className="text-sm text-red-500 mt-1">{errors.location.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Maximum Capacity</label>
              <Input
                type="number"
                {...register("maxCapacity", {
                  required: "Maximum capacity is required",
                  min: { value: 1, message: "Capacity must be at least 1" },
                })}
                placeholder="300"
              />
              {errors.maxCapacity && <p className="text-sm text-red-500 mt-1">{errors.maxCapacity.message}</p>}
            </div>

            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <label className="text-base font-medium">Allow Waitlist</label>
                <p className="text-sm text-muted-foreground">Enable waitlist after capacity is reached</p>
              </div>
              <Switch
                checked={watch("allowWaitlist")}
                onCheckedChange={(checked) => setValue("allowWaitlist", checked)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Ticket Price ($)</label>
            <Input
              type="number"
              {...register("ticketPrice", {
                required: "Ticket price is required",
                min: { value: 0, message: "Price must be at least 0" },
              })}
              placeholder="15"
            />
            {errors.ticketPrice && <p className="text-sm text-red-500 mt-1">{errors.ticketPrice.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Venmo Username</label>
            <Input {...register("venmoUsername", { required: "Venmo username is required" })} placeholder="@username" />
            <p className="text-sm text-muted-foreground mt-1">Enter your Venmo username without the @ symbol</p>
            {errors.venmoUsername && <p className="text-sm text-red-500">{errors.venmoUsername.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Zelle Information</label>
            <Input
              {...register("zelleInfo", { required: "Zelle information is required" })}
              placeholder="Phone or email"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Enter the phone number or email associated with your Zelle account
            </p>
            {errors.zelleInfo && <p className="text-sm text-red-500">{errors.zelleInfo.message}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Admin Username</label>
              <Input {...register("adminUsername", { required: "Admin username is required" })} placeholder="admin" />
              {errors.adminUsername && <p className="text-sm text-red-500 mt-1">{errors.adminUsername.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Admin Password</label>
              <Input
                type="password"
                {...register("adminPassword", {
                  required: "Admin password is required",
                  minLength: { value: 6, message: "Password must be at least 6 characters" },
                })}
                placeholder="••••••"
              />
              {errors.adminPassword && <p className="text-sm text-red-500 mt-1">{errors.adminPassword.message}</p>}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-2 px-4 shadow">
            {isSubmitting ? "Creating..." : "Create Party"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}


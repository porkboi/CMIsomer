"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Sparkles } from "lucide-react"

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
  tier1Price: string
  tier2Price: string
  tier3Price: string
  tier1Capacity: string
  tier2Capacity: string
  venmoUsername: string
  adminUsername: string
  adminPassword: string
}

export function CreatePartyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      organizations: "",
      maxCapacity: "",
      allowWaitlist: true,
      tier1Price: "",
      tier2Price: "",
      tier3Price: "",
      tier1Capacity: "",
      tier2Capacity: "",
      venmoUsername: "",
      adminUsername: "",
      adminPassword: "",
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form

  const validateCapacity = (formData: FormData) => {
    const totalCapacity = Number(formData.tier1Capacity) + Number(formData.tier2Capacity)
    if (totalCapacity !== Number(formData.maxCapacity)) {
      toast({
        title: "Validation Error",
        description: "Total tier capacity must equal maximum capacity.",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const onSubmit = async (formData: FormData) => {
    console.log("run")
    if (!validateCapacity(formData)) return

    try {
      setIsSubmitting(true)

      const partyData = {
        name: formData.name,
        organizations: formData.organizations,
        maxCapacity: Number(formData.maxCapacity),
        allowWaitlist: formData.allowWaitlist,
        tier1Price: Number(formData.tier1Price),
        tier2Price: Number(formData.tier2Price),
        tier3Price: Number(formData.tier3Price),
        tier1Capacity: Number(formData.tier1Capacity),
        tier2Capacity: Number(formData.tier2Capacity),
        venmoUsername: formData.venmoUsername,
        adminUsername: formData.adminUsername,
        adminPassword: formData.adminPassword,
      }

      const result = await createParty(partyData)

      if (result.success) {
        toast({
          title: "Party created!",
          description: "Your party registration page has been created.",
        })
        alert(`Your party URL is: ${window.location.origin}/party/${result.slug}`)
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Create a New Party
        </CardTitle>
        <CardDescription>Set up a new party registration page with custom settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <label className="text-sm font-medium">Party Name</label>
            <Input
              {...register("name", {
                required: "Party name is required",
                minLength: { value: 2, message: "Party name must be at least 2 characters" },
              })}
              placeholder="Spring Formal 2024"
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
              placeholder="SSA, HKSA, SIAM, KSA, CSA, TSA, ASA"
            />
            <p className="text-sm text-muted-foreground mt-1">Enter organization names separated by commas.</p>
            {errors.organizations && <p className="text-sm text-red-500">{errors.organizations.message}</p>}
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

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Tier 1 Price ($)</label>
              <Input
                type="number"
                {...register("tier1Price", {
                  required: "Tier 1 price is required",
                  min: { value: 0, message: "Price must be at least 0" },
                })}
                placeholder="15"
              />
              {errors.tier1Price && <p className="text-sm text-red-500 mt-1">{errors.tier1Price.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Tier 2 Price ($)</label>
              <Input
                type="number"
                {...register("tier2Price", {
                  required: "Tier 2 price is required",
                  min: { value: 0, message: "Price must be at least 0" },
                })}
                placeholder="18"
              />
              {errors.tier2Price && <p className="text-sm text-red-500 mt-1">{errors.tier2Price.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Tier 3 Price ($)</label>
              <Input
                type="number"
                {...register("tier3Price", {
                  required: "Tier 3 price is required",
                  min: { value: 0, message: "Price must be at least 0" },
                })}
                placeholder="22"
              />
              {errors.tier3Price && <p className="text-sm text-red-500 mt-1">{errors.tier3Price.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Tier 1 Capacity</label>
              <Input
                type="number"
                {...register("tier1Capacity", {
                  required: "Tier 1 capacity is required",
                  min: { value: 1, message: "Capacity must be at least 1" },
                })}
                placeholder="100"
              />
              {errors.tier1Capacity && <p className="text-sm text-red-500 mt-1">{errors.tier1Capacity.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Tier 2 Capacity</label>
              <Input
                type="number"
                {...register("tier2Capacity", {
                  required: "Tier 2 capacity is required",
                  min: { value: 1, message: "Capacity must be at least 1" },
                })}
                placeholder="100"
              />
              {errors.tier2Capacity && <p className="text-sm text-red-500 mt-1">{errors.tier2Capacity.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Venmo Username</label>
            <Input {...register("venmoUsername", { required: "Venmo username is required" })} placeholder="@username" />
            <p className="text-sm text-muted-foreground mt-1">Enter your Venmo username without the @ symbol</p>
            {errors.venmoUsername && <p className="text-sm text-red-500">{errors.venmoUsername.message}</p>}
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

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating..." : "Create Party"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}


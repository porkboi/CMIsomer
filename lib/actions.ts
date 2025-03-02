"use server"

import { z } from "zod"
import QRCode from "qrcode"
import {
  getAllRegistrations,
  addRegistration,
  getRegistrationByAndrewID,
  removeRegistration,
  updateRegistrationStatus,
} from "./db-client"
import { isAuthenticated } from "./auth"
import { createSlug } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

// Define the registration schema
const registrationSchema = z.object({
  name: z.string().min(2),
  age: z.string().refine((val) => !isNaN(Number.parseInt(val)) && Number.parseInt(val) >= 18),
  andrewID: z.string().min(3),
  organization: z.enum(["SSA", "HKSA", "SIAM", "KSA", "CSA", "TSA", "ASA"]),
  paymentMethod: z.enum(["venmo", "zelle"]),
  paymentConfirmed: z.enum(["yes", "no"]),
  promoCode: z.string().optional(),
})

export type Registration = {
  id: number
  name: string
  andrewID: string
  age: number
  organization: string
  paymentMethod: string
  paymentConfirmed: string
  status: string
  createdAt?: string
  price: number
  qrCode: string
}

// Organization allocation limits
const orgLimits = {
  SSA: 20,
  HKSA: 25,
  SIAM: 20,
  KSA: 30,
  CSA: 30,
  TSA: 25,
  ASA: 130,
}

// Get all registrations
export async function getRegistrations(): Promise<Registration[]> {
  return getAllRegistrations()
}

// Get organization allocation data
export async function getOrgAllocation() {
  const registrations = await getRegistrations()
  const confirmed = registrations.filter((reg) => reg.status === "confirmed")

  const orgCounts = confirmed.reduce(
    (acc, reg) => {
      acc[reg.organization] = (acc[reg.organization] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return Object.entries(orgLimits).map(([name, total]) => {
    const used = orgCounts[name] || 0
    return {
      name,
      total,
      used,
      available: total - used,
    }
  })
}

// Calculate ticket price based on registration count
// function calculateTicketPrice(registrationCount: number, promoCode?: string): number {
//   if (promoCode === "TCLISCOOL") return 15
//   if (registrationCount < 100) return 15 // Tier 1
//   if (registrationCount < 200) return 18 // Tier 2
//   return 22 // Last Call
// }

// Get current ticket tier information
export async function getTicketTierInfo() {
  try {
    const registrations = await getAllRegistrations()
    const confirmedCount = registrations.filter((r) => r.status === "confirmed").length
    const currentPrice = confirmedCount < 100 ? 15 : confirmedCount < 200 ? 18 : 22

    return {
      currentTier: confirmedCount < 100 ? "Tier 1" : confirmedCount < 200 ? "Tier 2" : "Last Call",
      currentPrice,
      remainingInTier:
        confirmedCount < 100
          ? 100 - confirmedCount
          : confirmedCount < 200
            ? 200 - confirmedCount
            : 240 - confirmedCount,
      totalRegistered: confirmedCount,
    }
  } catch (error) {
    console.error("Error getting ticket tier info:", error)
    // Return default values if there's an error
    return {
      currentTier: "Tier 1",
      currentPrice: 15,
      remainingInTier: 100,
      totalRegistered: 0,
    }
  }
}

// Submit a new registration with QR code
export async function submitRegistration(formData: z.infer<typeof registrationSchema>) {
  try {
    const validatedData = registrationSchema.parse(formData)
    const existingUser = await getRegistrationByAndrewID(validatedData.andrewID)

    if (existingUser) {
      return { success: false, message: "A registration with this Andrew ID already exists." }
    }

    const registrations = await getAllRegistrations()
    const confirmedCount = registrations.filter((r) => r.status === "confirmed").length
    const price = formData.promoCode === "TCLISCOOL" ? 15 : confirmedCount < 100 ? 15 : confirmedCount < 200 ? 18 : 22

    // Generate QR code
    const qrData = {
      andrewID: validatedData.andrewID,
      name: validatedData.name,
      timestamp: new Date().toISOString(),
    }
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData))

    // Add the registration
    const registration = await addRegistration({
      ...validatedData,
      age: Number.parseInt(validatedData.age),
      price,
      qrCode,
      status: confirmedCount < 240 ? "confirmed" : "waitlist",
    })

    return {
      success: true,
      message:
        registration.status === "confirmed"
          ? `Registration confirmed! Ticket price: $${price}`
          : "You've been added to the waitlist.",
      qrCode: registration.status === "confirmed" ? qrCode : undefined,
    }
  } catch (error) {
    console.error("Registration error:", error)
    if (error instanceof Error && error.message.includes("Table does not exist")) {
      return {
        success: false,
        message: "The registration system is currently being set up. Please try again later.",
      }
    }
    return { success: false, message: "An error occurred during registration." }
  }
}

export async function removeFromList(id: number) {
  if (!(await isAuthenticated())) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    await removeRegistration(id)
    return { success: true, message: "Registration removed successfully" }
  } catch (error) {
    return { success: false, message: "Failed to remove registration" }
  }
}

// Admin functions (protected)
export async function removeFromWaitlist(andrewID: string) {
  if (!(await isAuthenticated())) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    await removeRegistration(andrewID)
    return { success: true, message: "Registration removed successfully" }
  } catch (error) {
    return { success: false, message: "Failed to remove registration" }
  }
}

export async function promoteFromWaitlist(andrewID: string) {
  if (!(await isAuthenticated())) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    await updateRegistrationStatus(andrewID, "confirmed")
    return { success: true, message: "Registration confirmed successfully" }
  } catch (error) {
    return { success: false, message: "Failed to update registration" }
  }
}

export async function verifyQRCode(qrData: string) {
  if (!(await isAuthenticated())) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    const data = JSON.parse(qrData)
    const registration = await getRegistrationByAndrewID(data.andrewID)

    if (!registration) {
      return { success: false, message: "Registration not found" }
    }

    return {
      success: true,
      message: "QR code verified successfully",
      registration,
    }
  } catch (error) {
    return { success: false, message: "Invalid QR code" }
  }
}

const partySchema = z.object({
  name: z.string().min(2),
  organizations: z.string().min(2),
  maxCapacity: z.number().min(1),
  allowWaitlist: z.boolean(),
  tier1Price: z.number().min(0),
  tier2Price: z.number().min(0),
  tier3Price: z.number().min(0),
  tier1Capacity: z.number().min(1),
  tier2Capacity: z.number().min(1),
  venmoUsername: z.string().min(1),
  adminUsername: z.string().min(1),
  adminPassword: z.string().min(6),
})

export async function createParty(formData: z.infer<typeof partySchema>) {
  try {
    const validatedData = partySchema.parse(formData)

    // Create a URL-friendly slug from the party name
    const slug = createSlug(validatedData.name)

    // Check if party with this slug already exists
    const { data: existingParty } = await supabase.from("parties").select("slug").eq("slug", slug).single()

    if (existingParty) {
      return {
        success: false,
        message: "A party with this name already exists.",
      }
    }

    // Convert organizations string to array
    const organizations = validatedData.organizations
      .split(",")
      .map((org) => org.trim())
      .filter((org) => org.length > 0)

    // Validate total capacity
    const totalCapacity = validatedData.tier1Capacity + validatedData.tier2Capacity
    if (totalCapacity !== validatedData.maxCapacity) {
      return {
        success: false,
        message: "Total tier capacity must equal maximum capacity.",
      }
    }

    // Insert the party into the database
    const { data, error: insertError } = await supabase
      .from("parties")
      .insert({
        slug,
        name: validatedData.name,
        organizations,
        max_capacity: validatedData.maxCapacity,
        allow_waitlist: validatedData.allowWaitlist,
        tier1_price: validatedData.tier1Price,
        tier2_price: validatedData.tier2Price,
        tier3_price: validatedData.tier3Price,
        tier1_capacity: validatedData.tier1Capacity,
        tier2_capacity: validatedData.tier2Capacity,
        venmo_username: validatedData.venmoUsername,
        admin_username: validatedData.adminUsername,
        admin_password: validatedData.adminPassword,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Database insert error:", insertError)
      throw new Error(`Failed to insert party: ${insertError.message}`)
    }

    // Create the registration table for this party
    const { error: fnError } = await supabase.rpc("create_party_registration_table", { party_slug: slug })

    if (fnError) {
      console.error("Function call error:", fnError)
      // Cleanup the party if table creation fails
      await supabase.from("parties").delete().eq("slug", slug)
      throw new Error(`Failed to create registration table: ${fnError.message}`)
    }

    return {
      success: true,
      slug,
      message: "Party created successfully",
    }
  } catch (error) {
    console.error("Error creating party:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create party",
    }
  }
}


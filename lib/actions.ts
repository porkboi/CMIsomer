"use server"

import { z } from "zod"
import QRCode from "qrcode"
import {
  // getAllRegistrations,
  // addRegistration,
  getRegistrationByAndrewID,
  // removeRegistration,
  // updateRegistrationStatus,
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
export async function getRegistrations(partySlug: string): Promise<Registration[]> {
  const tableName = `registrations_${partySlug.replace(/-/g, "_")}`

  try {
    const { data, error } = await supabase.from(tableName).select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching registrations:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return []
  }
}

// Get organization allocation data
export async function getOrgAllocation(partySlug: string) {
  const registrations = await getRegistrations(partySlug)
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
export async function getTicketTierInfo(partySlug: string) {
  try {
    // First get the party details
    const { data: party, error: partyError } = await supabase.from("parties").select("*").eq("slug", partySlug).single()

    if (partyError) {
      throw new Error("Failed to fetch party details")
    }

    // Get registrations for this party
    const tableName = `registrations_${partySlug.replace(/-/g, "_")}`
    const { data: registrations, error: regError } = await supabase
      .from(tableName)
      .select("*")
      .eq("status", "confirmed")

    if (regError) {
      throw new Error("Failed to fetch registrations")
    }

    const confirmedCount = registrations?.length || 0
    let currentTier = "Tier 1"
    let currentPrice = party.tier1_price
    let remainingInTier = party.tier1_capacity

    if (confirmedCount >= party.tier1_capacity) {
      currentTier = "Tier 2"
      currentPrice = party.tier2_price
      remainingInTier = party.tier1_capacity + party.tier2_capacity - confirmedCount
    }

    if (confirmedCount >= party.tier1_capacity + party.tier2_capacity) {
      currentTier = "Last Call"
      currentPrice = party.tier3_price
      remainingInTier = party.max_capacity - confirmedCount
    }

    return {
      currentTier,
      currentPrice,
      remainingInTier,
      totalRegistered: confirmedCount,
    }
  } catch (error) {
    console.error("Error getting ticket tier info:", error)
    return {
      currentTier: "Tier 1",
      currentPrice: null, // Will fall back to default price in component
      remainingInTier: null,
      totalRegistered: 0,
    }
  }
}

// Submit a new registration with QR code
export async function submitRegistration(partySlug: string, formData: z.infer<typeof registrationSchema>) {
  try {
    const validatedData = registrationSchema.parse(formData)
    const existingUser = await getRegistrationByAndrewID(validatedData.andrewID)

    if (existingUser) {
      return { success: false, message: "A registration with this Andrew ID already exists." }
    }

    const registrations = await getRegistrations(partySlug)
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
    const registration = await addRegistration(partySlug, {
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

export async function removeFromList(partySlug: string, id: number) {
  if (!(await isAuthenticated())) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    const tableName = `registrations_${partySlug.replace(/-/g, "_")}`
    await supabase.from(tableName).delete().eq("id", id)
    return { success: true, message: "Registration removed successfully" }
  } catch (error) {
    return { success: false, message: "Failed to remove registration" }
  }
}

// Admin functions (protected)
export async function removeFromWaitlist(partySlug: string, andrewID: string) {
  if (!(await isAuthenticated())) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    const tableName = `registrations_${partySlug.replace(/-/g, "_")}`
    await supabase.from(tableName).delete().eq("andrewID", andrewID)
    return { success: true, message: "Registration removed successfully" }
  } catch (error) {
    return { success: false, message: "Failed to remove registration" }
  }
}

export async function promoteFromWaitlist(partySlug: string, andrewID: string) {
  if (!(await isAuthenticated())) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    const tableName = `registrations_${partySlug.replace(/-/g, "_")}`
    await supabase.from(tableName).update({ status: "confirmed" }).eq("andrewID", andrewID)
    return { success: true, message: "Registration confirmed successfully" }
  } catch (error) {
    return { success: false, message: "Failed to update registration" }
  }
}

export async function verifyQRCode(partySlug: string, qrData: string) {
  if (!(await isAuthenticated())) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    const data = JSON.parse(qrData)
    const tableName = `registrations_${partySlug.replace(/-/g, "_")}`
    const { data: registration, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("andrewID", data.andrewID)
      .single()

    if (error || !registration) {
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
    const { data: existingParty, error: checkError } = await supabase
      .from("parties")
      .select("slug")
      .eq("slug", slug)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing party:", checkError)
      return {
        success: false,
        message: "Failed to check if party exists. Please try again.",
      }
    }

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
    const { data: party, error: insertError } = await supabase
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
      await supabase.from("parties").delete().eq("slug", slug) // Cleanup if exists
      return {
        success: false,
        message: "Failed to create party. Please try again.",
      }
    }

    // Create the registration table for this party
    const { error: fnError } = await supabase.rpc("create_party_registration_table", {
      party_slug: slug.replace(/-/g, "_"), // Replace hyphens with underscores for valid table names
    })

    if (fnError) {
      console.error("Function call error:", fnError)
      // Cleanup the party if table creation fails
      await supabase.from("parties").delete().eq("slug", slug)
      return {
        success: false,
        message: "Failed to set up registration system. Please try again.",
      }
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

export async function getPartyBySlug(slug: string) {
  try {
    const { data, error } = await supabase.from("parties").select("*").eq("slug", slug).single()

    if (error) {
      console.error("Error fetching party:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching party:", error)
    return null
  }
}

export async function addRegistration(
  partySlug: string,
  registration: Omit<Registration, "id" | "createdAt">,
): Promise<Registration> {
  const tableName = `registrations_${partySlug.replace(/-/g, "_")}`

  const { data, error } = await supabase.from(tableName).insert([registration]).select().single()

  if (error) {
    console.error("Error adding registration:", error)
    throw error
  }

  return data
}

export async function verifyPartyAdmin(partySlug: string, username: string, password: string) {
  try {
    const { data: party, error } = await supabase
      .from("parties")
      .select("admin_username, admin_password")
      .eq("slug", partySlug)
      .single()

    if (error || !party) {
      return false
    }

    return party.admin_username === username && party.admin_password === password
  } catch (error) {
    console.error("Error verifying admin:", error)
    return false
  }
}


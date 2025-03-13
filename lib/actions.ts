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
import type { PriceTier } from "@/components/price-tiers-modal"
import { sendEmail } from "./email"
import bcrypt from "bcrypt"

// Define the registration schema
const registrationSchema = z.object({
  name: z.string().min(2),
  age: z.string().refine((val) => !isNaN(Number.parseInt(val)) && Number.parseInt(val) >= 18, {
    message: "You must be at least 18 years old.",
  }),
  andrewID: z.string().min(3),
  organization: z.string().min(1), // Changed from enum to string to be more flexible
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
  tierName?: string
  tierPrice?: number
  confirmation_token?: string
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
  try {
    // Get registrations
    const registrations = await getRegistrations(partySlug)
    const confirmed = registrations.filter((reg) => reg.status === "confirmed")

    // Get organization limits
    const tableName = `org_limits_${partySlug.replace(/-/g, "_")}`

    // Check if the limits table exists
    const { data:tableExists, error } = await supabase
      .from(tableName)  // Dynamically reference the table
      .select('*');

    const orgLimits: Record<string, number> = {}

    if (tableExists && tableExists[0]) {
      // Fetch limits from the table
      const { data: limitsData } = await supabase.from(tableName).select("organization, limit_value")

      if (limitsData && limitsData.length > 0) {
        limitsData.forEach((item: any) => {
          orgLimits[item.organization] = item.limit_value
        })
      }
    }

    // If no limits are stored, use default allocation
    if (Object.keys(orgLimits).length === 0) {
      // Get party details for max capacity
      const { data: party } = await supabase
        .from("parties")
        .select("max_capacity, organizations")
        .eq("slug", partySlug)
        .single()

      if (party) {
        const organizations = party.organizations
        const baseValue = Math.floor(party.max_capacity / organizations.length)
        const remainder = party.max_capacity % organizations.length

        organizations.forEach((org: string, index: number) => {
          // Add one extra to the first 'remainder' organizations
          orgLimits[org] = index < remainder ? baseValue + 1 : baseValue
        })
      }
    }

    // Count registrations by organization
    const orgCounts: Record<string, number> = {}
    confirmed.forEach((reg) => {
      orgCounts[reg.organization] = (orgCounts[reg.organization] || 0) + 1
    })

    // Create allocation data
    return Object.entries(orgLimits).map(([name, total]) => {
      const used = orgCounts[name] || 0
      return {
        name,
        total,
        used,
        available: total - used,
      }
    })
  } catch (error) {
    console.error("Error getting org allocation:", error)
    return []
  }
}

// Get price tiers for a party
export async function getPriceTiers(partySlug: string): Promise<PriceTier[]> {
  try {
    // Get price tiers from the database
    const { data: tiersData, error } = await supabase
      .from("price_tiers")
      .select("*")
      .eq("party_slug", partySlug)
      .order("id", { ascending: true })

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows returned
      console.error("Error fetching price tiers:", error)
      return []
    }

    if (tiersData && tiersData.length > 0) {
      return tiersData.map((tier) => ({
        id: tier.id.toString(),
        name: tier.name,
        price: tier.price,
        capacity: tier.capacity,
      }))
    }

    // If no tiers are stored, get party details and create default tiers
    const { data: party } = await supabase
      .from("parties")
      .select("max_capacity, tier1_capacity, tier2_capacity, tier1_price, tier2_price, tier3_price")
      .eq("slug", partySlug)
      .single()

    if (party) {
      // Create default tiers based on the party configuration
      const tier3Capacity = party.max_capacity - party.tier1_capacity - party.tier2_capacity

      return [
        {
          id: "1",
          name: "Tier 1",
          price: party.tier1_price,
          capacity: party.tier1_capacity,
        },
        {
          id: "2",
          name: "Tier 2",
          price: party.tier2_price,
          capacity: party.tier2_capacity,
        },
        {
          id: "3",
          name: "Tier 3",
          price: party.tier3_price,
          capacity: tier3Capacity,
        },
      ]
    }

    return []
  } catch (error) {
    console.error("Error getting price tiers:", error)
    return []
  }
}

// Update price tiers for a party
export async function updatePriceTiers(
  partySlug: string,
  tiers: PriceTier[],
): Promise<{ success: boolean; message: string }> {
  if (!(await isAuthenticated(partySlug))) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    // Validate that the total capacity matches the party's max capacity
    const { data: party, error: partyError } = await supabase
      .from("parties")
      .select("max_capacity")
      .eq("slug", partySlug)
      .single()

    if (partyError) {
      console.error("Error fetching party:", partyError)
      return { success: false, message: "Failed to fetch party details" }
    }

    const totalCapacity = tiers.reduce((sum, tier) => sum + tier.capacity, 0)
    if (totalCapacity !== party.max_capacity) {
      // If the total capacity doesn't match the max capacity, update the max capacity
      if (totalCapacity > 0) {
        const { error: updateError } = await supabase
          .from("parties")
          .update({ max_capacity: totalCapacity })
          .eq("slug", partySlug)

        if (updateError) {
          console.error("Error updating max capacity:", updateError)
          return {
            success: false,
            message: `Total capacity (${totalCapacity}) must equal maximum capacity (${party.max_capacity}) or you must update the maximum capacity first`,
          }
        }
      } else {
        return {
          success: false,
          message: `Total capacity (${totalCapacity}) must equal maximum capacity (${party.max_capacity})`,
        }
      }
    }

    // Check if the price_tiers table exists, create it if not
    const { error: tableCheckError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS price_tiers (
          id SERIAL PRIMARY KEY,
          party_slug TEXT NOT NULL,
          name TEXT NOT NULL,
          price NUMERIC NOT NULL,
          capacity INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(party_slug, name)
        )
      `,
    })

    if (tableCheckError) {
      console.error("Error creating table:", tableCheckError)
      return { success: false, message: "Failed to create price tiers table" }
    }

    // Delete existing tiers for this party
    const { error: deleteError } = await supabase.from("price_tiers").delete().eq("party_slug", partySlug)

    if (deleteError) {
      console.error("Error deleting existing price tiers:", deleteError)
      return { success: false, message: "Failed to update price tiers" }
    }

    // Insert new tiers
    const tiersArray = tiers.map((tier) => ({
      party_slug: partySlug,
      name: tier.name,
      price: tier.price,
      capacity: tier.capacity,
    }))

    const { error: insertError } = await supabase.from("price_tiers").insert(tiersArray)

    if (insertError) {
      console.error("Error inserting price tiers:", insertError)
      return { success: false, message: "Failed to update price tiers" }
    }

    return { success: true, message: "Price tiers updated successfully" }
  } catch (error) {
    console.error("Error updating price tiers:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Get current ticket tier information
export async function getTicketTierInfo(partySlug: string) {
  try {
    // Get price tiers
    const priceTiers = await getPriceTiers(partySlug)

    // Get registrations for this party
    const registrations = await getRegistrations(partySlug)
    const confirmedCount = registrations.filter((reg) => reg.status === "confirmed").length

    // Find the current tier based on registration count
    let currentTier = priceTiers[0]
    let remainingInTier = currentTier?.capacity || 0
    let cumulativeCapacity = 0

    for (const tier of priceTiers) {
      cumulativeCapacity += tier.capacity
      if (confirmedCount < cumulativeCapacity) {
        currentTier = tier
        remainingInTier = cumulativeCapacity - confirmedCount
        break
      }
    }

    return {
      currentTier: currentTier?.name || "Standard",
      currentPrice: currentTier?.price || 15,
      remainingInTier,
      totalRegistered: confirmedCount,
    }
  } catch (error) {
    console.error("Error getting ticket tier info:", error)
    return {
      currentTier: "Standard",
      currentPrice: null, // Will fall back to default price in component
      remainingInTier: null,
      totalRegistered: 0,
    }
  }
}

// Submit a new registration with QR code
export async function submitRegistration(partySlug: string, formData: z.infer<typeof registrationSchema>) {
  try {
    console.log("Form data received:", formData) // Add this line for debugging

    const validatedData = registrationSchema.parse(formData)
    console.log("Validation passed:", validatedData) // Add this line for debugging

    const existingUser = await getRegistrationByAndrewID(validatedData.andrewID, partySlug)

    if (existingUser) {
      return { success: false, message: "A registration with this Andrew ID already exists." }
    }

    // Get party details
    const { data: party } = await supabase
      .from("parties")
      .select("max_capacity, ticket_price")
      .eq("slug", partySlug)
      .single()

    if (!party) {
      return { success: false, message: "Party not found." }
    }

    // Get registrations for this party
    const registrations = await getRegistrations(partySlug)
    const confirmedCount = registrations.filter((reg) => reg.status === "confirmed").length

    // Determine price (apply promo code if provided)
    let price = party.ticket_price
    let tierName = "Standard"

    if (formData.promoCode === "TCLISCOOL") {
      price = price * 0.8 // 20% discount
      tierName = "Promo"
    }

    // Generate QR code
    const qrData = {
      andrewID: validatedData.andrewID,
      name: validatedData.name,
      timestamp: new Date().toISOString(),
    }
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData))

    // Add the registration with initial status as "pending"
    const registration = await addRegistration(partySlug, {
      ...validatedData,
      age: Number.parseInt(validatedData.age),
      price,
      qrCode,
      status: confirmedCount < party.max_capacity ? "pending" : "waitlist", // Changed from "confirmed" to "pending"
      tierName,
      tierPrice: price,
    })

    return {
      success: true,
      message:
        registration.status === "pending"
          ? "Registration submitted! We are confirming your attendance. Please check your CMU email inbox for more details."
          : "You've been added to the waitlist.",
      // No longer returning QR code
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
  if (!(await isAuthenticated(partySlug))) {
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
  if (!(await isAuthenticated(partySlug))) {
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
  if (!(await isAuthenticated(partySlug))) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    const data = JSON.parse(qrData)
    const tableName = `registrations_${partySlug.replace(/-/g, "_")}`
    const { data: registration, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("andrew_id", data.andrewID)
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
  ticketPrice: z.number().min(0),
  venmoUsername: z.string().min(1),
  zelleInfo: z.string().min(1),
  adminUsername: z.string().min(1),
  adminPassword: z.string().min(6),
  eventDate: z.string().min(1),
  eventTime: z.string().min(1),
  location: z.string().min(1),
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

    // Insert the party into the database
    const { data: party, error: insertError } = await supabase
      .from("parties")
      .insert({
        slug,
        name: validatedData.name,
        organizations: organizations, //Store as comma separated string
        max_capacity: validatedData.maxCapacity,
        allow_waitlist: validatedData.allowWaitlist,
        ticket_price: validatedData.ticketPrice,
        venmo_username: validatedData.venmoUsername,
        zelle_info: validatedData.zelleInfo, // Added zelleInfo field
        admin_username: validatedData.adminUsername,
        admin_password: await bcrypt.hash(validatedData.adminPassword, 10), //Hash the password
        event_date: validatedData.eventDate,
        event_time: validatedData.eventTime,
        location: validatedData.location,
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

    // Ensure the price_tiers table exists
    await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS price_tiers (
          id SERIAL PRIMARY KEY,
          party_slug TEXT NOT NULL,
          name TEXT NOT NULL,
          price NUMERIC NOT NULL,
          capacity INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(party_slug, name)
        )
      `,
    })

    // Insert a single tier
    const initialTier = {
      party_slug: slug,
      name: "Standard",
      price: validatedData.ticketPrice,
      capacity: validatedData.maxCapacity,
    }

    await supabase.from("price_tiers").insert([initialTier])

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
  const { data, error } = await supabase.from("parties").select("*").eq("slug", slug).single()

  if (error) {
    console.error("Error fetching party:", error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    organizations: data.organizations,
    max_capacity: data.max_capacity,
    allow_waitlist: data.allow_waitlist,
    ticket_price: data.ticket_price,
    venmo_username: data.venmo_username,
    zelle_info: data.zelle_info,
    admin_username: data.admin_username,
    // admin_password: data.admin_password, //Removed for security
    created_at: data.created_at,
    event_date: data.event_date,
    event_time: data.event_time,
    location: data.location,
  }
}

export async function addRegistration(
  partySlug: string,
  registration: Omit<Registration, "id" | "createdAt">,
): Promise<Registration> {
  const tableName = `registrations_${partySlug.replace(/-/g, "_")}`

  // Convert camelCase to snake_case for database
  const dbRegistration = {
    name: registration.name,
    andrew_id: registration.andrewID,
    age: registration.age,
    organization: registration.organization,
    payment_method: registration.paymentMethod,
    payment_confirmed: registration.paymentConfirmed,
    status: registration.status,
    price: registration.price,
    qr_code: registration.qrCode,
    tier_name: registration.tierName,
    tier_price: registration.tierPrice,
    confirmation_token: registration.confirmation_token,
  }

  const { data, error } = await supabase.from(tableName).insert([dbRegistration]).select().single()

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

    return party.admin_username === username && (await bcrypt.compare(password, party.admin_password))
  } catch (error) {
    console.error("Error verifying admin:", error)
    return false
  }
}

export async function updateOrgLimits(partySlug: string, limits: Record<string, number>) {
  if (!(await isAuthenticated(partySlug))) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    // Validate that the total matches the party's max capacity
    const { data: party, error: partyError } = await supabase
      .from("parties")
      .select("max_capacity")
      .eq("slug", partySlug)
      .single()

    if (partyError) {
      console.error("Error fetching party:", partyError)
      return { success: false, message: "Failed to fetch party details" }
    }

    const totalLimits = Object.values(limits).reduce((sum, value) => sum + value, 0)
    if (totalLimits !== party.max_capacity) {
      // If the total limits don't match the max capacity, update the max capacity
      if (totalLimits > 0) {
        const { error: updateError } = await supabase
          .from("parties")
          .update({ max_capacity: totalLimits })
          .eq("slug", partySlug)

        if (updateError) {
          console.error("Error updating max capacity:", updateError)
          return {
            success: false,
            message: `Total limits (${totalLimits}) must equal maximum capacity (${party.max_capacity}) or you must update the maximum capacity first`,
          }
        }
      } else {
        return {
          success: false,
          message: `Total limits (${totalLimits}) must equal maximum capacity (${party.max_capacity})`,
        }
      }
    }

    // Store the limits in a separate table or in party metadata
    // For this example, we'll use a separate table called org_limits
    const tableName = `org_limits_${partySlug.replace(/-/g, "_")}`

    // Check if the table exists, create it if not
    const { error: tableCheckError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id SERIAL PRIMARY KEY,
          organization TEXT NOT NULL UNIQUE,
          limit_value INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `,
    })

    if (tableCheckError) {
      console.error("Error creating table:", tableCheckError)
      return { success: false, message: "Failed to create limits table" }
    }

    // Clear existing limits and insert new ones
    await supabase.from(tableName).delete().neq("id", 0) // Delete all records

    // Insert new limits
    const limitsArray = Object.entries(limits).map(([organization, limit]) => ({
      organization,
      limit_value: limit,
    }))

    const { error: insertError } = await supabase.from(tableName).insert(limitsArray)

    if (insertError) {
      console.error("Error inserting limits:", insertError)
      return { success: false, message: "Failed to update organization limits" }
    }

    return { success: true, message: "Organization limits updated successfully" }
  } catch (error) {
    console.error("Error updating org limits:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Add this new server action after the updateOrgLimits function

export async function updateMaxCapacity(
  partySlug: string,
  newCapacity: number,
): Promise<{ success: boolean; message: string }> {
  if (!(await isAuthenticated(partySlug))) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    // Validate the new capacity
    if (newCapacity < 1) {
      return { success: false, message: "Maximum capacity must be at least 1" }
    }

    // Get current party details
    const { data: party, error: partyError } = await supabase
      .from("parties")
      .select("max_capacity")
      .eq("slug", partySlug)
      .single()

    if (partyError) {
      console.error("Error fetching party:", partyError)
      return { success: false, message: "Failed to fetch party details" }
    }

    // Get current registrations count
    const registrations = await getRegistrations(partySlug)
    const confirmedCount = registrations.filter((reg) => reg.status === "confirmed").length

    // Check if new capacity is less than current confirmed registrations
    if (newCapacity < confirmedCount) {
      return {
        success: false,
        message: `New capacity (${newCapacity}) cannot be less than current confirmed registrations (${confirmedCount})`,
      }
    }

    // Update the party's max_capacity
    const { error: updateError } = await supabase
      .from("parties")
      .update({ max_capacity: newCapacity })
      .eq("slug", partySlug)

    if (updateError) {
      console.error("Error updating max capacity:", updateError)
      return { success: false, message: "Failed to update maximum capacity" }
    }

    // Update the price tier capacity if using a single tier
    const { data: tiers } = await supabase.from("price_tiers").select("*").eq("party_slug", partySlug)

    if (tiers && tiers.length === 1) {
      // If there's only one tier, update its capacity to match the new max capacity
      const { error: tierUpdateError } = await supabase
        .from("price_tiers")
        .update({ capacity: newCapacity })
        .eq("party_slug", partySlug)
        .eq("id", tiers[0].id)

      if (tierUpdateError) {
        console.error("Error updating price tier capacity:", tierUpdateError)
        // Not returning an error here as the main update was successful
      }
    }

    return { success: true, message: "Maximum capacity updated successfully" }
  } catch (error) {
    console.error("Error updating max capacity:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Add this new server action to send confirmation emails
export async function confirmAttendance(
  partySlug: string,
  andrewID: string,
): Promise<{ success: boolean; message: string }> {
  if (!(await isAuthenticated(partySlug))) {
    return { success: false, message: "Unauthorized" }
  }

  try {
    // Update the registration status to confirmed
    const tableName = `registrations_${partySlug.replace(/-/g, "_")}`
    console.log(andrewID)
    const { data: registration, error: fetchError } = await supabase
      .from(tableName)
      .select("*")
      .eq("andrew_id", andrewID)
      .single()

    if (fetchError || !registration) {
      console.error("Error fetching registration:", fetchError)
      return { success: false, message: "Registration not found" }
    }

    // Update status to confirmed
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ status: "confirmed" })
      .eq("andrew_id", andrewID)

    if (updateError) {
      console.error("Error updating registration status:", updateError)
      return { success: false, message: "Failed to confirm attendance" }
    }

    // Generate a unique token for the confirmation link
    const token = Buffer.from(`${andrewID}:${Date.now()}`).toString("base64")

    // Store the token in the database
    const { error: tokenError } = await supabase
      .from(tableName)
      .update({ confirmation_token: token })
      .eq("andrew_id", andrewID)

    if (tokenError) {
      console.error("Error storing confirmation token:", tokenError)
      return { success: false, message: "Failed to generate confirmation token" }
    }

    // Get party details for the email
    const { data: party } = await supabase.from("parties").select("name").eq("slug", partySlug).single()

    if (!party) {
      return { success: false, message: "Party not found" }
    }

    // Send email to the user using EmailJS
    const emailTo = `${andrewID}@andrew.cmu.edu`
    const confirmationLink = `https://cm-isomer.vercel.app/party/${partySlug}/ticket?token=${token}`

    const emailResult = await sendEmail({
      to_email: emailTo,
      to_name: registration.name,
      subject: `Your ${party.name} Ticket Confirmation`,
      message: `Your registration for ${party.name} has been confirmed! Please use the link below to access your ticket and QR code. You will need to show this QR code at the entrance.`,
      confirmation_link: confirmationLink,
      party_name: party.name,
    })

    if (!emailResult.success) {
      console.error("Failed to send confirmation email:", emailResult.message)
      // We still return success since the registration was confirmed, even if email failed
      return {
        success: true,
        message: `Attendance confirmed! Note: There was an issue sending the email to ${emailTo}`,
      }
    }

    return {
      success: true,
      message: `Attendance confirmed! Email sent to ${emailTo}`,
    }
  } catch (error) {
    console.error("Error confirming attendance:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Add this new server action to get a ticket by token
export async function getTicketByToken(partySlug: string, token: string) {
  try {
    const tableName = `registrations_${partySlug.replace(/-/g, "_")}`

    // Get the registration with the matching token
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("confirmation_token", token)
      .eq("status", "confirmed") // Only confirmed tickets can be viewed
      .single()

    if (error) {
      console.error("Error fetching ticket:", error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      andrewID: data.andrew_id,
      organization: data.organization,
      tierName: data.tier_name,
      tierPrice: data.tier_price,
      price: data.price,
      qrCode: data.qr_code,
    }
  } catch (error) {
    console.error("Error getting ticket by token:", error)
    return null
  }
}


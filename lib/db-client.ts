import { supabase } from "./supabase"

export type Registration = {
  id: number
  name: string
  andrewID: string
  age: number
  organization: string
  paymentMethod: string
  paymentConfirmed: string
  status: string
  createdAt: string
  price?: number
  qrCode?: string
}

// Helper function to convert snake_case to camelCase
function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel)
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())]: snakeToCamel(obj[key]),
      }),
      {},
    )
  }
  return obj
}

// Update the checkTableExists function to accept a partySlug parameter
async function checkTableExists(partySlug?: string): Promise<boolean> {
  try {
    // If partySlug is provided, check the party-specific table
    if (partySlug) {
      const tableName = `registrations_${partySlug.replace(/-/g, "_")}`
      const { error } = await supabase.from(tableName).select("id").limit(1)
      return !error
    }

    // Otherwise check the default registrations table
    const { error } = await supabase.from("registrations").select("id").limit(1)
    return !error
  } catch {
    return false
  }
}

// Update getAllRegistrations to use the party-specific table
export async function getAllRegistrations(partySlug?: string): Promise<Registration[]> {
  const tableExists = await checkTableExists(partySlug)

  if (!tableExists) {
    console.error("Table does not exist. Please run the setup SQL script in Supabase.")
    return []
  }

  const tableName = partySlug ? `registrations_${partySlug.replace(/-/g, "_")}` : "registrations"
  const { data, error } = await supabase.from(tableName).select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching registrations:", error)
    return []
  }

  return snakeToCamel(data || [])
}

// Update addRegistration to use the party-specific table
export async function addRegistration(
  partySlug: string,
  registration: Omit<Registration, "id" | "createdAt">,
): Promise<Registration> {
  const tableExists = await checkTableExists(partySlug)

  if (!tableExists) {
    throw new Error("Table does not exist. Please run the setup SQL script in Supabase.")
  }

  const tableName = `registrations_${partySlug.replace(/-/g, "_")}`

  // Convert camelCase to snake_case for database
  const dbRegistration = {
    name: registration.name,
    andrewID: registration.andrewID,
    age: registration.age,
    organization: registration.organization,
    payment_method: registration.paymentMethod,
    payment_confirmed: registration.paymentConfirmed,
    status: registration.status,
    price: registration.price,
    qr_code: registration.qrCode,
  }

  const { data, error } = await supabase.from(tableName).insert([dbRegistration]).select().single()

  if (error) {
    console.error("Error adding registration:", error)
    throw error
  }

  return snakeToCamel(data)
}

// Update getRegistrationByAndrewID to use the party-specific table
export async function getRegistrationByAndrewID(andrewID: string, partySlug?: string): Promise<Registration | null> {
  const tableExists = await checkTableExists(partySlug)

  if (!tableExists) {
    throw new Error("Table does not exist. Please run the setup SQL script in Supabase.")
  }

  const tableName = partySlug ? `registrations_${partySlug.replace(/-/g, "_")}` : "registrations"
  const { data, error } = await supabase.from(tableName).select("*").eq("andrew_id", andrewID).single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    console.error("Error fetching registration:", error)
    throw error
  }

  return data ? snakeToCamel(data) : null
}

// Update getRegistrationCountByOrg to use the party-specific table
export async function getRegistrationCountByOrg(organization: string, partySlug?: string): Promise<number> {
  const tableExists = await checkTableExists(partySlug)

  if (!tableExists) {
    return 0
  }

  const tableName = partySlug ? `registrations_${partySlug.replace(/-/g, "_")}` : "registrations"
  const { count, error } = await supabase
    .from(tableName)
    .select("*", { count: "exact", head: true })
    .eq("organization", organization)
    .eq("status", "confirmed")

  if (error) {
    console.error("Error counting registrations:", error)
    return 0
  }

  return count || 0
}

// Update removeRegistration to use the party-specific table
export async function removeRegistration(id: number, partySlug?: string) {
  const tableExists = await checkTableExists(partySlug)

  if (!tableExists) {
    throw new Error("Table does not exist. Please run the setup SQL script in Supabase.")
  }

  const tableName = partySlug ? `registrations_${partySlug.replace(/-/g, "_")}` : "registrations"
  const { error } = await supabase.from(tableName).delete().eq("id", id)

  if (error) {
    console.error("Error removing registration:", error)
    throw error
  }
}

// Update updateRegistrationStatus to use the party-specific table
export async function updateRegistrationStatus(andrewID: string, status: string, partySlug?: string) {
  const tableExists = await checkTableExists(partySlug)

  if (!tableExists) {
    throw new Error("Table does not exist. Please run the setup SQL script in Supabase.")
  }

  const tableName = partySlug ? `registrations_${partySlug.replace(/-/g, "_")}` : "registrations"
  const { error } = await supabase.from(tableName).update({ status }).eq("andrew_id", andrewID)

  if (error) {
    console.error("Error updating registration status:", error)
    throw error
  }
}


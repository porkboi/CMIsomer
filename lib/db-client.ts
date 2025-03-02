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

async function checkTableExists(): Promise<boolean> {
  try {
    const { error } = await supabase.from("registrations").select("id").limit(1)

    return !error
  } catch {
    return false
  }
}

export async function getAllRegistrations(): Promise<Registration[]> {
  const tableExists = await checkTableExists()

  if (!tableExists) {
    console.error("Table does not exist. Please run the setup SQL script in Supabase.")
    return []
  }

  const { data, error } = await supabase.from("registrations").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching registrations:", error)
    return []
  }

  return snakeToCamel(data || [])
}

export async function addRegistration(registration: Omit<Registration, "id" | "createdAt">): Promise<Registration> {
  const tableExists = await checkTableExists()

  if (!tableExists) {
    throw new Error("Table does not exist. Please run the setup SQL script in Supabase.")
  }

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
  }

  const { data, error } = await supabase.from("registrations").insert([dbRegistration]).select().single()

  if (error) {
    console.error("Error adding registration:", error)
    throw error
  }

  return snakeToCamel(data)
}

export async function getRegistrationByAndrewID(andrewID: string): Promise<Registration | null> {
  const tableExists = await checkTableExists()

  if (!tableExists) {
    throw new Error("Table does not exist. Please run the setup SQL script in Supabase.")
  }

  const { data, error } = await supabase.from("registrations").select("*").eq("andrew_id", andrewID).single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    console.error("Error fetching registration:", error)
    throw error
  }

  return data ? snakeToCamel(data) : null
}

export async function getRegistrationCountByOrg(organization: string): Promise<number> {
  const tableExists = await checkTableExists()

  if (!tableExists) {
    return 0
  }

  const { count, error } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("organization", organization)
    .eq("status", "confirmed")

  if (error) {
    console.error("Error counting registrations:", error)
    return 0
  }

  return count || 0
}

export async function removeRegistration(id: number) {
  const tableExists = await checkTableExists()

  if (!tableExists) {
    throw new Error("Table does not exist. Please run the setup SQL script in Supabase.")
  }

  const { error } = await supabase.from("registrations").delete().eq("id", id)

  if (error) {
    console.error("Error removing registration:", error)
    throw error
  }
}

export async function updateRegistrationStatus(andrewID: string, status: string) {
  const tableExists = await checkTableExists()

  if (!tableExists) {
    throw new Error("Table does not exist. Please run the setup SQL script in Supabase.")
  }

  const { error } = await supabase.from("registrations").update({ status }).eq("andrew_id", andrewID)

  if (error) {
    console.error("Error updating registration status:", error)
    throw error
  }
}


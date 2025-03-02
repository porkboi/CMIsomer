import { supabase } from "./supabase"

const INITIAL_DATA = [
  {
    name: "Christian Ang",
    andrewID: "cang2",
    age: 23,
    organization: "SSA",
    paymentMethod: "venmo",
    paymentConfirmed: "yes",
    status: "confirmed",
  },
  {
    name: "Ellyse Lai",
    andrewID: "ellysel",
    age: 19,
    organization: "HKSA",
    paymentMethod: "venmo",
    paymentConfirmed: "yes",
    status: "confirmed",
  },
]

export async function initializeDatabase() {
  try {
    // Check if table exists and has data
    const { data, error } = await supabase.from("registrations").select("*").limit(1)

    if (error) {
      console.error("Error checking database:", error)
      throw error
    }

    // If no data exists, insert initial data
    if (!data || data.length === 0) {
      const { error: insertError } = await supabase.from("registrations").insert(INITIAL_DATA)

      if (insertError) {
        console.error("Error inserting initial data:", insertError)
        throw insertError
      }
    }
  } catch (error) {
    console.error("Database initialization error:", error)
    throw error
  }
}


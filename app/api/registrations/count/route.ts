import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { registrationTableName } from "@/lib/table-names"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const partySlug = searchParams.get("partySlug")

  if (!partySlug) {
    return NextResponse.json({ error: "Party slug is required" }, { status: 400 })
  }

  try {
    const tableName = registrationTableName(partySlug)
    const { count, error } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true })
      .in("status", ["confirmed", "pending"])

    if (error) {
      console.error("Error counting registrations:", error)
      return NextResponse.json({ error: "Failed to count registrations" }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

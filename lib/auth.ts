"use server"

import { cookies } from "next/headers"
import { verifyPartyAdmin } from "./actions"
import { revalidatePath } from "next/cache"

export async function login(partySlug: string, username: string, password: string) {
  const isValid = await verifyPartyAdmin(partySlug, username, password)

  if (isValid) {
    (await cookies()).set(`party_auth_${partySlug}`, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
    })
    revalidatePath(`/party/${partySlug}`)
    return true
  }
  return false
}

export async function logout(partySlug: string) {
  (await cookies()).delete(`party_auth_${partySlug}`)
}

export async function isAuthenticated(partySlug?: string) {
  console.log(partySlug)
  return (await cookies()).get(`party_auth_${partySlug}`)?.value === "authenticated";
}


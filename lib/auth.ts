"use server"

import { cookies } from "next/headers"

const ADMIN_USERNAME = "porkboi"
const ADMIN_PASSWORD = "stevenshi"
const AUTH_COOKIE = "party_auth"

export async function login(username: string, password: string) {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    cookies().set(AUTH_COOKIE, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
    })
    return true
  }
  return false
}

export async function logout() {
  cookies().delete(AUTH_COOKIE)
}

export async function isAuthenticated() {
  return cookies().get(AUTH_COOKIE)?.value === "authenticated"
}


// Party-related type definitions

export interface Party {
  id: number
  name: string
  slug: string
  organizations: string[]
  max_capacity: number
  allow_waitlist: boolean
  ticket_price: number
  venmo_username: string
  zelle_info: string
  admin_username: string
  created_at: string
  event_date?: string
  event_time?: string
  location?: string
  enable_dating_pool?: boolean
  dating_lock_minutes?: number
  dating_pool_locked?: boolean
  enableSchedule: boolean
  schedule: string[]
}

export interface RegistrationFormProps {
  party: Party
  partySlug: string
}

export interface DashboardProps {
  party: Party
  partySlug: string
}

const PG_IDENTIFIER_LIMIT = 63

function normalizeSlug(slug: string): string {
  return slug.replace(/-/g, "_")
}

function shortHash(input: string): string {
  // djb2 variant, returns unsigned 32-bit and base36 string
  let hash = 5381
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i)
  }
  return (hash >>> 0).toString(36)
}

function limitIdentifier(base: string, maxLen: number, salt: string): string {
  if (base.length <= maxLen) return base

  const hash = shortHash(`${salt}:${base}`).slice(0, 10)
  const room = maxLen - hash.length - 1

  if (room <= 0) return hash.slice(0, maxLen)

  const trimmed = base.slice(0, room)
  return `${trimmed}_${hash}`
}

export function registrationTableSuffix(partySlug: string): string {
  // Leave room for "registrations_" + "_id_seq" in Postgres (63 char limit).
  const maxSuffix = PG_IDENTIFIER_LIMIT - "registrations_".length - "_id_seq".length
  return limitIdentifier(normalizeSlug(partySlug), maxSuffix, "registrations")
}

export function registrationTableName(partySlug: string): string {
  return `registrations_${registrationTableSuffix(partySlug)}`
}

export function orgLimitsTableName(partySlug: string): string {
  const maxSuffix = PG_IDENTIFIER_LIMIT - "org_limits_".length - "_id_seq".length
  return `org_limits_${limitIdentifier(normalizeSlug(partySlug), maxSuffix, "org_limits")}`
}

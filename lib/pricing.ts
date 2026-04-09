export const REFERRAL_DISCOUNT_PARTY_SLUG = "cmu-tcl-x-cmu-lambdas-x-pitt-asa-x-pitt-akdphi"

export const ANDREW_ID_PROMO_IDS = [
  "jasonshi",
  "rbustama",
  "brianpar",
  "yichenma",
  "wesleyzh",
  "tianzez",
  "yuehanh",
  "jaydenl",
  "zhanminl",
  "ruijianj",
  "kmawalkar",
  "justinku",
  "joonpyol",
  "chenggus",
  "adrianl2",
  "zhuoyunz",
  "zhengqiz",
  "siruid",
  "henryle2",
  "jonasq",
  "songyij",
  "myoun",
  "eugenehw",
  "pchivatx",
  "yimings2",
  "albertq",
  "yuhaoxie",
  "jinwooc",
  "xuefengm",
  "albertp2",
  "jeehol",
  "botaoche",
  "lucascho",
  "sqshu",
] as const

export const ANDREW_ID_PROMO_SET = new Set(ANDREW_ID_PROMO_IDS.map((id) => id.toLowerCase()))

export function getAndrewIdDiscount(partySlug: string, tierPrice: number): number {
  if (partySlug !== REFERRAL_DISCOUNT_PARTY_SLUG) {
    return 0
  }

  return tierPrice === 17 ? 5 : 1
}

export function applyAndrewIdDiscount(partySlug: string, tierPrice: number): number {
  return Math.max(0, tierPrice - getAndrewIdDiscount(partySlug, tierPrice))
}

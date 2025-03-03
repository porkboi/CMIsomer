import { Suspense } from "react"
import { notFound } from "next/navigation"
import { PartyHeader } from "@/components/party-header"
import { RegistrationForm } from "@/components/registration-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dashboard } from "@/components/dashboard"
import { LoginForm } from "@/components/login-form"
import { isAuthenticated } from "@/lib/auth"
import { getPartyBySlug } from "@/lib/actions"

interface PageProps {
  params: {
    slug: string
  }
}

export default async function PartyPage({ params }: PageProps) {
  const authenticated = await isAuthenticated(params.slug)
  const party = await getPartyBySlug(params.slug)

  if (!party) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <PartyHeader title={party.name} organizations={party.organizations} />

        <Tabs defaultValue="register" className="mt-8">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900">
            <TabsTrigger value="register" className="text-white">
              Register
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="text-white">
              Dashboard
            </TabsTrigger>
          </TabsList>
          <TabsContent value="register" className="mt-6">
            <Suspense fallback={<div>Loading...</div>}>
              <RegistrationForm
                partySlug={params.slug}
                maxCapacity={party.max_capacity}
                allowWaitlist={party.allow_waitlist}
                tier1Price={party.tier1_price}
                tier2Price={party.tier2_price}
                tier3Price={party.tier3_price}
                tier1Capacity={party.tier1_capacity}
                tier2Capacity={party.tier2_capacity}
                venmoUsername={party.venmo_username}
                organizations={party.organizations}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="dashboard" className="mt-6">
            {authenticated ? (
              <Suspense key="dashboard" fallback={<div>Loading...</div>}>
                <Dashboard
                  partySlug={params.slug}
                  organizations={party.organizations}
                  maxCapacity={party.max_capacity}
                  tier1Capacity={party.tier1_capacity}
                  tier2Capacity={party.tier2_capacity}
                />
              </Suspense>
            ) : (
              <Suspense key="login" fallback={<div>Loading...</div>}>
                <LoginForm partySlug={params.slug} adminUsername={party.admin_username} />
              </Suspense>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


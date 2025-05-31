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
  params: Promise<{
    slug: string
  }>
}

export default async function PartyPage(props: PageProps) {
  const params = await props.params;
  const authenticated = await isAuthenticated(params.slug)
  const party = await getPartyBySlug(params.slug)

  if (!party) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="container bg-zinc-800 mx-auto px-4 py-8">
        <PartyHeader
          title={party.name}
          organizations={party.organizations}
          eventDate={party.event_date}
          eventTime={party.event_time}
          location={party.location}
        />

        <Tabs defaultValue="register" className="mt-8">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900">
            <TabsTrigger value="register" className="text-white">
              Register
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="text-white">
              Dashboard
            </TabsTrigger>
          </TabsList>          <TabsContent value="register" className="bg-zinc-800 mt-6">
            <Suspense fallback={<div>Loading...</div>}>
              <RegistrationForm
                party={party}
                partySlug={params.slug}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="dashboard" className="bg-zinc-800 mt-6">
            {authenticated ? (
              <Suspense key="dashboard" fallback={<div>Loading...</div>}>
                <Dashboard
                  party={party}
                  partySlug={params.slug}
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


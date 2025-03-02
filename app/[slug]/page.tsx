import { Suspense } from "react"
import { PartyHeader } from "@/components/party-header"
import { RegistrationForm } from "@/components/registration-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dashboard } from "@/components/dashboard"
import { LoginForm } from "@/components/login-form"
import { isAuthenticated } from "@/lib/auth"

export default async function Home() {
  const authenticated = await isAuthenticated()

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <PartyHeader />

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
              <RegistrationForm />
            </Suspense>
          </TabsContent>
          <TabsContent value="dashboard" className="mt-6">
            {authenticated ? (
              <Suspense fallback={<div>Loading...</div>}>
                <Dashboard />
              </Suspense>
            ) : (
              <LoginForm />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


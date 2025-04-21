import { CreatePartyForm } from "@/components/create-party-form"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <div className="bg-zinc-900 min-h-screen bg-background text-foreground">
      <div className="bg-zinc-900 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text">
            CMIsomer: by the Tartan Cultural League
          </h1>
          <ThemeToggle />
        </div>
        <CreatePartyForm />
      </div>
    </div>
  )
}


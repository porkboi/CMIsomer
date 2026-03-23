import { CreatePartyForm } from "@/components/create-party-form"

export default function Home() {
  return (
    <div className="relative z-10 mx-auto min-h-[calc(100vh-11rem)] w-full max-w-6xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
      <div className="site-panel rounded-[2rem] p-6 sm:p-8">
        <div className="mb-8 space-y-3">
          <h1 className="font-[family:var(--font-brand)] text-4xl tracking-[0.12em] text-white sm:text-5xl">
            CMIsomer Party Builder
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-white/65 sm:text-base">
            Configure your event details, tiering, organization settings, and
            registration controls from a single setup flow.
          </p>
        </div>
        <CreatePartyForm />
      </div>
    </div>
  )
}

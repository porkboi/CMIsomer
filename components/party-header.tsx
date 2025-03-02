import { Sparkles } from "lucide-react"

export function PartyHeader() {
  return (
    <div className="text-center space-y-4">
      <div className="flex items-center justify-center gap-2">
        <Sparkles className="h-8 w-8 text-purple-500" />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text">
          TCL x ASA
        </h1>
        <Sparkles className="h-8 w-8 text-purple-500" />
      </div>
      <p className="text-zinc-400 max-w-2xl mx-auto">
        Join us for the coolest campus party of the year! Reserve your spot now before they're all gone.
      </p>
      <div className="flex flex-wrap justify-center gap-2 text-xs">
        <span className="px-3 py-1 rounded-full bg-purple-900/50 text-purple-300 border border-purple-700">SSA</span>
        <span className="px-3 py-1 rounded-full bg-blue-900/50 text-blue-300 border border-blue-700">HKSA</span>
        <span className="px-3 py-1 rounded-full bg-green-900/50 text-green-300 border border-green-700">SIAM</span>
        <span className="px-3 py-1 rounded-full bg-red-900/50 text-red-300 border border-red-700">KSA</span>
        <span className="px-3 py-1 rounded-full bg-yellow-900/50 text-yellow-300 border border-yellow-700">CSA</span>
        <span className="px-3 py-1 rounded-full bg-pink-900/50 text-pink-300 border border-pink-700">TSA</span>
        <span className="px-3 py-1 rounded-full bg-indigo-900/50 text-indigo-300 border border-indigo-700">ASA</span>
      </div>
    </div>
  )
}


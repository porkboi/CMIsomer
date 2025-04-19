import React from "react";
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-4">
      <Card className="bg-zinc-900 text-center max-w-md w-full shadow-xl rounded-2xl p-6 space-y-6">
        <h1 className="text-3xl font-bold">CMIsomer 🎉</h1>
        <p className="text-zinc-400">Plan your next event in just a few clicks.</p>
        <div className="flex flex-row gap-4 content-center">
          <a href="/create-party">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-2 px-4 shadow">
              Create New Party
            </Button>
          </a>
          <a href="/create-corporate">
            <Button className="w-full bg-zinc-700 hover:bg-zinc-600 text-white rounded-2xl py-2 px-4 shadow">
              Create New Function
            </Button>
          </a>
        </div>
      </Card>
    </div>
  );
}
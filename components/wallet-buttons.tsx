"use client";

import { Apple, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WalletButtons() {
  return (
    <div className="flex gap-4 mb-6 w-full">
      <Button
        className="flex-1 bg-black hover:bg-gray-900 text-white"
        onClick={() => alert("Apple Wallet integration coming soon!")}
      >
        <Apple className="mr-2 h-4 w-4" />
        Add to Apple Wallet
      </Button>

      <Button
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        onClick={() => alert("Google Wallet integration coming soon!")}
      >
        <Smartphone className="mr-2 h-4 w-4" />
        Add to Google Wallet
      </Button>
    </div>
  );
}

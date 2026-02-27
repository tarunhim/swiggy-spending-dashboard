"use client";

import { Loader2, UtensilsCrossed } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <div className="relative w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <p className="text-lg font-medium text-foreground">
            {message || "Fetching your orders..."}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          This may take a moment if you have many orders
        </p>
      </div>
    </div>
  );
}

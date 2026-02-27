"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Clock,
  ShieldCheck,
  Zap,
} from "lucide-react";
import LoginForm from "@/components/login-form";
import LoadingScreen from "@/components/loading-screen";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleToken = async (token: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch orders");
        setLoading(false);
        return;
      }

      if (!data.orders || data.orders.length === 0) {
        setError("No orders found. Please check your token and try again.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("swiggy_orders", JSON.stringify(data.orders));
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`Network error: ${msg}. Please try again.`);
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Fetching your Swiggy orders..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        {/* Hero */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Free &middot; Open Source &middot; No Data Stored
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight mb-4">
            Your Swiggy
            <span className="text-primary"> Spending</span>
            <br />
            Dashboard
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Login with your Swiggy account to see your complete order history,
            spending trends, favorite restaurants, and more.
          </p>
        </div>

        {/* Login Form */}
        <div className="mb-16 animate-fade-in-delay-1">
          <LoginForm onToken={handleToken} />
          {error && (
            <p className="text-destructive text-sm text-center mt-4">{error}</p>
          )}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16 animate-fade-in-delay-2">
          {[
            {
              icon: BarChart3,
              title: "Spending Breakdown",
              desc: "Monthly, weekly, daily trends with interactive charts",
            },
            {
              icon: TrendingUp,
              title: "Restaurant Analytics",
              desc: "Your top restaurants, most ordered items, cuisine preferences",
            },
            {
              icon: PieChart,
              title: "Category Insights",
              desc: "Cuisine breakdown, delivery fees, and savings analysis",
            },
            {
              icon: Clock,
              title: "Time Patterns",
              desc: "When you order most — by hour, day of week, and season",
            },
            {
              icon: ShieldCheck,
              title: "100% Private",
              desc: "Your data never leaves your browser. Nothing is stored.",
            },
            {
              icon: Zap,
              title: "Instant Analysis",
              desc: "Copy your token in one click — no technical knowledge needed",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors"
            >
              <f.icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold text-card-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="text-center mb-16 animate-fade-in-delay-3">
          <h2 className="text-2xl font-bold text-foreground mb-8">How it works</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
            {[
              { step: "1", text: "Log in to swiggy.com in your browser" },
              { step: "2", text: "Copy your session token with one click" },
              { step: "3", text: "Explore your spending dashboard" },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {s.step}
                </div>
                <p className="text-foreground font-medium">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground border-t border-border pt-8">
          <p>
            Built with Next.js &middot; Not affiliated with Swiggy &middot;{" "}
            <a href="https://github.com" className="text-primary hover:underline">
              Open Source
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

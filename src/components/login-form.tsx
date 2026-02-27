"use client";

import { useState, useRef, useEffect } from "react";
import {
  Phone,
  ArrowRight,
  Loader2,
  ShieldCheck,
  KeyRound,
} from "lucide-react";

interface LoginFormProps {
  onToken: (token: string) => void;
}

type LoginMethod = "otp" | "paste";

export default function LoginForm({ onToken }: LoginFormProps) {
  const [method, setMethod] = useState<LoginMethod>("paste");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [deviceId, setDeviceId] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === "otp" && otpRefs.current[0]) {
      otpRefs.current[0]?.focus();
    }
  }, [step]);

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "WAF_BLOCKED") {
          setError("Swiggy blocked this request. Please use the \"Paste Token\" method instead.");
          setMethod("paste");
        } else {
          setError(data.error || "Failed to send OTP");
        }
        return;
      }
      setDeviceId(data.deviceId);
      setStep("otp");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: phone, otp: otpValue, deviceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid OTP");
        return;
      }
      onToken(data.token);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSubmit = () => {
    if (!token.trim()) {
      setError("Please paste your session token");
      return;
    }
    onToken(token.trim());
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && otp.every((d) => d !== "")) {
      handleVerifyOtp();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Method Tabs */}
      <div className="flex bg-muted rounded-xl p-1 mb-4 gap-1">
        {(
          [
            { key: "paste" as const, label: "Paste Token", icon: KeyRound },
            { key: "otp" as const, label: "OTP Login", icon: Phone },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setMethod(tab.key);
              setError("");
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
              method === tab.key
                ? "bg-card text-card-foreground shadow-sm"
                : "text-muted-foreground hover:text-card-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
        {/* PASTE TOKEN METHOD */}
        {method === "paste" && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Paste Session Token</h2>
                <p className="text-sm text-muted-foreground">Quick setup — follow the steps below</p>
              </div>
            </div>

            <div className="space-y-3 mb-5 text-sm text-muted-foreground bg-muted/50 rounded-xl p-4">
              <p className="font-medium text-card-foreground">How to get your token:</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>
                  Open{" "}
                  <a
                    href="https://www.swiggy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    swiggy.com
                  </a>{" "}
                  and log in
                </li>
                <li>
                  Press{" "}
                  <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-xs font-mono">F12</kbd>{" "}
                  to open DevTools
                </li>
                <li>
                  Go to <strong>Application</strong> tab → <strong>Cookies</strong> → <strong>swiggy.com</strong>
                </li>
                <li>
                  Find{" "}
                  <code className="px-1 py-0.5 bg-card border border-border rounded text-xs font-mono">_session_tid</code>{" "}
                  and copy its value
                </li>
              </ol>
            </div>

            <textarea
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setError("");
              }}
              placeholder="Paste your _session_tid value here..."
              rows={4}
              className="w-full p-4 bg-muted border border-border rounded-xl text-card-foreground text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
            />

            {error && <p className="text-destructive text-sm mb-4 mt-2 px-1">{error}</p>}

            <button
              onClick={handleTokenSubmit}
              disabled={!token.trim()}
              className="w-full h-12 mt-4 bg-primary text-primary-foreground font-medium rounded-xl flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Analyze My Orders
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Your token is only used to fetch orders. It&apos;s never stored.</span>
            </div>
          </div>
        )}

        {/* OTP METHOD */}
        {method === "otp" && step === "phone" && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Login with OTP</h2>
                <p className="text-sm text-muted-foreground">Enter your registered phone number</p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-400">
                Note: Swiggy&apos;s bot protection may block this method. If it fails, use the &quot;Paste Token&quot; method instead.
              </p>
            </div>

            <div className="relative mb-4">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium flex items-center gap-1.5">
                <span>🇮🇳</span>
                <span>+91</span>
              </div>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                placeholder="9876543210"
                className="w-full h-14 pl-24 pr-4 bg-muted border border-border rounded-xl text-card-foreground text-lg font-mono tracking-widest placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                autoFocus
              />
            </div>

            {error && <p className="text-destructive text-sm mb-4 px-1">{error}</p>}

            <button
              onClick={handleSendOtp}
              disabled={loading || phone.length !== 10}
              className="w-full h-12 bg-primary text-primary-foreground font-medium rounded-xl flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {method === "otp" && step === "otp" && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-card-foreground">Enter OTP</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sent to +91 {phone.slice(0, 3)}****{phone.slice(7)}
              </p>
            </div>

            <div className="flex gap-2 mb-4 justify-center" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 bg-muted border border-border rounded-xl text-center text-xl font-mono text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              ))}
            </div>

            {error && (
              <p className="text-destructive text-sm mb-4 px-1 text-center">{error}</p>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.some((d) => !d)}
              className="w-full h-12 bg-primary text-primary-foreground font-medium rounded-xl flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verify & Analyze
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              onClick={() => {
                setStep("phone");
                setOtp(["", "", "", "", "", ""]);
                setError("");
              }}
              className="w-full mt-3 text-sm text-muted-foreground hover:text-card-foreground transition-colors"
            >
              Change phone number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

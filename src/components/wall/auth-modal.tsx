"use client";

import * as React from "react";
import { CheckCircle2, Loader2, LogIn, UserPlus } from "lucide-react";
import { ModalDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail, signUpWithEmail } from "@/lib/supabase";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: "signin" | "signup";
  onSuccess?: () => void;
}

export function AuthModal({
  open,
  onOpenChange,
  initialMode = "signin",
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = React.useState<"signin" | "signup">(initialMode);
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setMode(initialMode);
      setErrorMessage(null);
      setInfoMessage(null);
    }
  }, [open, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === "signin") {
        const res = await signInWithEmail(email, password);
        if (res.error) {
          setErrorMessage(res.error);
          return;
        }
        onSuccess?.();
        onOpenChange(false);
        setPassword("");
      } else {
        const res = await signUpWithEmail(email, password, displayName);
        if (res.error) {
          setErrorMessage(res.error);
          return;
        }
        if (res.needsEmailConfirmation) {
          setInfoMessage(
            "Account created! Please check your email to confirm your address, then sign in."
          );
          setMode("signin");
          setPassword("");
        } else {
          onSuccess?.();
          onOpenChange(false);
          setPassword("");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "signin" ? "Sign in to Wall" : "Create an account"}
      subtitle={
        mode === "signin"
          ? "Welcome back"
          : "Join the Wall to post and customize your profile"
      }
      className="max-w-md"
    >
      <div className="space-y-4">
        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 rounded-full border border-white/85 bg-[#E4EFECE6] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            className={`rounded-full py-1.5 text-xs font-medium transition-all ${
              mode === "signin"
                ? "bg-white text-[#1B2A2E] shadow-sm"
                : "text-[#3B5B63] hover:text-[#1B2A2E]"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMessage(null);
              setInfoMessage(null);
            }}
            className={`rounded-full py-1.5 text-xs font-medium transition-all ${
              mode === "signup"
                ? "bg-white text-[#1B2A2E] shadow-sm"
                : "text-[#3B5B63] hover:text-[#1B2A2E]"
            }`}
          >
            Create account
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {errorMessage}
          </div>
        )}

        {infoMessage && (
          <div className="flex items-start gap-2 rounded-xl border border-[#6B8E7B]/40 bg-[#6B8E7B]/15 px-3 py-2 text-xs text-[#284937]">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6B8E7B]" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <div className="space-y-1">
              <Label
                htmlFor="auth-name"
                className="font-sans text-xs normal-case tracking-normal"
              >
                Your name
              </Label>
              <Input
                id="auth-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Sora Takahashi"
                maxLength={50}
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <Label
              htmlFor="auth-email"
              className="font-sans text-xs normal-case tracking-normal"
            >
              Email
            </Label>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="auth-password"
              className="font-sans text-xs normal-case tracking-normal"
            >
              Password
            </Label>
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              required
            />
          </div>

          <Button
            type="submit"
            variant="amber"
            disabled={isSubmitting}
            className="mt-2 w-full font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {mode === "signin" ? "Signing in..." : "Creating account..."}
                </span>
              </>
            ) : mode === "signin" ? (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign in</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Create account</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </ModalDialog>
  );
}

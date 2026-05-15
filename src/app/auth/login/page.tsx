import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { LoginForm } from "@/features/auth/login-form";

export const metadata = {
  title: "Sign in · Productivity OS",
};

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "The sign-in link is missing or expired. Try again.",
  not_configured: "The server isn't configured for authentication yet.",
};

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawError = params["error"];
  const errorKey = Array.isArray(rawError) ? rawError[0] : rawError;
  const errorMessage = errorKey
    ? ERROR_MESSAGES[errorKey] ?? decodeURIComponent(errorKey)
    : null;

  return (
    <div className="ambient-bg flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="flex w-full max-w-[380px] flex-col gap-6">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-[12px] text-[var(--color-text-lo)] hover:text-[var(--color-text-mid)]"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden />
          Back
        </Link>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--color-text-hi)]">
            Welcome back
          </h1>
          <p className="text-[13px] text-[var(--color-text-mid)]">
            Sign in to sync your dashboard across devices.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3 py-2.5 text-[12px] text-[var(--color-danger)]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="rounded-[var(--radius-lg)] glass-hi p-6 shadow-[var(--shadow-md)]">
          <LoginForm />
        </div>

        <p className="text-center text-[11px] text-[var(--color-text-lo)]">
          No password — magic link or OAuth only.
        </p>
      </div>
    </div>
  );
}

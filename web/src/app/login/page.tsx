"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/features/auth";
import { getErrorMessage } from "@/lib/api/api-error";
import { getDefaultDashboardPath } from "@/lib/auth/route-guards";
import { Button } from "@/components/ui/button";
import { CONTROL_CLASSES } from "@/components/ui/form-field";
import { AuthShell, FormAlert, PasswordInput } from "@/components/layout/auth-shell";

/**
 * Only same-origin relative paths are honoured, to prevent open redirects via ?next=.
 * Rejects `//evil.com`, `/\evil.com` (browsers treat `\` as `/`) and control characters.
 */
function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || /[\\\u0000-\u001f]/.test(next)) return null;
  return next;
}

const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your institutional email, employee ID or roll number."),
  password: z.string().min(1, "Enter your password."),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const sessionExpired = searchParams.get("next") !== null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    try {
      const user = await login({ identifier: data.identifier, password: data.password });
      router.replace(safeNextPath(searchParams.get("next")) ?? getDefaultDashboardPath(user.role));
    } catch (err) {
      setAuthError(getErrorMessage(err));
    }
  };

  return (
    <AuthShell
      title="Sign in to Campus ERP"
      subtitle="Use the credentials issued by the institute."
      footer="Affiliated to Veer Madho Singh Bhandari Uttarakhand Technical University"
    >
      {authError ? (
        <FormAlert>{authError}</FormAlert>
      ) : (
        sessionExpired && (
          <p role="status" className="mb-5 p-3 rounded-xl bg-slate-50 border border-border-subtle text-sm text-slate-600">
            Please sign in to continue.
          </p>
        )
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="identifier" className="block text-sm font-medium text-slate-800">
            Email, employee ID or roll number
          </label>
          <input
            id="identifier"
            {...register("identifier")}
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={errors.identifier ? true : undefined}
            aria-describedby={errors.identifier ? "identifier-error" : undefined}
            className={`${CONTROL_CLASSES} h-11`}
          />
          {errors.identifier && (
            <p id="identifier-error" className="text-xs text-red-700">
              {errors.identifier.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-slate-800">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm font-medium text-primary-container hover:underline underline-offset-4 rounded">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            {...register("password")}
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="text-xs text-red-700">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} icon={!isSubmitting && <ArrowRight className="w-4 h-4 order-last" />}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

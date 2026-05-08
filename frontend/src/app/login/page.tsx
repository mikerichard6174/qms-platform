"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { getAuthSession } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [tenantId, setTenantId] = useState("");
  const [userId, setUserId] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function handleLogin() {
    setErrorMessage(null);
    setIsLoggingIn(true);

    try {
      const session = await getAuthSession(tenantId.trim(), userId.trim());

      sessionStorage.setItem("tenant_id", session.tenant_id);
      sessionStorage.setItem("user_id", session.user_id);
      sessionStorage.setItem("tenant_name", session.tenant_name);
      sessionStorage.setItem("user_name", session.full_name);
      sessionStorage.setItem("user_roles", JSON.stringify(session.roles));

      router.push("/");
    } catch (error) {
      console.error("Login failed:", error);
      setErrorMessage("Login failed. Check the tenant ID and user ID.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          QMS Platform
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Development Login
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Enter a tenant and user context for this browser session.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tenant ID
            </label>
            <input
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Tenant UUID"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              User ID
            </label>
            <input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="User UUID"
            />
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoggingIn ? "Logging in..." : "Log in"}
          </button>

          {errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
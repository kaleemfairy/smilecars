"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { clientAuth } from "@/lib/firebase/client";
import { Logo } from "@/components/site/Logo";

export default function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      const auth = clientAuth();
      const cred = await signInWithEmailAndPassword(auth, String(form.get("email")), String(form.get("password")));
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      // The server keeps the session in an httpOnly cookie; the browser session isn't needed.
      await signOut(auth);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Sign-in failed.");
        setBusy(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Wrong email or password.");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-brand-50 p-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4 p-6">
        <Logo />
        <h1 className="text-xl font-extrabold">Admin sign in</h1>
        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input id="email" name="email" type="email" required autoComplete="username" className="field" />
        </div>
        <div>
          <label htmlFor="password" className="field-label">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="btn btn-teal w-full">
          {busy && <Loader2 className="size-5 animate-spin" aria-hidden />}
          Sign in
        </button>
      </form>
    </main>
  );
}

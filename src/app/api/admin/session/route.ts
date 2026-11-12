import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/** Exchanges a fresh Firebase ID token for an httpOnly session cookie. Staff accounts only. */
export async function POST(req: Request) {
  if (!rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const idToken = typeof body?.idToken === "string" ? body.idToken : "";
  if (!idToken) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  try {
    const decoded = await adminAuth().verifyIdToken(idToken, true);
    // Only accept a token from a sign-in that just happened.
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    }
    const staff = await adminDb().collection("staff").doc(decoded.uid).get();
    if (!staff.exists || staff.data()?.active === false) {
      return NextResponse.json({ error: "This account does not have admin access." }, { status: 403 });
    }
    const expiresIn = SESSION_DAYS * 24 * 60 * 60 * 1000;
    const session = await adminAuth().createSessionCookie(idToken, { expiresIn });
    (await cookies()).set(SESSION_COOKIE, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn / 1000,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin session failed", err);
    return NextResponse.json({ error: "Sign-in failed. Please try again." }, { status: 401 });
  }
}

export async function DELETE() {
  const jar = await cookies();
  const value = jar.get(SESSION_COOKIE)?.value;
  jar.delete(SESSION_COOKIE);
  if (value) {
    try {
      const decoded = await adminAuth().verifySessionCookie(value);
      await adminAuth().revokeRefreshTokens(decoded.sub);
    } catch {
      /* already invalid */
    }
  }
  return NextResponse.json({ ok: true });
}

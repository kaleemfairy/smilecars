import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "./firebase/admin";
import type { Role, StaffMember } from "./types";

export const SESSION_COOKIE = "__session"; // the only cookie name Firebase Hosting forwards; harmless on Vercel
export const SESSION_DAYS = 5;

/** The signed-in staff member, or null. Checks the session cookie and the staff record every time. */
export async function getStaff(): Promise<StaffMember | null> {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true);
    const doc = await adminDb().collection("staff").doc(decoded.uid).get();
    const d = doc.data();
    if (!d || d.active === false || (d.role !== "owner" && d.role !== "staff")) return null;
    return { uid: decoded.uid, email: d.email ?? decoded.email ?? "", name: d.name ?? "", role: d.role as Role, active: true };
  } catch {
    return null;
  }
}

/** For admin pages: redirects to login if not signed in, or to /admin if the role is not allowed. */
export async function requireStaff(roles: Role[] = ["owner", "staff"]): Promise<StaffMember> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  if (!roles.includes(staff.role)) redirect("/admin");
  return staff;
}

/** For server actions: throws instead of redirecting. */
export async function assertStaff(roles: Role[] = ["owner", "staff"]): Promise<StaffMember> {
  const staff = await getStaff();
  if (!staff || !roles.includes(staff.role)) throw new Error("You don't have permission to do this.");
  return staff;
}

// Creates (or updates) the first owner account for /admin.
//   node scripts/create-owner.mjs owner@example.com "a-strong-password" "Owner Name"
// After this, the owner can add staff from Admin > Settings.
import { auth, db } from "./firebase-admin.mjs";

const [email, password, name = ""] = process.argv.slice(2);
if (!email || !password || password.length < 8) {
  console.error('Usage: node scripts/create-owner.mjs <email> <password (8+ chars)> "<name>"');
  process.exit(1);
}

let user = await auth.getUserByEmail(email).catch(() => null);
if (user) {
  await auth.updateUser(user.uid, { password, displayName: name || user.displayName });
  console.log(`Updated existing user ${email}`);
} else {
  user = await auth.createUser({ email, password, displayName: name });
  console.log(`Created user ${email}`);
}
await db.doc(`staff/${user.uid}`).set({ email, name, role: "owner", active: true, createdAt: Date.now() }, { merge: true });
console.log(`${email} is now an owner. Sign in at /admin/login`);
process.exit(0);

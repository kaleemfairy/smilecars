// Shared setup for the one-off scripts. Reads FIREBASE_SERVICE_ACCOUNT_BASE64 from .env.local.
import { readFileSync, existsSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!encoded) {
  console.error("Set FIREBASE_SERVICE_ACCOUNT_BASE64 in .env.local first (see README).");
  process.exit(1);
}
const app = initializeApp({ credential: cert(JSON.parse(Buffer.from(encoded, "base64").toString("utf8"))) });
export const db = getFirestore(app);
export const auth = getAuth(app);

import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

// Initialised lazily so `next build` works without credentials.
// Set FIREBASE_SERVICE_ACCOUNT_BASE64 to the base64 of the service-account JSON file.
let app: App | undefined;

function adminApp(): App {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) return (app = existing);

  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!encoded) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_BASE64 is not set. See README > Environment variables.",
    );
  }
  const serviceAccount = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
  return app;
}

// The bundler can load this module more than once (one copy per route bundle), but they all
// share the same Firebase app and Firestore instance, and settings() may only run once.
// Cache the configured instance on globalThis so every copy reuses it.
const g = globalThis as typeof globalThis & { __smilecarsDb?: Firestore };
export function adminDb(): Firestore {
  if (!g.__smilecarsDb) {
    const db = getFirestore(adminApp());
    try {
      db.settings({ ignoreUndefinedProperties: true });
    } catch {
      // Already configured by another copy of this module.
    }
    g.__smilecarsDb = db;
  }
  return g.__smilecarsDb;
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}

export function adminBucket() {
  return getStorage(adminApp()).bucket();
}

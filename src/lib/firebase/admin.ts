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

let db: Firestore | undefined;
export function adminDb(): Firestore {
  if (!db) {
    db = getFirestore(adminApp());
    db.settings({ ignoreUndefinedProperties: true });
  }
  return db;
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}

export function adminBucket() {
  return getStorage(adminApp()).bucket();
}

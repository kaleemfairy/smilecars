/** Runs a data loader and returns a fallback if it fails (e.g. Firebase not configured yet). */
export async function safe<T>(fn: () => Promise<T>, fallback: T, label = "data"): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`Failed to load ${label}:`, err);
    return fallback;
  }
}

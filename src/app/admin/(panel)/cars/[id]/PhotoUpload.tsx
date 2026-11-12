"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { uploadCarPhoto } from "../../../actions";

const MAX_SIDE = 1600;

/** Resizes the photo in the browser (max 1600px, JPEG) so uploads are small and fast. */
async function resize(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

export function PhotoUpload({ carId }: { carId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const small = await resize(file);
      const fd = new FormData();
      fd.set("id", carId);
      fd.set("photo", small);
      await uploadCarPhoto(fd); // redirects back to the page with a message
    } catch (err) {
      // redirect() from the server action surfaces as a navigation, not an error; anything else is a real failure
      if (!(err instanceof Error && err.message.includes("NEXT_REDIRECT"))) setError("Upload failed. Try a smaller photo.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={onChange} className="sr-only" id="photo" />
      <label htmlFor="photo" className={`btn btn-secondary cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
        {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Upload className="size-5" aria-hidden />}
        {busy ? "Uploading…" : "Add photo"}
      </label>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

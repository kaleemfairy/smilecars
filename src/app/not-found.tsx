import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60dvh] max-w-lg flex-col items-center justify-center py-16 text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-extrabold">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-muted">It may have moved. Try booking a car or browsing the fleet.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/book" className="btn btn-primary">Book a car</Link>
        <Link href="/" className="btn btn-secondary">Home</Link>
      </div>
    </div>
  );
}

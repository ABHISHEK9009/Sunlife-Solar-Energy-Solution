import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">404</p>
      <h1 className="mt-3 text-3xl font-extrabold text-slate-900">Page not found</h1>
      <p className="mt-3 text-slate-600">The page you requested is not available.</p>
      <Link href="/" className="mt-7 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">Return to website</Link>
    </main>
  );
}

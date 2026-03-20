import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full">
        <div className="mb-6 text-center">
          <Link href="/" className="font-[var(--font-heading)] text-4xl">
            Geesun Crafts
          </Link>
        </div>
        {children}
      </div>
    </main>
  );
}

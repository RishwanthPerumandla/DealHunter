'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="px-3 pb-4 pt-8 sm:px-4 sm:pb-5 sm:pt-10">
      <div className="shell-container premium-surface rounded-[30px] px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-500">
              DesiDeals
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
              A polished discovery layer for local food offers, restaurant specials, and happy
              hour finds, starting with strong Indian and Desi coverage and expanding outward.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/"
              className="rounded-full border border-black/8 bg-white/70 px-4 py-2.5 text-neutral-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-neutral-950"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-black/8 bg-white/70 px-4 py-2.5 text-neutral-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-neutral-950"
            >
              About
            </Link>
            <a
              href="/admin"
              className="rounded-full border border-black/8 bg-white/70 px-4 py-2.5 text-neutral-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-neutral-950"
            >
              Admin
            </a>
          </div>
        </div>

        <div className="mt-6 border-t border-black/6 pt-5 text-xs uppercase tracking-[0.18em] text-neutral-400">
          Curated local dining discovery, {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}

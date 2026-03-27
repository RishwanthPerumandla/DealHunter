'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Menu, Search, X } from 'lucide-react';
import { cuisineImages } from '@/lib/utils/cuisineImages';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '', label: 'Cuisines', dropdown: true },
  { href: '#explore', label: 'Explore' },
];

const cuisineLinks = [
  { name: 'Indian', deals: '148 live deals', image: cuisineImages.indian, value: 'indian' },
  { name: 'American', deals: '92 live deals', image: cuisineImages.american, value: 'fast_food' },
  { name: 'Italian', deals: '74 live deals', image: cuisineImages.italian, value: 'continental' },
  { name: 'Chinese', deals: '88 live deals', image: cuisineImages.chinese, value: 'chinese' },
  { name: 'Mexican', deals: '67 live deals', image: cuisineImages.mexican, value: 'other' },
  { name: 'Cafe', deals: '53 live deals', image: cuisineImages.cafe, value: 'other' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cuisinesOpen, setCuisinesOpen] = useState(false);

  const currentSection = useMemo(() => pathname || '/', [pathname]);

  const handleCuisineSelect = (value: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('headerCuisineSelect', {
          detail: { cuisine: value },
        })
      );
    }
    setCuisinesOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <div
        className="shell-container premium-surface relative rounded-[30px] px-4 py-3 sm:px-6"
        onMouseLeave={() => setCuisinesOpen(false)}
      >
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-[0_16px_34px_rgba(17,17,17,0.15)]">
              <span className="text-xl font-semibold [font-family:var(--font-display)]">D</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-neutral-500">
                Premium Local Finds
              </p>
              <p className="mt-0.5 text-lg font-semibold text-neutral-950">DesiDeals</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navLinks.map((link) => {
              const active =
                link.href === '/'
                  ? currentSection === '/'
                  : link.dropdown
                    ? cuisinesOpen
                    : false;

              if (link.dropdown) {
                return (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => setCuisinesOpen(true)}
                  >
                    <button
                      className={`nav-pill ${active ? 'nav-pill-active' : 'hover:bg-black/[0.04] hover:text-neutral-950'}`}
                    >
                      {link.label}
                    </button>
                  </div>
                );
              }

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`nav-pill ${active ? 'nav-pill-active' : 'hover:bg-black/[0.04] hover:text-neutral-950'}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button className="hidden rounded-full border border-black/8 bg-white/70 p-3 text-neutral-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-neutral-950 lg:inline-flex">
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="inline-flex rounded-full border border-black/8 bg-white/70 p-3 text-neutral-700 transition-all duration-300 hover:bg-white lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {cuisinesOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-1/2 top-[calc(100%-0.5rem)] hidden w-[720px] -translate-x-1/2 rounded-[28px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,244,238,0.97))] p-5 shadow-[0_30px_70px_rgba(15,23,42,0.15)] lg:block"
            >
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                    Curated cuisines
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-neutral-950">
                    Explore by craving
                  </h3>
                </div>
                <p className="text-sm text-neutral-500">Thoughtful picks with nearby offers</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {cuisineLinks.map((cuisine, index) => (
                  <motion.div
                    key={cuisine.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.045 }}
                  >
                    <button
                      type="button"
                      onClick={() => handleCuisineSelect(cuisine.value)}
                      className="group block overflow-hidden rounded-[22px] border border-black/8 bg-white/80 p-2.5 shadow-[0_14px_30px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(15,23,42,0.1)]"
                    >
                      <div className="overflow-hidden rounded-[18px]">
                        <img
                          src={cuisine.image}
                          alt={cuisine.name}
                          className="h-28 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex items-center justify-between px-1 pb-1 pt-3">
                        <div>
                          <p className="text-base font-semibold text-neutral-950">{cuisine.name}</p>
                          <p className="text-sm text-neutral-500">{cuisine.deals}</p>
                        </div>
                        <span className="rounded-full bg-neutral-950 p-2 text-white">
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden lg:hidden"
            >
              <div className="mt-4 space-y-3 border-t border-black/6 pt-4">
                <div className="grid gap-2">
                  {navLinks.map((link) => (
                    <button
                      key={link.label}
                      onClick={() => {
                        if (link.dropdown) {
                          setCuisinesOpen((value) => !value);
                        } else {
                          setMobileMenuOpen(false);
                        }
                      }}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium ${
                        link.dropdown && cuisinesOpen
                          ? 'bg-neutral-950 text-white'
                          : 'bg-white/70 text-neutral-700'
                      }`}
                    >
                      <span>{link.label}</span>
                      {link.dropdown && <ChevronRight className="h-4 w-4" />}
                    </button>
                  ))}
                </div>

                {cuisinesOpen && (
                  <div className="grid grid-cols-2 gap-3 rounded-[24px] border border-black/6 bg-white/75 p-3">
                    {cuisineLinks.map((cuisine) => (
                      <button
                        key={cuisine.name}
                        type="button"
                        onClick={() => handleCuisineSelect(cuisine.value)}
                        className="overflow-hidden rounded-[18px] border border-black/6 bg-white/90 text-left"
                      >
                        <img src={cuisine.image} alt={cuisine.name} className="h-24 w-full object-cover" />
                        <div className="p-3">
                          <p className="font-semibold text-neutral-950">{cuisine.name}</p>
                          <p className="text-xs text-neutral-500">{cuisine.deals}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

import React from 'react';
import { Home, UtensilsCrossed, CalendarRange, PackageCheck, User, ShoppingBag } from 'lucide-react';
import { useCampusBite } from '../context/CampusBiteContext';
import type { CustomerView } from '../types';

export function Navbar() {
  const {
    activeView,
    setActiveView,
    cartItemCount,
    cartTotal,
    setIsCartOpen,
  } = useCampusBite();

  const navItems: { id: CustomerView; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Menu' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'orders', label: 'My Orders' },
    { id: 'profile', label: 'Profile' },
  ];

  const mobileItems: { id: CustomerView; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'menu', label: 'Menu', icon: <UtensilsCrossed className="w-4 h-4" /> },
    { id: 'subscriptions', label: 'Plans', icon: <CalendarRange className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <PackageCheck className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line wordmark */}
          <button
            onClick={() => setActiveView('home')}
            className="group inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded-lg"
          >
            <span className="w-8 h-8 rounded-xl bg-[#18181B] group-hover:bg-[#EA580C] transition-colors flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="w-4.5 h-4.5 text-white"
              >
                <path
                  d="M4 13h16a8 8 0 0 1-16 0Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 7.5c0-1 .8-1.5.8-2.5M12 7c0-1.2.8-1.7.8-3M15 7.5c0-1 .8-1.5.8-2.5"
                  stroke="#F97316"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  className="group-hover:stroke-white transition-colors"
                />
              </svg>
            </span>
            <span className="font-display text-2xl font-bold tracking-[-0.03em] text-[#18181B]">
              Campus
              <span className="bg-gradient-to-r from-[#EA580C] to-[#D97706] bg-clip-text text-transparent">
                Bite
              </span>
            </span>
          </button>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
            {navItems.map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                    active
                      ? 'text-[#18181B] border-[#EA580C]'
                      : 'text-stone-600 border-transparent hover:text-[#18181B]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18181B] text-white text-sm font-medium hover:bg-[#EA580C] transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                Cart{cartItemCount > 0 ? ` (${cartItemCount}) · ₹${cartTotal}` : ''}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation (56px height, well within 15% sticky cap) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-white/95 backdrop-blur-md border-t border-stone-200 flex items-center justify-around px-2"
        aria-label="Mobile navigation"
      >
        {mobileItems.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-11 rounded-lg text-[11px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                active ? 'text-[#EA580C]' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

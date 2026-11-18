import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Bot,
  ChevronRight,
  MapPin,
  Search,
  Star,
  Tag,
} from 'lucide-react';
import { useCampusBite } from '../context/CampusBiteContext';
import {
  DEHRADUN_LOCATIONS,
  HERO_IMAGE,
  SUBSCRIPTION_PLANS,
} from '../data/seedData';
import type { FoodCategory } from '../types';
import { FoodCard } from './FoodCard';
import { FoodImage } from './Toast';

const HOME_CATEGORIES: { label: string; value: FoodCategory; note: string }[] = [
  { label: 'Breakfast', value: 'Breakfast', note: 'Poha, Paratha & Dosa' },
  { label: 'Lunch', value: 'Lunch', note: 'Rajma, Kadhi & Chole' },
  { label: 'Dinner', value: 'Dinner', note: 'Comfort Thalis & Egg Curry' },
  { label: 'Snacks', value: 'Snacks', note: 'Maggi & Exam Combos' },
  { label: 'Thalis', value: 'Thalis', note: 'Complete Steel Tiffins' },
  { label: 'Homemade Meals', value: 'Homemade Meals', note: 'Daily Ghar-Ka Khana' },
  { label: 'Beverages', value: 'Beverages', note: 'Masala Chai & Cold Coffee' },
];

export function HomeView({
  onSelectCategory,
  onSearchToMenu,
}: {
  onSelectCategory: (cat: FoodCategory) => void;
  onSearchToMenu: (query: string) => void;
}) {
  const {
    user,
    profile,
    loginWithGoogle,
    selectedLocation,
    setSelectedLocation,
    foodItems,
    banners,
    reviews,
    setActiveView,
    setIsAiOpen,
    setAppliedCouponCode,
    showToast,
  } = useCampusBite();

  const [homeSearch, setHomeSearch] = useState('');
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const activeBanners = useMemo(
    () => banners.filter((b) => b.isActive),
    [banners]
  );

  const todaysSpecials = useMemo(
    () => foodItems.filter((f) => f.isTodaysSpecial || f.isPopular).slice(0, 3),
    [foodItems]
  );

  const budgetMeals = useMemo(
    () => foodItems.filter((f) => f.price <= 85 && f.availability).slice(0, 3),
    [foodItems]
  );

  const bestsellers = useMemo(
    () => foodItems.filter((f) => f.isBestseller).slice(0, 3),
    [foodItems]
  );

  const recentlyAdded = useMemo(() => foodItems.slice(-3).reverse(), [foodItems]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchToMenu(homeSearch);
  };

  const featuredBanner = activeBanners[0];

  return (
    <div className="pb-20 md:pb-12">
      {/* Slim Dismissible Promotional Strip */}
      {featuredBanner && !dismissedBanner && (
        <div className="bg-[#18181B] text-white text-xs py-2 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Tag className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
              <span className="font-medium truncate">
                {featuredBanner.title} — {featuredBanner.subtitle}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {featuredBanner.couponCode && (
                <button
                  onClick={() => {
                    setAppliedCouponCode(featuredBanner.couponCode!);
                    showToast(`Coupon ${featuredBanner.couponCode} saved for your cart!`, 'success');
                  }}
                  className="font-mono font-semibold text-[#F97316] hover:underline cursor-pointer"
                >
                  {featuredBanner.ctaLabel || `Use ${featuredBanner.couponCode}`}
                </button>
              )}
              <button
                onClick={() => setDismissedBanner(true)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Utility Toolbar: Dehradun Campus Location + Search + Auth + AI */}
      <section className="border-b border-stone-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-[#EA580C] shrink-0" />
            <label htmlFor="campus-location" className="text-xs text-stone-500 shrink-0">
              Delivering to:
            </label>
            <select
              id="campus-location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="text-xs sm:text-sm font-semibold text-[#18181B] bg-transparent focus:outline-none cursor-pointer truncate max-w-xs sm:max-w-sm"
            >
              {DEHRADUN_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={homeSearch}
                onChange={(e) => setHomeSearch(e.target.value)}
                placeholder="Search rajma, thali, poha..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 bg-[#FAF7F2] focus:bg-white focus:outline-none focus:border-[#EA580C]"
              />
            </form>

            <button
              onClick={() => setIsAiOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-[#18181B] hover:border-[#EA580C] hover:text-[#EA580C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>AI Meal Guide</span>
            </button>

            {!user ? (
              <button
                onClick={loginWithGoogle}
                className="px-4 py-2 rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-[#EA580C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Login / Sign Up
              </button>
            ) : (
              <button
                onClick={() => setActiveView('profile')}
                className="px-3.5 py-2 rounded-xl bg-stone-100 text-xs font-semibold text-stone-800 hover:bg-stone-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Hi, {(profile?.name || user.displayName || 'Student').split(' ')[0]}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Hero Split Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col justify-center py-2"
          >
            <div className="flex items-center gap-3 text-xs font-semibold text-[#EA580C] mb-3.5">
              <span className="w-6 h-px bg-[#EA580C]" aria-hidden="true" />
              <span>Dehradun Campus Kitchens · Hostels &amp; PGs</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.35rem] font-bold text-[#18181B] tracking-[-0.03em] leading-[1.06] text-balance mb-5">
              <motion.span
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="block text-5xl sm:text-6xl font-bold tracking-[-0.04em] bg-gradient-to-r from-[#18181B] via-[#EA580C] to-[#D97706] bg-clip-text text-transparent pb-1.5"
              >
                CampusBite
              </motion.span>
              Homemade happiness at{' '}
              <span className="relative inline-block text-[#EA580C]">
                student-friendly
                <svg
                  viewBox="0 0 240 12"
                  fill="none"
                  aria-hidden="true"
                  className="absolute -bottom-1.5 left-0 w-full h-2.5 text-[#F97316]/70"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 9.5C68 2.5 162 1.5 238 7.5"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{' '}
              prices.
            </h1>
            <p className="text-base text-stone-600 leading-relaxed max-w-xl mb-7">
              Freshly prepared north and south Indian meals cooked with low oil and zero mess shortcuts — delivered hot to your hostel gate or PG room across Dehradun.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setActiveView('menu')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#EA580C] text-white text-sm font-semibold hover:bg-[#C2410C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Order Today&apos;s Menu</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveView('subscriptions')}
                className="inline-flex items-center gap-1.5 px-5 py-3.5 rounded-xl border border-stone-300 bg-white text-sm font-semibold text-[#18181B] hover:border-[#18181B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Weekly &amp; Monthly Tiffins</span>
              </button>
            </div>
          </motion.div>

          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[280px] sm:min-h-[360px] rounded-2xl overflow-hidden bg-stone-900">
              <FoodImage
                src={HERO_IMAGE}
                alt="CampusBite Homemade Indian Thali Feast"
                className="w-full h-full lg:h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-xs text-stone-200 mb-1">
                  Today&apos;s Student Favourite · 18 mins prep
                </p>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-display text-xl font-semibold">
                    Ghar-Ka Paneer &amp; Dal Makhani Thalis
                  </p>
                  <span className="font-mono text-lg font-bold text-[#F97316] tabular-nums shrink-0">
                    From ₹65
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Campus Proof Strip */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white border border-stone-200/80 rounded-2xl p-5">
          <div>
            <div className="font-mono text-2xl font-bold text-[#18181B] tabular-nums">₹100</div>
            <div className="text-xs text-stone-500 mt-0.5">Average full meal price</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-[#18181B] tabular-nums">25 min</div>
            <div className="text-xs text-stone-500 mt-0.5">Avg. hostel gate delivery</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-[#18181B] tabular-nums">6 Zones</div>
            <div className="text-xs text-stone-500 mt-0.5">Dehradun university corridors</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-[#18181B] tabular-nums">4.8 ★</div>
            <div className="text-xs text-stone-500 mt-0.5">Rated across 1,900+ student orders</div>
          </div>
        </div>
      </section>

      {/* Categories Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#18181B]">
              Browse by Meal Time
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              From 8 AM lecture breakfasts to 11 PM exam-night Maggi.
            </p>
          </div>
          <button
            onClick={() => setActiveView('menu')}
            className="text-xs font-semibold text-[#EA580C] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            Full Menu <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {HOME_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onSelectCategory(cat.value)}
              className="text-left p-4 rounded-2xl bg-white border border-stone-200/80 hover:border-[#EA580C] transition-colors cursor-pointer group"
            >
              <div className="font-display text-sm font-semibold text-[#18181B] group-hover:text-[#EA580C] transition-colors">
                {cat.label}
              </div>
              <div className="text-xs text-stone-500 mt-1 line-clamp-1">{cat.note}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Today's Special & Popular Meals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#18181B]">
              Today&apos;s Special &amp; Popular Meals
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              Freshly prepared batches leaving our Dehradun kitchen every 20 minutes.
            </p>
          </div>
          <button
            onClick={() => setActiveView('menu')}
            className="text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer"
          >
            See all {foodItems.length} dishes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {todaysSpecials.map((item) => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Student Budget Meals (Under ₹85) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#18181B]">
              Student Budget Picks (₹85 &amp; Under)
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              Full, hearty portions designed for daily hostel budgets.
            </p>
          </div>
          <button
            onClick={() => setIsAiOpen(true)}
            className="text-xs font-semibold text-[#EA580C] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            Ask AI for a ₹100 combo <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgetMeals.map((item) => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Bestsellers & Recently Added Split Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-stone-200/80 rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold text-[#18181B] mb-1">
              Campus Bestsellers
            </h3>
            <p className="text-xs text-stone-500 mb-5">
              Most reordered meals across Bidholi &amp; Clement Town.
            </p>
            <div className="divide-y divide-stone-100">
              {bestsellers.map((item) => (
                <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FoodImage
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-12 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-stone-900 truncate">{item.name}</div>
                      <div className="text-xs text-stone-500">
                        {item.category} · {item.rating.toFixed(1)} ★
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-sm font-semibold text-[#18181B] tabular-nums shrink-0">
                    ₹{item.price}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-stone-200/80 rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold text-[#18181B] mb-1">
              Recently Added to Kitchen
            </h3>
            <p className="text-xs text-stone-500 mb-5">
              New student requests added to our rotating menu.
            </p>
            <div className="divide-y divide-stone-100">
              {recentlyAdded.map((item) => (
                <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FoodImage
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-12 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-stone-900 truncate">{item.name}</div>
                      <div className="text-xs text-stone-500">
                        {item.preparationTime} mins prep · {item.isVeg ? 'Pure Veg' : 'Egg / Non-Veg'}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-sm font-semibold text-[#18181B] tabular-nums shrink-0">
                    ₹{item.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Meal Subscriptions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="bg-[#18181B] text-white rounded-2xl p-6 sm:p-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-medium text-[#F97316] mb-2">
                Configurable Sample Tiffin Plans
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-balance">
                Skip the hostel mess queue with weekly &amp; monthly meal plans.
              </h2>
            </div>
            <button
              onClick={() => setActiveView('subscriptions')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA580C] text-white text-xs font-semibold hover:bg-[#C2410C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Compare All 6 Plans <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SUBSCRIPTION_PLANS.slice(0, 3).map((plan) => (
              <div
                key={plan.id}
                className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs text-stone-400 mb-1">{plan.audienceLabel}</div>
                  <h3 className="font-display text-lg font-semibold text-white mb-2">
                    {plan.planType}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="font-mono text-2xl font-bold text-[#F97316] tabular-nums">
                      ₹{plan.price}
                    </span>
                    <span className="text-xs text-stone-400 tabular-nums">
                      / {plan.totalMeals} meals (₹{plan.perMealCost}/meal)
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-stone-300 mb-5">
                    {plan.highlights.map((h) => (
                      <li key={h}>· {h}</li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => setActiveView('subscriptions')}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-[#EA580C] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Configure Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-[#18181B]">
            Trusted by Dehradun Hostellers
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Verified student feedback from UPES, Graphic Era, and DIT campuses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reviews.slice(0, 3).map((rev) => (
            <blockquote
              key={rev.id}
              className="bg-white border border-stone-200/80 rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-3">
                  {Array.from({ length: rev.rating }).map((_, idx) => (
                    <Star key={idx} className="w-3.5 h-3.5 fill-amber-500" />
                  ))}
                </div>
                <p className="text-sm text-stone-700 leading-relaxed mb-4">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>
              <footer className="text-xs text-stone-500 pt-3 border-t border-stone-100">
                <span className="font-semibold text-stone-900">{rev.userName}</span>
                {rev.campus && <span> · {rev.campus}</span>}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* Clean Site Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-stone-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            <span className="font-display font-bold text-sm text-[#18181B]">CampusBite</span>
            <span className="ml-2">· Dehradun, Uttarakhand · Homemade Meals for Students</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              onClick={() => setActiveView('about')}
              className="hover:text-[#18181B] cursor-pointer"
            >
              About &amp; Contact
            </button>
            <a
              href="https://wa.me/919876543210?text=Hi%20CampusBite%20Dehradun%2C%20I%20need%20help%20with%20my%20order."
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 font-medium hover:underline"
            >
              WhatsApp Support
            </a>
            <button
              onClick={() => setActiveView('subscriptions')}
              className="hover:text-[#18181B] cursor-pointer"
            >
              Tiffin Plans
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

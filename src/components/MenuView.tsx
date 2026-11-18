import React, { useMemo, useState } from 'react';
import { Bot, Search, SlidersHorizontal } from 'lucide-react';
import { useCampusBite } from '../context/CampusBiteContext';
import type { FoodCategory } from '../types';
import { FoodCard } from './FoodCard';

const CATEGORIES: ('All' | FoodCategory)[] = [
  'All',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'Beverages',
  'Thalis',
  'Homemade Meals',
];

export function MenuView({
  initialCategory = 'All',
  initialSearch = '',
}: {
  initialCategory?: 'All' | FoodCategory;
  initialSearch?: string;
}) {
  const { foodItems, loadingData, setIsAiOpen } = useCampusBite();
  const [selectedCategory, setSelectedCategory] = useState<'All' | FoodCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [vegOnly, setVegOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'popular' | 'price_asc' | 'rating' | 'prep'>('popular');

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return foodItems
      .filter((item) => {
        if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
        if (vegOnly && !item.isVeg) return false;
        if (maxPrice > 0 && item.price > maxPrice) return false;
        if (q) {
          const hay = `${item.name} ${item.description} ${item.category} ${(item.ingredients || []).join(' ')}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'prep') return a.preparationTime - b.preparationTime;
        return Number(b.isBestseller || false) - Number(a.isBestseller || false);
      });
  }, [foodItems, selectedCategory, vegOnly, maxPrice, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-14">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#18181B]">
            CampusBite Menu
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Freshly cooked student meals from ₹40 to ₹150 across 7 daily categories.
          </p>
        </div>

        <button
          onClick={() => setIsAiOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-[#EA580C] transition-colors self-start md:self-auto cursor-pointer"
        >
          <Bot className="w-4 h-4 text-[#F97316]" />
          <span>Need a ₹100 Meal Combo? Ask AI</span>
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-5">
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-[#EA580C] text-white'
                  : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-400'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-3.5 mb-7 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by dish, ingredient, or mood (e.g. paneer, poha, dal)..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-stone-200 bg-[#FAF7F2] focus:bg-white focus:outline-none focus:border-[#EA580C]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setVegOnly((v) => !v)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
              vegOnly
                ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'
            }`}
          >
            Pure Veg Only
          </button>

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white">
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              aria-label="Filter by budget"
              className="text-xs font-medium text-stone-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={0}>Any Budget</option>
              <option value={75}>Under ₹75</option>
              <option value={100}>Under ₹100</option>
              <option value={130}>Under ₹130</option>
            </select>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            aria-label="Sort dishes"
            className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-700 focus:outline-none cursor-pointer"
          >
            <option value="popular">Sort: Popular</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="rating">Highest Rated</option>
            <option value="prep">Fastest Prep Time</option>
          </select>
        </div>
      </div>

      {loadingData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white border border-stone-200 rounded-2xl h-80 animate-pulse"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <h3 className="font-display text-lg font-semibold text-stone-900 mb-1">
            No matching meals found
          </h3>
          <p className="text-sm text-stone-500 mb-5">
            Try clearing your price filter or searching for another dish.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
              setVegOnly(false);
              setMaxPrice(0);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#EA580C] text-white text-xs font-semibold hover:bg-[#C2410C] cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

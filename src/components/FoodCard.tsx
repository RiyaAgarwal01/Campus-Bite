import React from 'react';
import { Heart, Minus, Plus, Star } from 'lucide-react';
import { useCampusBite } from '../context/CampusBiteContext';
import type { FoodItem } from '../types';
import { FoodImage, VegIndicator } from './Toast';

export function FoodCard({ item }: { item: FoodItem }) {
  const {
    cart,
    addToCart,
    updateCartQty,
    setSelectedFood,
    profile,
    toggleFavorite,
  } = useCampusBite();

  const cartEntry = cart.find((c) => c.foodId === item.id);
  const qty = cartEntry?.quantity || 0;
  const isFav = profile?.favorites?.includes(item.id) || false;

  return (
    <article className="group bg-white border border-stone-200/80 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        onClick={() => setSelectedFood(item)}
        className="relative aspect-[4/3] bg-stone-100 overflow-hidden cursor-pointer"
      >
        <FoodImage
          src={item.image}
          alt={item.name}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
            !item.availability ? 'grayscale opacity-70' : ''
          }`}
        />
        {!item.availability && (
          <div className="absolute inset-0 bg-stone-950/45 flex items-center justify-center">
            <span className="text-xs font-semibold tracking-wide text-white bg-stone-900/90 px-3 py-1 rounded-lg">
              Sold Out Today
            </span>
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(item.id);
          }}
          aria-label={isFav ? `Remove ${item.name} from favourites` : `Save ${item.name} to favourites`}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-stone-200/80 flex items-center justify-center text-stone-600 hover:text-[#EA580C] transition-colors cursor-pointer"
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-[#EA580C] text-[#EA580C]' : ''}`} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Unboxed metadata row (Zero-Pill Discipline) */}
        <div className="flex items-center justify-between gap-2 text-xs text-stone-500 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <VegIndicator isVeg={item.isVeg} />
            <span className="truncate">{item.category}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums shrink-0">{item.preparationTime} min</span>
          </div>
          <div className="flex items-center gap-1 text-stone-800 font-medium tabular-nums shrink-0">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{item.rating.toFixed(1)}</span>
          </div>
        </div>

        <button
          onClick={() => setSelectedFood(item)}
          className="text-left font-display text-base font-semibold text-[#18181B] hover:text-[#EA580C] transition-colors line-clamp-1 mb-1 cursor-pointer"
        >
          {item.name}
        </button>

        <p className="text-xs text-stone-600 leading-relaxed line-clamp-2 mb-4 flex-1">
          {item.description}
        </p>

        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-mono text-base font-semibold text-[#18181B] tabular-nums">
              ₹{item.price}
            </span>
          </div>

          {!item.availability ? (
            <span className="text-xs font-medium text-stone-400">Unavailable</span>
          ) : qty === 0 ? (
            <button
              onClick={() => addToCart(item, 1)}
              className="px-4 py-2 rounded-xl bg-[#EA580C] text-white text-xs font-semibold hover:bg-[#C2410C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Add to Cart
            </button>
          ) : (
            <div className="inline-flex items-center bg-stone-100 rounded-xl p-0.5 border border-stone-200">
              <button
                onClick={() => updateCartQty(item.id, qty - 1)}
                aria-label={`Decrease quantity of ${item.name}`}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-700 hover:bg-white transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 text-center font-mono text-xs font-semibold text-[#18181B] tabular-nums">
                {qty}
              </span>
              <button
                onClick={() => updateCartQty(item.id, qty + 1)}
                aria-label={`Increase quantity of ${item.name}`}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-700 hover:bg-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

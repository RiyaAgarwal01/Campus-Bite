import React, { useMemo, useState } from 'react';
import { Clock, Flame, Heart, Minus, Plus, Star, X } from 'lucide-react';
import { useCampusBite } from '../context/CampusBiteContext';
import { formatFirestoreDate } from '../lib/firebase';
import { FoodImage, VegIndicator } from './Toast';

export function FoodDetailModal() {
  const {
    selectedFood,
    setSelectedFood,
    foodItems,
    addToCart,
    reviews,
    submitReview,
    user,
    profile,
    toggleFavorite,
    loginWithGoogle,
  } = useCampusBite();

  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const itemReviews = useMemo(() => {
    if (!selectedFood) return [];
    return reviews.filter((r) => r.foodId === selectedFood.id);
  }, [reviews, selectedFood]);

  const relatedMeals = useMemo(() => {
    if (!selectedFood) return [];
    return foodItems
      .filter((f) => f.id !== selectedFood.id && f.availability)
      .sort((a, b) => (a.category === selectedFood.category ? -1 : 1) - (b.category === selectedFood.category ? -1 : 1))
      .slice(0, 3);
  }, [foodItems, selectedFood]);

  if (!selectedFood) return null;

  const isFav = profile?.favorites?.includes(selectedFood.id) || false;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 3) return;
    setSubmitting(true);
    try {
      await submitReview(selectedFood.id, rating, comment);
      setComment('');
      setRating(5);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="food-detail-title"
    >
      <div className="bg-white rounded-2xl border border-stone-200 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-stone-100 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <VegIndicator isVeg={selectedFood.isVeg} />
            <span>{selectedFood.category}</span>
            <span aria-hidden="true">·</span>
            <span>Dehradun Kitchen</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(selectedFood.id)}
              className="w-9 h-9 rounded-xl border border-stone-200 flex items-center justify-center text-stone-600 hover:text-[#EA580C] cursor-pointer"
              aria-label="Toggle favourite"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-[#EA580C] text-[#EA580C]' : ''}`} />
            </button>
            <button
              onClick={() => {
                setSelectedFood(null);
                setQty(1);
              }}
              aria-label="Close food details"
              className="w-9 h-9 rounded-xl border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-7 grid grid-cols-1 md:grid-cols-12 gap-7">
          <div className="md:col-span-6">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100">
              <FoodImage
                src={selectedFood.image}
                alt={selectedFood.name}
                className="w-full h-full object-cover"
              />
            </div>

            {selectedFood.ingredients && selectedFood.ingredients.length > 0 && (
              <div className="mt-5">
                <h4 className="text-xs font-semibold text-stone-500 mb-2">
                  Fresh Kitchen Ingredients
                </h4>
                <p className="text-sm text-stone-700 leading-relaxed">
                  {selectedFood.ingredients.join(' · ')}
                </p>
              </div>
            )}
          </div>

          <div className="md:col-span-6 flex flex-col">
            <h2
              id="food-detail-title"
              className="font-display text-2xl sm:text-3xl font-bold text-[#18181B] leading-tight mb-2"
            >
              {selectedFood.name}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 mb-4">
              <span className="inline-flex items-center gap-1 font-medium text-stone-800 tabular-nums">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {selectedFood.rating.toFixed(1)} ({itemReviews.length || selectedFood.reviewCount || 0} ratings)
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                {selectedFood.preparationTime} mins prep
              </span>
              {selectedFood.calories && (
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Flame className="w-3.5 h-3.5 text-stone-400" />
                  {selectedFood.calories} kcal
                </span>
              )}
            </div>

            <p className="text-sm text-stone-600 leading-relaxed mb-6">
              {selectedFood.description}
            </p>

            <div className="bg-[#FAF7F2] border border-stone-200/80 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs text-stone-500 block">Student Price</span>
                  <span className="font-mono text-2xl font-bold text-[#18181B] tabular-nums">
                    ₹{selectedFood.price * qty}
                  </span>
                  {qty > 1 && (
                    <span className="text-xs text-stone-500 ml-2 tabular-nums">
                      (₹{selectedFood.price} each)
                    </span>
                  )}
                </div>

                <div className="inline-flex items-center bg-white rounded-xl p-1 border border-stone-200">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-700 hover:bg-stone-100 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-9 text-center font-mono text-sm font-semibold tabular-nums">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => Math.min(20, q + 1))}
                    aria-label="Increase quantity"
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-700 hover:bg-stone-100 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                disabled={!selectedFood.availability}
                onClick={() => {
                  addToCart(selectedFood, qty);
                  setSelectedFood(null);
                  setQty(1);
                }}
                className="w-full py-3 px-5 rounded-xl bg-[#EA580C] text-white text-sm font-semibold hover:bg-[#C2410C] disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {selectedFood.availability
                  ? `Add ${qty} to Cart · ₹${selectedFood.price * qty}`
                  : 'Currently Out of Stock'}
              </button>
            </div>

            {/* Customer Ratings & Reviews */}
            <div className="border-t border-stone-200 pt-5">
              <h3 className="font-display text-base font-semibold text-[#18181B] mb-3">
                Student Reviews
              </h3>

              {itemReviews.length === 0 ? (
                <p className="text-xs text-stone-500 mb-4">
                  No written reviews for this dish yet. Be the first from your hostel to share!
                </p>
              ) : (
                <div className="space-y-3 mb-4 max-h-44 overflow-y-auto pr-1">
                  {itemReviews.map((rev) => (
                    <div key={rev.id} className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-stone-800">{rev.userName}</span>
                        <span className="inline-flex items-center gap-1 font-mono text-amber-600 tabular-nums">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {rev.rating}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">{rev.comment}</p>
                      <span className="text-[11px] text-stone-400 mt-1 block">
                        {rev.campus || 'Dehradun'} · {formatFirestoreDate(rev.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {user ? (
                <form onSubmit={handleReviewSubmit} className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-600">Your Rating:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-0.5 cursor-pointer"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= rating
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="How was the taste & portion?"
                      maxLength={400}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-[#EA580C]"
                    />
                    <button
                      type="submit"
                      disabled={submitting || comment.trim().length < 3}
                      className="px-4 py-2 rounded-xl bg-[#18181B] text-white text-xs font-medium hover:bg-[#EA580C] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {submitting ? 'Posting...' : 'Post Review'}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={loginWithGoogle}
                  className="text-xs font-medium text-[#EA580C] hover:underline cursor-pointer"
                >
                  Sign in with Google to leave a student review
                </button>
              )}
            </div>
          </div>
        </div>

        {relatedMeals.length > 0 && (
          <div className="px-5 sm:px-7 pb-6 pt-4 border-t border-stone-100">
            <h3 className="font-display text-sm font-semibold text-stone-800 mb-3">
              Pairs Well With
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relatedMeals.map((rel) => (
                <button
                  key={rel.id}
                  onClick={() => {
                    setSelectedFood(rel);
                    setQty(1);
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-200 hover:border-[#EA580C] text-left transition-colors cursor-pointer"
                >
                  <FoodImage
                    src={rel.image}
                    alt={rel.name}
                    className="w-14 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-stone-900 truncate">
                      {rel.name}
                    </div>
                    <div className="font-mono text-xs text-[#EA580C] tabular-nums">
                      ₹{rel.price}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

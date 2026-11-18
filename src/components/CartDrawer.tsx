import React, { useState } from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import { useCampusBite } from '../context/CampusBiteContext';
import { FoodImage, VegIndicator } from './Toast';

export function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateCartQty,
    removeFromCart,
    coupons,
    appliedCouponCode,
    setAppliedCouponCode,
    cartSubtotal,
    cartDeliveryCharge,
    cartDiscount,
    cartTotal,
    setActiveView,
    showToast,
  } = useCampusBite();

  const [couponInput, setCouponInput] = useState(appliedCouponCode);

  if (!isCartOpen) return null;

  const activeCoupons = coupons.filter((c) => c.isActive);

  const handleApplyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setAppliedCouponCode('');
      setCouponInput('');
      return;
    }
    const found = activeCoupons.find((c) => c.couponCode.toUpperCase() === clean);
    if (!found) {
      showToast('Invalid or expired coupon code.', 'error');
      return;
    }
    if (found.minOrderAmount && cartSubtotal < found.minOrderAmount) {
      showToast(`Add ₹${found.minOrderAmount - cartSubtotal} more to use ${found.couponCode}.`, 'info');
      return;
    }
    setAppliedCouponCode(found.couponCode);
    setCouponInput(found.couponCode);
    showToast(`Coupon ${found.couponCode} applied!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/50 backdrop-blur-sm">
      <div
        className="fixed inset-0"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      <aside
        className="relative z-10 w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-stone-200"
        aria-label="Shopping Cart"
      >
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#EA580C]" />
            <h2 className="font-display text-lg font-semibold text-[#18181B]">
              Your Meal Box
            </h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
            className="w-9 h-9 rounded-xl border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#EA580C] flex items-center justify-center mb-4">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-semibold text-stone-900 mb-1">
              Your meal box is empty
            </h3>
            <p className="text-sm text-stone-500 mb-6 max-w-xs">
              Explore homestyle thalis, rajma chawal, and student snacks starting at ₹40.
            </p>
            <button
              onClick={() => {
                setIsCartOpen(false);
                setActiveView('menu');
              }}
              className="px-5 py-2.5 rounded-xl bg-[#EA580C] text-white text-sm font-semibold hover:bg-[#C2410C] transition-colors cursor-pointer"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cartSubtotal < 149 && (
                <div className="bg-orange-50 border border-orange-200/70 rounded-xl px-3.5 py-2.5 text-xs text-stone-700">
                  Add <span className="font-mono font-semibold text-[#EA580C]">₹{149 - cartSubtotal}</span> more for free hostel delivery (₹15 saved).
                </div>
              )}

              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.foodId}
                    className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-[#FAF7F2]/50"
                  >
                    <FoodImage
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <VegIndicator isVeg={item.isVeg} />
                        <span className="text-sm font-semibold text-stone-900 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-stone-600 tabular-nums">
                        ₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <div className="inline-flex items-center bg-white rounded-lg border border-stone-200">
                        <button
                          onClick={() => updateCartQty(item.foodId, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-stone-900 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono text-xs font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.foodId, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="w-7 h-7 flex items-center justify-center text-stone-600 hover:text-stone-900 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.foodId)}
                        className="text-[11px] text-stone-400 hover:text-red-600 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="pt-3 border-t border-stone-200">
                <label className="text-xs font-semibold text-stone-700 block mb-2">
                  Student Coupon Code
                </label>
                <div className="flex gap-2 mb-2.5">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter e.g. FIRST50"
                      className="w-full pl-8 pr-3 py-2 text-xs font-mono rounded-xl border border-stone-200 focus:outline-none focus:border-[#EA580C]"
                    />
                  </div>
                  {appliedCouponCode ? (
                    <button
                      onClick={() => {
                        setAppliedCouponCode('');
                        setCouponInput('');
                      }}
                      className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 cursor-pointer"
                    >
                      Clear
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApplyCoupon(couponInput)}
                      className="px-4 py-2 rounded-xl bg-[#18181B] text-white text-xs font-medium hover:bg-[#EA580C] transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  )}
                </div>

                {activeCoupons.length > 0 && (
                  <div className="space-y-1.5">
                    {activeCoupons.map((c) => (
                      <button
                        key={c.couponCode}
                        onClick={() => handleApplyCoupon(c.couponCode)}
                        className="w-full text-left px-3 py-2 rounded-lg border border-stone-200 hover:border-[#EA580C] bg-stone-50/70 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-semibold text-[#EA580C]">
                            {c.couponCode}
                          </span>
                          <p className="text-[11px] text-stone-500 truncate">{c.description}</p>
                        </div>
                        <span className="text-[11px] font-medium text-stone-700 shrink-0">
                          {appliedCouponCode === c.couponCode ? 'Applied' : 'Tap to apply'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-stone-200 bg-[#FAF7F2]">
              <div className="space-y-1.5 text-sm mb-4">
                <div className="flex justify-between text-stone-600">
                  <span>Item Subtotal</span>
                  <span className="font-mono tabular-nums">₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Hostel Delivery</span>
                  <span className="font-mono tabular-nums">
                    {cartDeliveryCharge === 0 ? 'FREE' : `₹${cartDeliveryCharge}`}
                  </span>
                </div>
                {cartDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Coupon ({appliedCouponCode})</span>
                    <span className="font-mono tabular-nums">-₹{cartDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-[#18181B] pt-2 border-t border-stone-200">
                  <span>To Pay</span>
                  <span className="font-mono tabular-nums">₹{cartTotal}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setActiveView('checkout');
                }}
                className="w-full py-3 px-5 rounded-xl bg-[#EA580C] text-white text-sm font-semibold hover:bg-[#C2410C] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

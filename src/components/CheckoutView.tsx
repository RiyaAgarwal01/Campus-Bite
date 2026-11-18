import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, CreditCard, Info, ShieldCheck, Wallet } from 'lucide-react';
import { useCampusBite } from '../context/CampusBiteContext';
import { DEHRADUN_COLLEGES } from '../data/seedData';
import type { PaymentMethod } from '../types';

export function CheckoutView({
  onOrderPlaced,
}: {
  onOrderPlaced: (orderId: string) => void;
}) {
  const {
    user,
    profile,
    loginWithGoogle,
    selectedLocation,
    cart,
    cartSubtotal,
    cartDeliveryCharge,
    cartDiscount,
    appliedCouponCode,
    cartTotal,
    placeOrder,
    setActiveView,
    showToast,
  } = useCampusBite();

  const [customerName, setCustomerName] = useState(profile?.name || user?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || '');
  const [collegeName, setCollegeName] = useState(profile?.collegeName || DEHRADUN_COLLEGES[0]);
  const [hostelName, setHostelName] = useState(profile?.hostelName || '');
  const [roomNumber, setRoomNumber] = useState(profile?.roomNumber || '');
  const [streetAddress, setStreetAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [razorpayConfigured, setRazorpayConfigured] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (profile) {
      setCustomerName((prev) => prev || profile.name);
      setCustomerPhone((prev) => prev || profile.phone || '');
      setCollegeName((prev) => prev || profile.collegeName || DEHRADUN_COLLEGES[0]);
      setHostelName((prev) => prev || profile.hostelName || '');
      setRoomNumber((prev) => prev || profile.roomNumber || '');
    }
  }, [profile]);

  useEffect(() => {
    fetch('/api/payments/config')
      .then((r) => r.json())
      .then((d) => setRazorpayConfigured(Boolean(d.razorpayConfigured)))
      .catch(() => setRazorpayConfigured(false));
  }, []);

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-[#18181B] mb-2">
          Your cart is empty
        </h1>
        <p className="text-sm text-stone-500 mb-6">
          Add meals from the menu before checking out.
        </p>
        <button
          onClick={() => setActiveView('menu')}
          className="px-5 py-2.5 rounded-xl bg-[#EA580C] text-white text-sm font-semibold cursor-pointer"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!user) {
      showToast('Please sign in with Google to place your order.', 'info');
      await loginWithGoogle();
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (customerName.trim().length < 2) {
      setFormError('Please enter your full name.');
      return;
    }
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!hostelName.trim() || !roomNumber.trim() || !streetAddress.trim()) {
      setFormError('Please fill in your Hostel/PG name, room number, and delivery address.');
      return;
    }

    if (paymentMethod !== 'COD' && !razorpayConfigured) {
      setFormError(
        'Razorpay / UPI gateway keys (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET) are not configured on the server yet. Select Cash on Delivery to place a live order now.'
      );
      return;
    }

    setSubmitting(true);
    try {
      let paymentReference: string | undefined;
      let paymentStatus: 'pending' | 'paid' = 'pending';

      if (paymentMethod !== 'COD' && razorpayConfigured) {
        const orderRes = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: cartTotal, receipt: `cb_${Date.now()}` }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok || orderData.mode !== 'live') {
          throw new Error(orderData.message || orderData.error || 'Razorpay initialization failed.');
        }
        paymentReference = orderData.orderId;
        // Note: Full Razorpay script modal would trigger here when live keyId is provided
        paymentStatus = 'pending';
      }

      const created = await placeOrder({
        customerName: customerName.trim(),
        customerPhone: cleanPhone.slice(-10),
        deliveryAddress: {
          collegeName,
          hostelName: hostelName.trim(),
          roomNumber: roomNumber.trim(),
          streetAddress: streetAddress.trim(),
          campusZone: selectedLocation,
        },
        instructions: instructions.trim(),
        paymentMethod,
        paymentStatus,
        paymentReference,
      });

      if (created) {
        onOrderPlaced(created.orderId);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to complete order.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-14">
      <button
        onClick={() => setActiveView('menu')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-[#18181B] mb-5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Menu
      </button>

      <h1 className="font-display text-3xl font-bold text-[#18181B] mb-2">
        Hostel &amp; PG Checkout
      </h1>
      <p className="text-sm text-stone-500 mb-7">
        Delivering to <span className="font-medium text-stone-800">{selectedLocation}</span>
      </p>

      {!user && (
        <div className="mb-6 bg-white border border-stone-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-[#18181B]">
              Sign in to link your order &amp; live tracking
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              One-click Google sign-in saves your hostel address and order history.
            </p>
          </div>
          <button
            onClick={loginWithGoogle}
            className="px-5 py-2.5 rounded-xl bg-[#EA580C] text-white text-xs font-semibold hover:bg-[#C2410C] shrink-0 cursor-pointer"
          >
            Continue with Google
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          {/* Saved Address Quick Fill */}
          {profile && profile.addresses.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <h2 className="font-display text-sm font-semibold text-[#18181B] mb-3">
                Quick-Fill Saved Hostel / PG Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {profile.addresses.map((addr) => (
                  <button
                    type="button"
                    key={addr.id}
                    onClick={() => {
                      setCollegeName(addr.collegeName);
                      setHostelName(addr.hostelName);
                      setRoomNumber(addr.roomNumber);
                      setStreetAddress(addr.streetAddress);
                    }}
                    className="text-left p-3 rounded-xl border border-stone-200 hover:border-[#EA580C] bg-[#FAF7F2]/60 transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-stone-900">{addr.label}</div>
                    <div className="text-[11px] text-stone-500 truncate">
                      {addr.hostelName}, Room {addr.roomNumber}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Student Delivery Details */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-[#18181B]">
              1. Student &amp; Hostel Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Aarav Joshi"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1.5">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="10-digit WhatsApp / call number"
                  className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-stone-200 focus:outline-none focus:border-[#EA580C]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-stone-700 block mb-1.5">
                College / University Name *
              </label>
              <select
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#EA580C]"
              >
                {DEHRADUN_COLLEGES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="Other Dehradun College">Other Dehradun College</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1.5">
                  Hostel / PG Name *
                </label>
                <input
                  type="text"
                  required
                  value={hostelName}
                  onChange={(e) => setHostelName(e.target.value)}
                  placeholder="e.g. Shivalik Boys Hostel / Sai PG"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-[#EA580C]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1.5">
                  Room / Block Number *
                </label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. Block B, Room 204"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-[#EA580C]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-stone-700 block mb-1.5">
                Delivery Address &amp; Gate Landmark *
              </label>
              <input
                type="text"
                required
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="e.g. Near Bidholi Main Gate, Pondha Road, Dehradun"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-[#EA580C]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-stone-700 block mb-1.5">
                Special Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                maxLength={300}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Call at main gate, less spicy, extra spoon"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-[#18181B]">
              2. Payment Method
            </h2>

            <div className="space-y-3">
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  paymentMethod === 'COD'
                    ? 'border-[#EA580C] bg-orange-50/50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1 accent-[#EA580C]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-[#EA580C]" />
                      Cash on Delivery (Pay at Hostel Gate)
                    </span>
                    <span className="text-xs font-medium text-emerald-700">Live</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Pay in cash or scan rider UPI QR when your meal arrives hot at your hostel.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  paymentMethod === 'UPI' || paymentMethod === 'RAZORPAY'
                    ? 'border-[#EA580C] bg-orange-50/50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'UPI' || paymentMethod === 'RAZORPAY'}
                  onChange={() => setPaymentMethod('RAZORPAY')}
                  className="mt-1 accent-[#EA580C]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-stone-700" />
                      UPI / Cards / NetBanking (Razorpay)
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        razorpayConfigured ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {razorpayConfigured ? 'Gateway Ready' : 'Keys Not Configured'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {razorpayConfigured
                      ? 'Instant UPI (GPay, PhonePe, Paytm) and student debit card checkout via Razorpay.'
                      : 'Razorpay server integration is built. Set RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in server environment secrets to activate live UPI/Card capture.'}
                  </p>
                </div>
              </label>
            </div>

            {!razorpayConfigured && (
              <div className="flex items-start gap-2.5 bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-600">
                <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                <span>
                  Online Razorpay payments are disabled until live/test API keys are added to `.env`. Cash on Delivery is 100% live and saves directly to Firestore.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sticky top-24">
            <h2 className="font-display text-lg font-semibold text-[#18181B] mb-4">
              Order Summary
            </h2>

            <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto mb-4">
              {cart.map((item) => (
                <div key={item.foodId} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium text-stone-900 truncate">{item.name}</div>
                    <div className="text-xs text-stone-500 tabular-nums">
                      ₹{item.price} × {item.quantity}
                    </div>
                  </div>
                  <div className="font-mono font-semibold text-stone-900 tabular-nums shrink-0">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm border-t border-stone-200 pt-4 mb-5">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
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
                  <span>Discount ({appliedCouponCode})</span>
                  <span className="font-mono tabular-nums">-₹{cartDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#18181B] pt-2 border-t border-stone-200">
                <span>Total Payable</span>
                <span className="font-mono tabular-nums">₹{cartTotal}</span>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-5 rounded-xl bg-[#EA580C] text-white text-sm font-semibold hover:bg-[#C2410C] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Placing Order...' : `Place Order · ₹${cartTotal}`}</span>
            </button>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Free cancellation until kitchen accepts your order</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

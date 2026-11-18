import React from 'react';
import { Clock, MapPin, MessageCircle, PhoneCall, ShieldCheck, Utensils } from 'lucide-react';

export function AboutContactView() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 md:pb-16 space-y-10">
      <section>
        <p className="text-xs font-medium text-[#EA580C] mb-2">
          About CampusBite · Dehradun, Uttarakhand
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#18181B] text-balance mb-4">
          Built for college students living away from home.
        </h1>
        <p className="text-base text-stone-600 leading-relaxed max-w-3xl">
          CampusBite was started in Dehradun to solve an everyday hostel dilemma: restaurant delivery is too expensive and oily for daily eating, while hostel mess food often lacks freshness. Our central kitchens near Bidholi, Clement Town, and Rajpur Road cook homestyle batches every meal slot at an average price of ₹100.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-stone-200 rounded-2xl p-5">
          <Utensils className="w-5 h-5 text-[#EA580C] mb-3" />
          <h2 className="font-display text-base font-semibold text-[#18181B] mb-1">
            Homestyle Kitchen Standards
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Chakki fresh whole-wheat rotis, cold-pressed mustard and groundnut oils, zero artificial food coloring, and daily fresh produce from Dehradun mandi.
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5">
          <Clock className="w-5 h-5 text-[#EA580C] mb-3" />
          <h2 className="font-display text-base font-semibold text-[#18181B] mb-1">
            Order Cancellation Policy
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Orders can be cancelled directly from My Orders with zero fee while status is Order Placed or Order Accepted. Once Food Preparation begins, meals are freshly cooked to order and cannot be cancelled.
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5">
          <ShieldCheck className="w-5 h-5 text-[#EA580C] mb-3" />
          <h2 className="font-display text-base font-semibold text-[#18181B] mb-1">
            Campus Delivery Coverage
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Dedicated student riders deliver directly to hostel gates and PG entrances across UPES Bidholi &amp; Kandoli, Graphic Era, DIT, Uttaranchal University, and Doon University.
          </p>
        </div>
      </section>

      {/* Contact & WhatsApp Support */}
      <section className="bg-[#18181B] text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold">Need Help With an Order?</h2>
          <div className="flex flex-wrap gap-5 text-xs text-stone-300">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
              Rajpur Road &amp; Pondha Kitchen Hub, Dehradun 248007
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono">
              <PhoneCall className="w-3.5 h-3.5 text-[#F97316]" />
              +91 98765 43210
            </span>
          </div>
        </div>

        <a
          href="https://wa.me/919876543210?text=Hi%20CampusBite%20Dehradun%2C%20I%20have%20a%20question%20about%20my%20meal%20order."
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chat on WhatsApp Support</span>
        </a>
      </section>

      {/* Integration & Deployment Reference */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-3">
        <h2 className="font-display text-lg font-semibold text-[#18181B]">
          Platform Setup &amp; Payment Configuration
        </h2>
        <p className="text-xs text-stone-600 leading-relaxed">
          CampusBite runs on Firebase Authentication, Cloud Firestore (real-time order &amp; subscription sync), and a secure Node/Express backend for Gemini Meal Recommendations and Razorpay checkout.
        </p>
        <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-5">
          <li>
            <strong>Firebase:</strong> Provisioned and connected via <code className="font-mono">firebase-applet-config.json</code> with hardened rules in <code className="font-mono">firestore.rules</code>.
          </li>
          <li>
            <strong>Gemini AI Meal Assistant:</strong> Runs server-side at <code className="font-mono">/api/ai/recommend</code> using <code className="font-mono">GEMINI_API_KEY</code>.
          </li>
          <li>
            <strong>Razorpay UPI / Cards:</strong> Set <code className="font-mono">RAZORPAY_KEY_ID</code> and <code className="font-mono">RAZORPAY_KEY_SECRET</code> in server environment variables to activate live online capture alongside Cash on Delivery.
          </li>
        </ul>
      </section>
    </div>
  );
}

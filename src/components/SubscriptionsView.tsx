import React, { useState } from 'react';
import { Calendar, Check, Info, Pause, Play, XCircle } from 'lucide-react';
import { useCampusBite } from '../context/CampusBiteContext';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanSpec } from '../data/seedData';
import { VegIndicator } from './Toast';

const PREFERRED_ROTATION_MEALS = [
  'Ghar-Ka Paneer Thali',
  'Doon Valley Rajma Chawal',
  'Budget Dal Tadka & 4 Roti Box',
  'Pahadi Kadhi Pakora Bowl',
  'Hostel Special Chole Bhature',
  'Maa-Ka Comfort Dinner Thali',
];

export function SubscriptionsView() {
  const {
    user,
    profile,
    loginWithGoogle,
    selectedLocation,
    subscriptions,
    createSubscription,
    updateSubscriptionCustomer,
    showToast,
  } = useCampusBite();

  const [cadenceFilter, setCadenceFilter] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanSpec>(SUBSCRIPTION_PLANS[2]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [dietaryPreference, setDietaryPreference] = useState<'Pure Veg' | 'Veg + Egg'>('Pure Veg');
  const [preferredMeals, setPreferredMeals] = useState<string[]>([
    'Ghar-Ka Paneer Thali',
    'Doon Valley Rajma Chawal',
    'Budget Dal Tadka & 4 Roti Box',
  ]);
  const [deliveryAddress, setDeliveryAddress] = useState(
    profile?.hostelName
      ? `${profile.hostelName}, ${profile.collegeName || selectedLocation}`
      : selectedLocation
  );
  const [submitting, setSubmitting] = useState(false);

  const visiblePlans = SUBSCRIPTION_PLANS.filter(
    (p) => cadenceFilter === 'all' || p.cadence === cadenceFilter
  );

  const togglePreferredMeal = (meal: string) => {
    setPreferredMeals((prev) =>
      prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal].slice(0, 6)
    );
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Sign in with Google to activate a tiffin subscription.', 'info');
      await loginWithGoogle();
      return;
    }
    if (!deliveryAddress.trim()) {
      showToast('Please enter your hostel or PG delivery address.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await createSubscription({
        planType: selectedPlan.planType,
        cadence: selectedPlan.cadence,
        mealSlot: selectedPlan.mealSlot,
        price: selectedPlan.price,
        totalMeals: selectedPlan.totalMeals,
        startDate,
        preferredMeals,
        dietaryPreference,
        deliveryAddress: deliveryAddress.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-14">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#18181B]">
            Student Meal Subscriptions
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Daily homestyle lunch &amp; dinner tiffins with flexible pause when you visit home.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-stone-200/70 rounded-xl self-start">
          {(['all', 'weekly', 'monthly'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCadenceFilter(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                cadenceFilter === tab
                  ? 'bg-white text-[#18181B] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab === 'all' ? 'All Plans' : `${tab} Plans`}
            </button>
          ))}
        </div>
      </div>

      {/* Explicit Configurable Sample Plans Notice */}
      <div className="mb-8 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3.5 flex items-start gap-3 text-xs text-stone-700">
        <Info className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
        <span>
          <strong>Configurable Sample Plans:</strong> Subscription rates, meal counts, and menu rotations shown below are configurable sample tiffin plans until final campus launch pricing is locked. You can test subscribing, pausing, and tracking remaining meals live in Firestore.
        </span>
      </div>

      {/* Active User Subscriptions */}
      {user && subscriptions.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-bold text-[#18181B] mb-4">
            Your Active &amp; Past Meal Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {subscriptions.map((sub) => (
              <div
                key={sub.subscriptionId}
                className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs text-stone-500">
                      {sub.subscriptionId}
                    </span>
                    <span
                      className={`text-xs font-semibold capitalize ${
                        sub.status === 'active'
                          ? 'text-emerald-700'
                          : sub.status === 'paused'
                          ? 'text-amber-700'
                          : 'text-stone-500'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#18181B]">
                    {sub.planType}
                  </h3>
                  <div className="text-xs text-stone-500 mt-1">
                    {sub.startDate} to {sub.endDate} · {sub.dietaryPreference || 'Pure Veg'}
                  </div>

                  <div className="mt-4 bg-[#FAF7F2] rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-stone-500">Remaining Meals</div>
                      <div className="font-mono text-2xl font-bold text-[#EA580C] tabular-nums">
                        {sub.remainingMeals} / {sub.totalMeals}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-stone-500">Sample Plan Fee</div>
                      <div className="font-mono text-base font-bold text-[#18181B] tabular-nums">
                        ₹{sub.price}
                      </div>
                    </div>
                  </div>
                </div>

                {sub.status !== 'cancelled' && sub.status !== 'completed' && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-stone-100">
                    {sub.status === 'active' ? (
                      <button
                        onClick={() => updateSubscriptionCustomer(sub.subscriptionId, 'paused')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:border-amber-500 cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5" /> Pause Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => updateSubscriptionCustomer(sub.subscriptionId, 'active')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" /> Resume Plan
                      </button>
                    )}

                    <button
                      onClick={() => updateSubscriptionCustomer(sub.subscriptionId, 'cancelled')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel Subscription
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Plan Comparison Matrix + Configurator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visiblePlans.map((plan) => {
              const active = selectedPlan.id === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`rounded-2xl p-5 border transition-all cursor-pointer ${
                    active
                      ? 'bg-white border-[#EA580C] ring-2 ring-[#EA580C]/20'
                      : 'bg-white border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs text-stone-500">{plan.audienceLabel}</span>
                    {active && (
                      <span className="text-[11px] font-semibold text-[#EA580C]">Selected</span>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#18181B]">
                    {plan.planType}
                  </h3>
                  <div className="flex items-baseline gap-2 my-3">
                    <span className="font-mono text-2xl font-bold text-[#18181B] tabular-nums">
                      ₹{plan.price}
                    </span>
                    <span className="text-xs text-stone-500 tabular-nums">
                      · {plan.totalMeals} meals (₹{plan.perMealCost}/meal)
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-stone-600">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Comparison Table */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <h3 className="font-display text-base font-semibold text-[#18181B]">
                Plan Comparison Matrix (Sample Pricing)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Plan</th>
                    <th className="py-3 px-4 font-semibold text-right">Meals</th>
                    <th className="py-3 px-4 font-semibold text-right">Per Meal</th>
                    <th className="py-3 px-4 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {SUBSCRIPTION_PLANS.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/60">
                      <td className="py-3 px-4 font-medium text-stone-900">{p.planType}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">{p.totalMeals}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">₹{p.perMealCost}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                        ₹{p.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Subscription Configurator Form */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleActivate}
            className="bg-white border border-stone-200 rounded-2xl p-6 sticky top-24 space-y-5"
          >
            <div>
              <span className="text-xs font-medium text-[#EA580C]">
                Configurable Sample Plan
              </span>
              <h2 className="font-display text-xl font-bold text-[#18181B] mt-0.5">
                {selectedPlan.planType}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                {selectedPlan.totalMeals} meals · ₹{selectedPlan.perMealCost}/meal · Total{' '}
                <span className="font-mono font-semibold text-[#18181B]">
                  ₹{selectedPlan.price}
                </span>
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#EA580C]" />
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-[#EA580C]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                Dietary Preference
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Pure Veg', 'Veg + Egg'] as const).map((pref) => (
                  <button
                    type="button"
                    key={pref}
                    onClick={() => setDietaryPreference(pref)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                      dietaryPreference === pref
                        ? 'border-[#EA580C] bg-orange-50/60 text-[#18181B]'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    <VegIndicator isVeg={pref === 'Pure Veg'} />
                    <span>{pref}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-2">
                Select Preferred Meals in Your Rotation
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {PREFERRED_ROTATION_MEALS.map((meal) => {
                  const chosen = preferredMeals.includes(meal);
                  return (
                    <button
                      type="button"
                      key={meal}
                      onClick={() => togglePreferredMeal(meal)}
                      className={`px-3 py-2 rounded-xl border text-left text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        chosen
                          ? 'border-[#EA580C] bg-orange-50/40 text-stone-900 font-medium'
                          : 'border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <span>{meal}</span>
                      {chosen && <Check className="w-3.5 h-3.5 text-[#EA580C]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                Hostel / PG Delivery Address
              </label>
              <input
                type="text"
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Hostel name, Room No., Campus"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-[#EA580C]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-5 rounded-xl bg-[#EA580C] text-white text-sm font-semibold hover:bg-[#C2410C] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting
                ? 'Activating Plan...'
                : `Start Sample Plan · ₹${selectedPlan.price}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

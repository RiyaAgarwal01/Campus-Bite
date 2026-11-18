import React, { useEffect, useState } from 'react';
import {
  Copy,
  Heart,
  LogOut,
  MapPin,
  Plus,
  Shield,
  Trash2,
  User as UserIcon,
  Wallet,
} from 'lucide-react';
import { useCampusBite } from '../context/CampusBiteContext';
import { DEHRADUN_COLLEGES } from '../data/seedData';
import type { CustomerFeedback } from '../types';
import { FoodCard } from './FoodCard';

export function ProfileView() {
  const {
    user,
    profile,
    isAdmin,
    setIsAdminMode,
    loginWithGoogle,
    logout,
    updateUserProfile,
    addSavedAddress,
    removeSavedAddress,
    foodItems,
    orders,
    submitFeedback,
    setActiveView,
    showToast,
  } = useCampusBite();

  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [collegeName, setCollegeName] = useState(profile?.collegeName || DEHRADUN_COLLEGES[0]);
  const [hostelName, setHostelName] = useState(profile?.hostelName || '');
  const [roomNumber, setRoomNumber] = useState(profile?.roomNumber || '');

  const [addrLabel, setAddrLabel] = useState('Hostel Room');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrHostel, setAddrHostel] = useState('');
  const [addrRoom, setAddrRoom] = useState('');

  const [fbCategory, setFbCategory] = useState<CustomerFeedback['category']>('Food Quality');
  const [fbMessage, setFbMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setCollegeName(profile.collegeName || DEHRADUN_COLLEGES[0]);
      setHostelName(profile.hostelName || '');
      setRoomNumber(profile.roomNumber || '');
    }
  }, [profile]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#EA580C] flex items-center justify-center mx-auto mb-4">
          <UserIcon className="w-6 h-6" />
        </div>
        <h1 className="font-display text-2xl font-bold text-[#18181B] mb-2">
          Student Account &amp; Saved Hostels
        </h1>
        <p className="text-sm text-stone-500 mb-6">
          Sign in with Google to save hostel addresses, favourite dishes, referral rewards, and track orders.
        </p>
        <button
          onClick={loginWithGoogle}
          className="px-6 py-3 rounded-xl bg-[#EA580C] text-white text-sm font-semibold hover:bg-[#C2410C] cursor-pointer"
        >
          Continue with Google
        </button>
      </div>
    );
  }

  const favoriteDishes = foodItems.filter((f) => profile?.favorites?.includes(f.id));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({ name, phone, collegeName, hostelName, roomNumber });
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrHostel.trim() || !addrStreet.trim()) return;
    await addSavedAddress({
      label: addrLabel.trim() || 'Hostel',
      collegeName,
      hostelName: addrHostel.trim(),
      roomNumber: addrRoom.trim() || 'Gate',
      streetAddress: addrStreet.trim(),
    });
    setAddrHostel('');
    setAddrRoom('');
    setAddrStreet('');
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fbMessage.trim().length < 5) return;
    await submitFeedback(fbCategory, fbMessage);
    setFbMessage('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-14 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#18181B]">
            {profile?.name || user.displayName || 'Student Profile'}
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {user.email} · {profile?.collegeName || 'Dehradun'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setIsAdminMode(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-[#EA580C] transition-colors cursor-pointer"
            >
              <Shield className="w-4 h-4 text-[#F97316]" />
              <span>Open Admin Dashboard</span>
            </button>
          )}
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:border-red-300 hover:text-red-700 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Personal Info */}
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-6 bg-white border border-stone-200 rounded-2xl p-6 space-y-4"
        >
          <h2 className="font-display text-lg font-semibold text-[#18181B]">
            Personal &amp; Campus Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-stone-600 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-[#EA580C]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600 block mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-stone-200 focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-stone-600 block mb-1">College / University</label>
            <select
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#EA580C]"
            >
              {DEHRADUN_COLLEGES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-stone-600 block mb-1">Hostel / PG Name</label>
              <input
                type="text"
                value={hostelName}
                onChange={(e) => setHostelName(e.target.value)}
                placeholder="e.g. Nilgiri Boys Hostel"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-[#EA580C]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600 block mb-1">Room Number</label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. 308"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#EA580C] text-white text-xs font-semibold hover:bg-[#C2410C] cursor-pointer"
          >
            Save Personal Details
          </button>
        </form>

        {/* Referral + Wallet + Payment Summary */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-[#18181B] text-white rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-[#F97316] font-medium mb-1">
                  Student Referral Program
                </div>
                <h2 className="font-display text-lg font-bold">
                  Invite Hostel Friends, Earn ₹30 Credits
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Share your CampusBite code with roommates for ₹30 off their first thali.
                </p>
              </div>
              <Wallet className="w-5 h-5 text-[#F97316] shrink-0" />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 bg-stone-900 border border-stone-800 rounded-xl px-4 py-3">
              <div>
                <div className="text-[11px] text-stone-400">Your Referral Code</div>
                <div className="font-mono text-base font-bold text-white">
                  {profile?.referralCode || `CB-${user.uid.slice(0, 6).toUpperCase()}`}
                </div>
              </div>
              <button
                onClick={() => {
                  const code = profile?.referralCode || `CB-${user.uid.slice(0, 6).toUpperCase()}`;
                  navigator.clipboard?.writeText(code);
                  showToast('Referral code copied!', 'success');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-[#EA580C] text-xs font-semibold cursor-pointer transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Code
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-stone-300">
              <span>Wallet Credits</span>
              <span className="font-mono font-bold tabular-nums">
                ₹{profile?.walletBalance || 0}
              </span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs text-stone-500">Completed &amp; Active Orders</div>
              <div className="font-mono text-2xl font-bold text-[#18181B] tabular-nums">
                {orders.length}
              </div>
            </div>
            <button
              onClick={() => setActiveView('orders')}
              className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800 hover:border-[#EA580C] cursor-pointer"
            >
              View Payment &amp; Order History
            </button>
          </div>
        </div>
      </div>

      {/* Saved Addresses */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold text-[#18181B] mb-4">
          Saved Hostel &amp; PG Addresses
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {(profile?.addresses || []).length === 0 ? (
            <p className="text-xs text-stone-500">No saved addresses yet. Add one below for 1-tap checkout.</p>
          ) : (
            profile?.addresses.map((addr) => (
              <div
                key={addr.id}
                className="p-4 rounded-xl border border-stone-200 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-semibold text-stone-900">{addr.label}</div>
                    <div className="text-stone-600 mt-0.5">
                      {addr.hostelName}, Room {addr.roomNumber}
                    </div>
                    <div className="text-stone-500">{addr.streetAddress}</div>
                  </div>
                </div>
                <button
                  onClick={() => removeSavedAddress(addr.id)}
                  aria-label="Delete address"
                  className="text-stone-400 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddAddress} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-4 border-t border-stone-100">
          <input
            type="text"
            value={addrLabel}
            onChange={(e) => setAddrLabel(e.target.value)}
            placeholder="Label (e.g. Hostel)"
            className="px-3 py-2 text-xs rounded-xl border border-stone-200"
          />
          <input
            type="text"
            required
            value={addrHostel}
            onChange={(e) => setAddrHostel(e.target.value)}
            placeholder="Hostel / PG Name"
            className="px-3 py-2 text-xs rounded-xl border border-stone-200"
          />
          <input
            type="text"
            value={addrRoom}
            onChange={(e) => setAddrRoom(e.target.value)}
            placeholder="Room No."
            className="px-3 py-2 text-xs rounded-xl border border-stone-200"
          />
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={addrStreet}
              onChange={(e) => setAddrStreet(e.target.value)}
              placeholder="Gate / Road"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-200"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-[#EA580C] cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </form>
      </section>

      {/* Favourite Meals */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-[#EA580C]" />
          <h2 className="font-display text-xl font-bold text-[#18181B]">
            Your Favourite Meals
          </h2>
        </div>
        {favoriteDishes.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-xs text-stone-500">
            Tap the heart icon on any dish in the menu to save your go-to meals here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {favoriteDishes.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Customer Feedback Form */}
      <section className="bg-white border border-stone-200 rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold text-[#18181B] mb-1">
          Share Feedback with CampusBite Kitchen
        </h2>
        <p className="text-xs text-stone-500 mb-4">
          Suggest a new dish, report delivery feedback, or request campus coverage.
        </p>
        <form onSubmit={handleFeedbackSubmit} className="flex flex-col sm:flex-row gap-3">
          <select
            value={fbCategory}
            onChange={(e) => setFbCategory(e.target.value as CustomerFeedback['category'])}
            className="px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-white"
          >
            <option value="Food Quality">Food Quality</option>
            <option value="Delivery">Delivery</option>
            <option value="Pricing">Pricing</option>
            <option value="App Experience">App Experience</option>
            <option value="Other">Other</option>
          </select>
          <input
            type="text"
            required
            minLength={5}
            maxLength={500}
            value={fbMessage}
            onChange={(e) => setFbMessage(e.target.value)}
            placeholder="Write your suggestion or feedback..."
            className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-[#EA580C]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#EA580C] text-white text-xs font-semibold hover:bg-[#C2410C] cursor-pointer shrink-0"
          >
            Send Feedback
          </button>
        </form>
      </section>
    </div>
  );
}

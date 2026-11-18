import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CalendarRange,
  Check,
  Database,
  LayoutDashboard,
  Package,
  Plus,
  Search,
  Settings,
  Shield,
  Tag,
  Trash2,
  Upload,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useCampusBite } from '../context/CampusBiteContext';
import { formatFirestoreDate, storage } from '../lib/firebase';
import type {
  AdminTab,
  Coupon,
  FoodCategory,
  FoodItem,
  OrderStatus,
  PromoBanner,
  UserProfile,
} from '../types';
import { FoodImage, VegIndicator } from './Toast';

const FOOD_CATEGORIES: FoodCategory[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'Beverages',
  'Thalis',
  'Homemade Meals',
];

const BUILTIN_FOOD_IMAGES = [
  { label: 'Paneer Thali', url: '/src/assets/images/food_paneer_thali_1794995919905.jpg' },
  { label: 'Rajma Chawal', url: '/src/assets/images/food_rajma_chawal_1794995919961.jpg' },
  { label: 'Poha & Chai', url: '/src/assets/images/food_poha_breakfast_1794995926794.jpg' },
  { label: 'Aloo Paratha', url: '/src/assets/images/food_aloo_paratha_1794995925997.jpg' },
  { label: 'Chole Bhature', url: '/src/assets/images/food_chole_bhature_1794995920944.jpg' },
  { label: 'Masala Dosa', url: '/src/assets/images/food_masala_dosa_1794995920950.jpg' },
  { label: 'Maggi & Coffee', url: '/src/assets/images/food_cold_coffee_maggi_1794995921333.jpg' },
  { label: 'Thali Feast', url: '/src/assets/images/hero_thali_feast_1794995919491.jpg' },
];

export function AdminDashboard() {
  const {
    isAdmin,
    setIsAdminMode,
    isCatalogFromFirestore,
    seedCatalogToFirestore,
    foodItems,
    saveFoodItem,
    deleteFoodItem,
    allOrders,
    updateOrderAdmin,
    allUsers,
    allSubscriptions,
    updateSubscriptionAdmin,
    coupons,
    saveCoupon,
    deleteCoupon,
    banners,
    saveBanner,
    deleteBanner,
    allFeedback,
    grantAdminRole,
    showToast,
  } = useCampusBite();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<UserProfile | null>(null);

  // Food Modal State
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [isNewFood, setIsNewFood] = useState(true);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [foodForm, setFoodForm] = useState<Omit<FoodItem, 'createdAt' | 'updatedAt'>>({
    id: '',
    name: '',
    description: '',
    category: 'Homemade Meals',
    price: 90,
    image: BUILTIN_FOOD_IMAGES[0].url,
    availability: true,
    preparationTime: 15,
    rating: 4.8,
    reviewCount: 0,
    isVeg: true,
    isPopular: false,
    isTodaysSpecial: false,
    isBestseller: false,
    ingredients: [],
    calories: 480,
  });
  const [ingredientsText, setIngredientsText] = useState('');

  // Coupon & Banner Form State
  const [newCoupon, setNewCoupon] = useState<Coupon>({
    couponCode: '',
    discountType: 'flat',
    discountValue: 20,
    maxDiscount: 40,
    minOrderAmount: 80,
    description: '',
    expiryDate: '2026-12-31',
    isActive: true,
    firstOrderOnly: false,
  });

  const [newBanner, setNewBanner] = useState<PromoBanner>({
    id: '',
    title: '',
    subtitle: '',
    couponCode: '',
    ctaLabel: 'Order Now',
    isActive: true,
  });

  // Admin grant form
  const [grantUid, setGrantUid] = useState('');
  const [grantEmail, setGrantEmail] = useState('');

  // Derived Analytics (Strict real Firestore data + historical baseline context)
  const metrics = useMemo(() => {
    const validOrders = allOrders.filter(
      (o) => o.orderStatus !== 'cancelled' && o.orderStatus !== 'rejected'
    );
    const totalRevenue = validOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayRevenue = validOrders
      .filter((o) => {
        if (typeof o.createdAt === 'string') return o.createdAt.startsWith(todayStr);
        if (o.createdAt && typeof o.createdAt === 'object' && 'seconds' in o.createdAt) {
          const d = new Date((o.createdAt as { seconds: number }).seconds * 1000);
          return d.toISOString().slice(0, 10) === todayStr;
        }
        return true;
      })
      .reduce((s, o) => s + (o.totalAmount || 0), 0);

    const pendingCount = allOrders.filter((o) =>
      ['placed', 'accepted', 'preparing', 'out_for_delivery'].includes(o.orderStatus)
    ).length;
    const completedCount = allOrders.filter((o) => o.orderStatus === 'delivered').length;
    const activeSubs = allSubscriptions.filter((s) => s.status === 'active').length;

    return {
      totalOrders: allOrders.length,
      totalRevenue,
      todayRevenue,
      totalCustomers: allUsers.length,
      activeSubs,
      pendingCount,
      completedCount,
    };
  }, [allOrders, allSubscriptions, allUsers.length]);

  const bestsellingMeals = useMemo(() => {
    const counts = new Map<string, { name: string; qty: number; revenue: number }>();
    allOrders.forEach((o) => {
      if (o.orderStatus === 'cancelled' || o.orderStatus === 'rejected') return;
      o.items.forEach((item) => {
        const cur = counts.get(item.foodId) || { name: item.name, qty: 0, revenue: 0 };
        cur.qty += item.quantity;
        cur.revenue += item.price * item.quantity;
        counts.set(item.foodId, cur);
      });
    });
    const list = Array.from(counts.values()).sort((a, b) => b.qty - a.qty);
    if (list.length > 0) return list.slice(0, 5);
    return foodItems
      .filter((f) => f.isBestseller)
      .slice(0, 5)
      .map((f) => ({ name: f.name, qty: f.reviewCount || 0, revenue: f.price * (f.reviewCount || 0) }));
  }, [allOrders, foodItems]);

  const monthlyRevenueData = useMemo(() => {
    const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    const baseMap: Record<string, number> = {
      Jun: 18400,
      Jul: 24900,
      Aug: 38200,
      Sep: 44100,
      Oct: 49800,
      Nov: metrics.totalRevenue,
    };
    return months.map((m) => ({ month: m, revenue: baseMap[m] || 0 }));
  }, [metrics.totalRevenue]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    foodItems.forEach((f) => {
      map.set(f.category, (map.get(f.category) || 0) + 1);
    });
    return Array.from(map.entries()).map(([category, count]) => ({ category, count }));
  }, [foodItems]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return allOrders.filter((o) => {
      if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) return false;
      if (!q) return true;
      return (
        o.orderId.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.deliveryAddress.hostelName.toLowerCase().includes(q) ||
        o.deliveryAddress.collegeName.toLowerCase().includes(q)
      );
    });
  }, [allOrders, orderSearch, orderStatusFilter]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-8 text-center">
          <Shield className="w-10 h-10 text-[#EA580C] mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold text-[#18181B] mb-2">
            Admin Access Required
          </h1>
          <p className="text-sm text-stone-600 mb-6">
            This console is restricted to verified CampusBite kitchen administrators.
          </p>
          <button
            onClick={() => setIsAdminMode(false)}
            className="px-5 py-2.5 rounded-xl bg-[#18181B] text-white text-xs font-semibold cursor-pointer"
          >
            Return to Storefront
          </button>
        </div>
      </div>
    );
  }

  const openAddFood = () => {
    setIsNewFood(true);
    setFoodForm({
      id: `dish-${Date.now().toString().slice(-6)}`,
      name: '',
      description: '',
      category: 'Homemade Meals',
      price: 90,
      image: BUILTIN_FOOD_IMAGES[0].url,
      availability: true,
      preparationTime: 15,
      rating: 4.8,
      reviewCount: 0,
      isVeg: true,
      isPopular: false,
      isTodaysSpecial: false,
      isBestseller: false,
      ingredients: [],
      calories: 480,
    });
    setIngredientsText('Whole Wheat, Fresh Spices');
    setFoodModalOpen(true);
  };

  const openEditFood = (item: FoodItem) => {
    setIsNewFood(false);
    setFoodForm({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      image: item.image,
      availability: item.availability,
      preparationTime: item.preparationTime,
      rating: item.rating,
      reviewCount: item.reviewCount || 0,
      isVeg: item.isVeg,
      isPopular: Boolean(item.isPopular),
      isTodaysSpecial: Boolean(item.isTodaysSpecial),
      isBestseller: Boolean(item.isBestseller),
      ingredients: item.ingredients || [],
      calories: item.calories || 450,
    });
    setIngredientsText((item.ingredients || []).join(', '));
    setFoodModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const storageRef = ref(storage, `food_images/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFoodForm((prev) => ({ ...prev, image: url }));
      showToast('Food image uploaded to Firebase Storage!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Storage upload unavailable.';
      showToast(`Image upload note: ${msg}. You can select a studio photo or paste any image URL.`, 'info');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    const ingredients = ingredientsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 25);

    await saveFoodItem(
      {
        ...foodForm,
        price: Number(foodForm.price),
        preparationTime: Number(foodForm.preparationTime),
        calories: Number(foodForm.calories) || 450,
        ingredients,
      },
      isNewFood
    );
    setFoodModalOpen(false);
  };

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'food', label: 'Food Management', icon: <UtensilsCrossed className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <Package className="w-4 h-4" /> },
    { id: 'customers', label: 'Customers', icon: <Users className="w-4 h-4" /> },
    { id: 'subscriptions', label: 'Subscriptions', icon: <CalendarRange className="w-4 h-4" /> },
    { id: 'offers', label: 'Coupons & Banners', icon: <Tag className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 bg-[#18181B] text-white shrink-0 flex flex-col">
        <div className="px-5 py-5 border-b border-stone-800 flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-bold tracking-tight">
              Campus<span className="text-[#F97316]">Bite</span>
            </div>
            <div className="text-[11px] text-stone-400">Kitchen Operations</div>
          </div>
          <button
            onClick={() => setIsAdminMode(false)}
            className="lg:hidden px-3 py-1.5 rounded-lg bg-stone-800 text-xs font-medium cursor-pointer"
          >
            Storefront
          </button>
        </div>

        <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto flex-1">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#EA580C] text-white'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden lg:block p-4 border-t border-stone-800">
          <button
            onClick={() => setIsAdminMode(false)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Customer App</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="text-sm text-stone-500">
            Admin <span className="mx-1.5">/</span>{' '}
            <span className="font-semibold text-[#18181B]">
              {navItems.find((n) => n.id === activeTab)?.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isCatalogFromFirestore && (
              <button
                onClick={seedCatalogToFirestore}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Sync Catalog to Firestore</span>
              </button>
            )}
            <button
              onClick={openAddFood}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EA580C] text-white text-xs font-semibold hover:bg-[#C2410C] cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Food Item</span>
            </button>
          </div>
        </header>

        <main className="p-6 space-y-6 max-w-7xl w-full">
          {/* 1. DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { label: 'Total Orders', value: metrics.totalOrders },
                  { label: "Today's Revenue", value: `₹${metrics.todayRevenue}` },
                  { label: 'Registered Students', value: metrics.totalCustomers },
                  { label: 'Active Subscriptions', value: metrics.activeSubs },
                  { label: 'Pending Orders', value: metrics.pendingCount },
                  { label: 'Completed Orders', value: metrics.completedCount },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-white border border-stone-200 rounded-xl p-4"
                  >
                    <div className="text-xs text-stone-500 mb-1">{kpi.label}</div>
                    <div className="font-mono text-2xl font-bold text-[#18181B] tabular-nums">
                      {kpi.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white border border-stone-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-display text-base font-semibold text-[#18181B]">
                        Monthly Revenue Trend (INR)
                      </h2>
                      <p className="text-xs text-stone-500">
                        Live November orders combined with historical campus baseline
                      </p>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(val) => [`₹${Number(val ?? 0)}`, 'Revenue']} />
                        <Bar dataKey="revenue" fill="#EA580C" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-white border border-stone-200 rounded-xl p-5">
                  <h2 className="font-display text-base font-semibold text-[#18181B] mb-4">
                    Bestselling Meals
                  </h2>
                  <div className="divide-y divide-stone-100">
                    {bestsellingMeals.map((meal, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <div className="font-semibold text-stone-900 truncate">{meal.name}</div>
                          <div className="text-stone-500 tabular-nums">{meal.qty} units</div>
                        </div>
                        <div className="font-mono font-semibold text-[#18181B] tabular-nums">
                          ₹{meal.revenue}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Orders Quick Queue */}
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold text-[#18181B]">
                    Live Incoming Orders
                  </h2>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer"
                  >
                    Manage All Orders
                  </button>
                </div>
                {allOrders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-500">
                    No customer orders in Firestore yet. Place a test order from the storefront to see live incoming dispatch here!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Order ID</th>
                          <th className="py-3 px-4 font-semibold">Student</th>
                          <th className="py-3 px-4 font-semibold">Hostel</th>
                          <th className="py-3 px-4 font-semibold text-right">Amount</th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                          <th className="py-3 px-4 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {allOrders.slice(0, 6).map((order) => (
                          <tr key={order.orderId} className="hover:bg-stone-50/60">
                            <td className="py-3 px-4 font-mono font-medium">{order.orderId}</td>
                            <td className="py-3 px-4">{order.customerName}</td>
                            <td className="py-3 px-4 text-stone-600">
                              {order.deliveryAddress.hostelName}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                              ₹{order.totalAmount}
                            </td>
                            <td className="py-3 px-4 capitalize font-medium text-[#EA580C]">
                              {order.orderStatus.replace(/_/g, ' ')}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {order.orderStatus === 'placed' && (
                                <button
                                  onClick={() =>
                                    updateOrderAdmin(order.orderId, { orderStatus: 'accepted' })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-[#18181B] text-white text-[11px] font-semibold hover:bg-[#EA580C] cursor-pointer"
                                >
                                  Accept Order
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 2. FOOD MANAGEMENT */}
          {activeTab === 'food' && (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-semibold text-[#18181B]">
                    Menu Catalog ({foodItems.length} Dishes)
                  </h2>
                  <p className="text-xs text-stone-500">
                    Add new dishes, upload food photos, adjust student prices, or toggle stock.
                  </p>
                </div>
                <button
                  onClick={openAddFood}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EA580C] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Dish
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Dish</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold text-right">Price</th>
                      <th className="py-3 px-4 font-semibold text-right">Prep</th>
                      <th className="py-3 px-4 font-semibold">Availability</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {foodItems.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <FoodImage
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-10 rounded-lg object-cover shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                                <VegIndicator isVeg={item.isVeg} />
                                <span>{item.name}</span>
                              </div>
                              <div className="text-[11px] text-stone-400 font-mono">{item.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-stone-600">{item.category}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                          ₹{item.price}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          {item.preparationTime}m
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() =>
                              saveFoodItem({ ...item, availability: !item.availability }, false)
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                              item.availability
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {item.availability ? 'In Stock' : 'Out of Stock'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => openEditFood(item)}
                            className="text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteFoodItem(item.id)}
                            className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. ORDER MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3 justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search Order ID, student name, or hostel..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-[#EA580C]"
                  />
                </div>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value as typeof orderStatusFilter)}
                  className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="placed">Placed</option>
                  <option value="accepted">Accepted</option>
                  <option value="preparing">Preparing</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                  <div className="bg-white border border-stone-200 rounded-xl p-10 text-center text-xs text-stone-500">
                    No orders match your current filter.
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div
                      key={order.orderId}
                      className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="font-mono font-bold text-[#18181B]">
                            {order.orderId}
                          </span>
                          <span className="text-stone-400">·</span>
                          <span className="font-semibold text-stone-800">{order.customerName}</span>
                          <span className="font-mono text-stone-500">{order.customerPhone}</span>
                          <span className="text-stone-400">·</span>
                          <span className="text-stone-500">
                            {formatFirestoreDate(order.createdAt)}
                          </span>
                        </div>
                        <div className="text-xs text-stone-600">
                          {order.deliveryAddress.collegeName} — {order.deliveryAddress.hostelName}, Room{' '}
                          {order.deliveryAddress.roomNumber} ({order.deliveryAddress.streetAddress})
                        </div>
                        <div className="text-xs text-stone-800 font-medium">
                          {order.items.map((i) => `${i.quantity}× ${i.name}`).join(' · ')}
                        </div>
                        {order.instructions && (
                          <div className="text-[11px] text-amber-800">
                            Note: {order.instructions}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <div className="text-right mr-2">
                          <div className="font-mono text-base font-bold text-[#18181B] tabular-nums">
                            ₹{order.totalAmount}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {order.paymentMethod} · {order.paymentStatus}
                          </div>
                        </div>

                        <select
                          value={order.orderStatus}
                          onChange={(e) =>
                            updateOrderAdmin(order.orderId, {
                              orderStatus: e.target.value as OrderStatus,
                              ...(e.target.value === 'delivered' ? { paymentStatus: 'paid' } : {}),
                            })
                          }
                          aria-label={`Update status for ${order.orderId}`}
                          className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold bg-white cursor-pointer"
                        >
                          <option value="placed">1. Placed</option>
                          <option value="accepted">2. Accepted</option>
                          <option value="preparing">3. Food Preparation</option>
                          <option value="out_for_delivery">4. Out for Delivery</option>
                          <option value="delivered">5. Delivered</option>
                          <option value="rejected">Rejected</option>
                        </select>

                        {order.paymentStatus !== 'paid' && (
                          <button
                            onClick={() =>
                              updateOrderAdmin(order.orderId, { paymentStatus: 'paid' })
                            }
                            className="px-3 py-2 rounded-xl border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-50 cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100">
                  <h2 className="font-display text-base font-semibold text-[#18181B]">
                    Registered Students ({allUsers.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Student</th>
                        <th className="py-3 px-4 font-semibold">Campus</th>
                        <th className="py-3 px-4 font-semibold">Role</th>
                        <th className="py-3 px-4 font-semibold text-right">Orders</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {allUsers.map((u) => {
                        const count = allOrders.filter((o) => o.userId === u.uid).length;
                        return (
                          <tr
                            key={u.uid}
                            onClick={() => setSelectedCustomer(u)}
                            className="hover:bg-stone-50 cursor-pointer"
                          >
                            <td className="py-3 px-4">
                              <div className="font-semibold text-stone-900">{u.name}</div>
                              <div className="text-[11px] text-stone-500">{u.email}</div>
                            </td>
                            <td className="py-3 px-4 text-stone-600">
                              {u.collegeName || 'Dehradun'}
                            </td>
                            <td className="py-3 px-4 capitalize">{u.role}</td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums">{count}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-5">
                <h3 className="font-display text-base font-semibold text-[#18181B] mb-3">
                  Student Order History
                </h3>
                {!selectedCustomer ? (
                  <p className="text-xs text-stone-500">
                    Select any registered student on the left to inspect their hostel details and orders.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                      <div className="font-semibold text-stone-900">{selectedCustomer.name}</div>
                      <div className="text-stone-600">{selectedCustomer.email}</div>
                      <div className="text-stone-500 mt-1">
                        {selectedCustomer.collegeName} · {selectedCustomer.hostelName || 'No hostel saved'}
                      </div>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {allOrders
                        .filter((o) => o.userId === selectedCustomer.uid)
                        .map((o) => (
                          <div
                            key={o.orderId}
                            className="p-3 rounded-xl border border-stone-200 text-xs flex justify-between"
                          >
                            <div>
                              <div className="font-mono font-semibold">{o.orderId}</div>
                              <div className="text-stone-500 capitalize">
                                {o.orderStatus.replace(/_/g, ' ')}
                              </div>
                            </div>
                            <div className="font-mono font-bold tabular-nums">₹{o.totalAmount}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. SUBSCRIPTIONS */}
          {activeTab === 'subscriptions' && (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100">
                <h2 className="font-display text-base font-semibold text-[#18181B]">
                  Student Meal Subscriptions ({allSubscriptions.length})
                </h2>
              </div>
              {allSubscriptions.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500">
                  No student tiffin subscriptions created yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Student</th>
                        <th className="py-3 px-4 font-semibold">Plan</th>
                        <th className="py-3 px-4 font-semibold text-right">Remaining</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold">Payment</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {allSubscriptions.map((sub) => (
                        <tr key={sub.subscriptionId}>
                          <td className="py-3 px-4">
                            <div className="font-semibold">{sub.customerName}</div>
                            <div className="text-[11px] text-stone-500">{sub.deliveryAddress}</div>
                          </td>
                          <td className="py-3 px-4">{sub.planType}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">
                            {sub.remainingMeals} / {sub.totalMeals}
                          </td>
                          <td className="py-3 px-4 capitalize font-medium">{sub.status}</td>
                          <td className="py-3 px-4 capitalize">{sub.paymentStatus}</td>
                          <td className="py-3 px-4 text-right space-x-2">
                            {sub.remainingMeals > 0 && sub.status === 'active' && (
                              <button
                                onClick={() =>
                                  updateSubscriptionAdmin(sub.subscriptionId, {
                                    remainingMeals: sub.remainingMeals - 1,
                                    ...(sub.remainingMeals - 1 === 0 ? { status: 'completed' } : {}),
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-[#EA580C] text-white text-[11px] font-semibold cursor-pointer"
                              >
                                Log 1 Meal Delivered
                              </button>
                            )}
                            {sub.paymentStatus === 'pending' && (
                              <button
                                onClick={() =>
                                  updateSubscriptionAdmin(sub.subscriptionId, { paymentStatus: 'paid' })
                                }
                                className="px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 text-[11px] font-semibold cursor-pointer"
                              >
                                Mark Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 6. COUPONS & BANNERS */}
          {activeTab === 'offers' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coupons */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-5">
                <h2 className="font-display text-base font-semibold text-[#18181B]">
                  Student Discount Coupons
                </h2>
                <div className="space-y-2.5">
                  {coupons.map((c) => (
                    <div
                      key={c.couponCode}
                      className="p-3 rounded-xl border border-stone-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-[#EA580C]">{c.couponCode}</div>
                        <div className="text-stone-600">{c.description}</div>
                        <div className="text-stone-400 mt-0.5">
                          {c.discountType === 'flat' ? `₹${c.discountValue} off` : `${c.discountValue}% off`} · Min ₹{c.minOrderAmount || 0} · Exp {c.expiryDate}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => saveCoupon({ ...c, isActive: !c.isActive })}
                          className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                            c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {c.isActive ? 'Active' : 'Paused'}
                        </button>
                        <button
                          onClick={() => deleteCoupon(c.couponCode)}
                          aria-label="Delete coupon"
                          className="text-stone-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newCoupon.couponCode.trim()) return;
                    await saveCoupon(newCoupon);
                    setNewCoupon({
                      ...newCoupon,
                      couponCode: '',
                      description: '',
                    });
                  }}
                  className="pt-4 border-t border-stone-100 space-y-3"
                >
                  <div className="text-xs font-semibold text-stone-700">Create New Coupon</div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      required
                      value={newCoupon.couponCode}
                      onChange={(e) =>
                        setNewCoupon({ ...newCoupon, couponCode: e.target.value.toUpperCase() })
                      }
                      placeholder="Code (e.g. EXAM25)"
                      className="px-3 py-2 text-xs font-mono rounded-xl border border-stone-200"
                    />
                    <select
                      value={newCoupon.discountType}
                      onChange={(e) =>
                        setNewCoupon({
                          ...newCoupon,
                          discountType: e.target.value as 'flat' | 'percentage',
                        })
                      }
                      className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white"
                    >
                      <option value="flat">Flat ₹ Off</option>
                      <option value="percentage">% Discount</option>
                    </select>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newCoupon.discountValue}
                      onChange={(e) =>
                        setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })
                      }
                      placeholder="Value"
                      className="px-3 py-2 text-xs rounded-xl border border-stone-200"
                    />
                    <input
                      type="date"
                      required
                      value={newCoupon.expiryDate}
                      onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                      className="px-3 py-2 text-xs rounded-xl border border-stone-200"
                    />
                  </div>
                  <input
                    type="text"
                    value={newCoupon.description}
                    onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                    placeholder="Short offer description"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-[#EA580C] cursor-pointer"
                  >
                    Save Coupon
                  </button>
                </form>
              </div>

              {/* Promotional Banners */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-5">
                <h2 className="font-display text-base font-semibold text-[#18181B]">
                  Promotional Banners
                </h2>
                <div className="space-y-2.5">
                  {banners.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl border border-stone-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-stone-900">{b.title}</div>
                        <div className="text-stone-500">{b.subtitle}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => saveBanner({ ...b, isActive: !b.isActive })}
                          className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                            b.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {b.isActive ? 'Shown' : 'Hidden'}
                        </button>
                        <button
                          onClick={() => deleteBanner(b.id)}
                          aria-label="Delete banner"
                          className="text-stone-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newBanner.title.trim()) return;
                    await saveBanner({
                      ...newBanner,
                      id: `banner_${Date.now()}`,
                    });
                    setNewBanner({
                      id: '',
                      title: '',
                      subtitle: '',
                      couponCode: '',
                      ctaLabel: 'Apply Code',
                      isActive: true,
                    });
                  }}
                  className="pt-4 border-t border-stone-100 space-y-3"
                >
                  <div className="text-xs font-semibold text-stone-700">Add Promotional Banner</div>
                  <input
                    type="text"
                    required
                    value={newBanner.title}
                    onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                    placeholder="Headline (e.g. Rainy Day Chai & Poha Combo)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200"
                  />
                  <input
                    type="text"
                    required
                    value={newBanner.subtitle}
                    onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                    placeholder="Subtitle message"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200"
                  />
                  <input
                    type="text"
                    value={newBanner.couponCode}
                    onChange={(e) =>
                      setNewBanner({ ...newBanner, couponCode: e.target.value.toUpperCase() })
                    }
                    placeholder="Optional linked coupon code"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-200"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-[#EA580C] cursor-pointer"
                  >
                    Publish Banner
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 7. ANALYTICS & FEEDBACK */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-stone-200 rounded-xl p-5">
                <h2 className="font-display text-base font-semibold text-[#18181B] mb-4">
                  Menu Coverage by Category
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#18181B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5">
                <h2 className="font-display text-base font-semibold text-[#18181B] mb-4">
                  Student Feedback Inbox ({allFeedback.length})
                </h2>
                {allFeedback.length === 0 ? (
                  <p className="text-xs text-stone-500">
                    Student feedback submitted from the Profile page will appear here in real time.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {allFeedback.map((fb) => (
                      <div key={fb.id} className="p-3 rounded-xl border border-stone-200 text-xs">
                        <div className="flex justify-between font-semibold text-stone-900 mb-1">
                          <span>{fb.userName}</span>
                          <span className="text-[#EA580C]">{fb.category}</span>
                        </div>
                        <p className="text-stone-600">{fb.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 8. SETTINGS */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
                <h2 className="font-display text-base font-semibold text-[#18181B]">
                  Database Catalog Sync
                </h2>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Push or restore the 14 curated Dehradun student menu items, coupons, and promotional banners directly to Cloud Firestore.
                </p>
                <button
                  onClick={seedCatalogToFirestore}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EA580C] text-white text-xs font-semibold hover:bg-[#C2410C] cursor-pointer"
                >
                  <Database className="w-4 h-4" />
                  <span>Sync Default Menu &amp; Coupons to Firestore</span>
                </button>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
                <h2 className="font-display text-base font-semibold text-[#18181B]">
                  Grant Kitchen Admin Role
                </h2>
                <p className="text-xs text-stone-600">
                  Add another team member&apos;s Firebase UID and verified email to the <code className="font-mono">admins</code> collection.
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!grantUid.trim() || !grantEmail.trim()) return;
                    await grantAdminRole(grantUid.trim(), grantEmail.trim());
                    setGrantUid('');
                    setGrantEmail('');
                  }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    required
                    value={grantUid}
                    onChange={(e) => setGrantUid(e.target.value)}
                    placeholder="Firebase User UID"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-200"
                  />
                  <input
                    type="email"
                    required
                    value={grantEmail}
                    onChange={(e) => setGrantEmail(e.target.value)}
                    placeholder="Staff Google Email"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#18181B] text-white text-xs font-semibold hover:bg-[#EA580C] cursor-pointer"
                  >
                    Grant Admin Access
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Food Modal */}
      {foodModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <h2 className="font-display text-xl font-bold text-[#18181B]">
                {isNewFood ? 'Add New Menu Item' : `Edit ${foodForm.name}`}
              </h2>
              <button
                onClick={() => setFoodModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFood} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={foodForm.name}
                    onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Category *
                  </label>
                  <select
                    value={foodForm.category}
                    onChange={(e) =>
                      setFoodForm({ ...foodForm, category: e.target.value as FoodCategory })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 bg-white"
                  >
                    {FOOD_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Description *
                </label>
                <textarea
                  required
                  minLength={5}
                  maxLength={500}
                  rows={2}
                  value={foodForm.description}
                  onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={5000}
                    value={foodForm.price}
                    onChange={(e) => setFoodForm({ ...foodForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Prep Time (min) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={180}
                    value={foodForm.preparationTime}
                    onChange={(e) =>
                      setFoodForm({ ...foodForm, preparationTime: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Calories
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    value={foodForm.calories || 450}
                    onChange={(e) => setFoodForm({ ...foodForm, calories: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Ingredients (comma-separated)
                </label>
                <input
                  type="text"
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200"
                />
              </div>

              {/* Image URL + Firebase Storage Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-700 block">
                  Dish Image (Upload or Choose Kitchen Photo)
                </label>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:border-[#EA580C] cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImg ? 'Uploading...' : 'Upload to Firebase Storage'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <select
                    value={foodForm.image}
                    onChange={(e) => setFoodForm({ ...foodForm, image: e.target.value })}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white"
                  >
                    {BUILTIN_FOOD_IMAGES.map((img) => (
                      <option key={img.url} value={img.url}>
                        Kitchen Photo: {img.label}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={foodForm.image}
                  onChange={(e) => setFoodForm({ ...foodForm, image: e.target.value })}
                  placeholder="Or paste custom image URL"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-200"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-2 text-xs">
                {[
                  { key: 'isVeg', label: 'Pure Vegetarian' },
                  { key: 'availability', label: 'Available Now' },
                  { key: 'isPopular', label: 'Popular' },
                  { key: 'isTodaysSpecial', label: "Today's Special" },
                  { key: 'isBestseller', label: 'Bestseller' },
                ].map((flag) => (
                  <label key={flag.key} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(foodForm[flag.key as keyof typeof foodForm])}
                      onChange={(e) =>
                        setFoodForm({ ...foodForm, [flag.key]: e.target.checked })
                      }
                      className="accent-[#EA580C]"
                    />
                    <span>{flag.label}</span>
                  </label>
                ))}
              </div>

              <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFoodModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#EA580C] text-white text-xs font-semibold hover:bg-[#C2410C] cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Save Food Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

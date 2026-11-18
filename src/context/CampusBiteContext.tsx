import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
  signInWithGoogle,
  signOutUser,
} from '../lib/firebase';
import {
  DEHRADUN_LOCATIONS,
  INITIAL_BANNERS,
  INITIAL_COUPONS,
  INITIAL_FOOD_ITEMS,
  INITIAL_REVIEWS,
} from '../data/seedData';
import type {
  CartItem,
  Coupon,
  CustomerFeedback,
  CustomerView,
  DeliveryAddressPayload,
  FoodItem,
  FoodReview,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PlanType,
  PromoBanner,
  SavedAddress,
  Subscription,
  UserProfile,
} from '../types';
import { ToastStack, type ToastMessage } from '../components/Toast';

interface CampusBiteContextValue {
  user: User | null;
  profile: UserProfile | null;
  authReady: boolean;
  isAdmin: boolean;
  isCatalogFromFirestore: boolean;
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  activeView: CustomerView;
  setActiveView: (view: CustomerView) => void;
  isAdminMode: boolean;
  setIsAdminMode: (v: boolean) => void;
  isCartOpen: boolean;
  setIsCartOpen: (v: boolean) => void;
  isAiOpen: boolean;
  setIsAiOpen: (v: boolean) => void;
  selectedFood: FoodItem | null;
  setSelectedFood: (item: FoodItem | null) => void;
  foodItems: FoodItem[];
  coupons: Coupon[];
  banners: PromoBanner[];
  reviews: FoodReview[];
  orders: Order[];
  allOrders: Order[];
  subscriptions: Subscription[];
  allSubscriptions: Subscription[];
  allUsers: UserProfile[];
  allFeedback: CustomerFeedback[];
  cart: CartItem[];
  appliedCouponCode: string;
  setAppliedCouponCode: (code: string) => void;
  cartSubtotal: number;
  cartDeliveryCharge: number;
  cartDiscount: number;
  cartTotal: number;
  cartItemCount: number;
  loadingData: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  addToCart: (item: FoodItem, qty?: number) => void;
  updateCartQty: (foodId: string, qty: number) => void;
  removeFromCart: (foodId: string) => void;
  clearCart: () => Promise<void>;
  toggleFavorite: (foodId: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addSavedAddress: (addr: Omit<SavedAddress, 'id'>) => Promise<void>;
  removeSavedAddress: (id: string) => Promise<void>;
  placeOrder: (params: {
    customerName: string;
    customerPhone: string;
    deliveryAddress: DeliveryAddressPayload;
    instructions: string;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    paymentReference?: string;
  }) => Promise<Order | null>;
  cancelCustomerOrder: (orderId: string) => Promise<void>;
  createSubscription: (params: {
    planType: PlanType;
    cadence: 'weekly' | 'monthly';
    mealSlot: 'lunch' | 'dinner' | 'both';
    price: number;
    totalMeals: number;
    startDate: string;
    preferredMeals: string[];
    dietaryPreference: 'Pure Veg' | 'Veg + Egg';
    deliveryAddress: string;
  }) => Promise<void>;
  updateSubscriptionCustomer: (
    subscriptionId: string,
    status: 'active' | 'paused' | 'cancelled'
  ) => Promise<void>;
  submitReview: (foodId: string, rating: number, comment: string) => Promise<void>;
  submitFeedback: (
    category: CustomerFeedback['category'],
    message: string
  ) => Promise<void>;
  // Admin operations
  seedCatalogToFirestore: () => Promise<void>;
  saveFoodItem: (item: Omit<FoodItem, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<void>;
  deleteFoodItem: (foodId: string) => Promise<void>;
  updateOrderAdmin: (
    orderId: string,
    updates: {
      orderStatus?: OrderStatus;
      paymentStatus?: PaymentStatus;
      estimatedDeliveryTime?: string;
    }
  ) => Promise<void>;
  updateSubscriptionAdmin: (
    subscriptionId: string,
    updates: {
      status?: Subscription['status'];
      remainingMeals?: number;
      paymentStatus?: Subscription['paymentStatus'];
    }
  ) => Promise<void>;
  saveCoupon: (coupon: Coupon) => Promise<void>;
  deleteCoupon: (couponCode: string) => Promise<void>;
  saveBanner: (banner: PromoBanner) => Promise<void>;
  deleteBanner: (bannerId: string) => Promise<void>;
  grantAdminRole: (uid: string, email: string) => Promise<void>;
  showToast: (message: string, type?: ToastMessage['type']) => void;
}

const CampusBiteContext = createContext<CampusBiteContextValue | null>(null);

const LOCAL_CART_KEY = 'campusbite_cart_v1';
const LOCAL_COUPON_KEY = 'campusbite_coupon_v1';
const LOCAL_LOC_KEY = 'campusbite_location_v1';

export function CampusBiteProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdminDoc, setIsAdminDoc] = useState(false);

  const [selectedLocation, setSelectedLocationState] = useState<string>(() => {
    return localStorage.getItem(LOCAL_LOC_KEY) || DEHRADUN_LOCATIONS[0];
  });
  const [activeView, setActiveView] = useState<CustomerView>('home');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  const [firestoreFoodItems, setFirestoreFoodItems] = useState<FoodItem[]>([]);
  const [firestoreCoupons, setFirestoreCoupons] = useState<Coupon[]>([]);
  const [firestoreBanners, setFirestoreBanners] = useState<PromoBanner[]>([]);
  const [firestoreReviews, setFirestoreReviews] = useState<FoodReview[]>([]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allFeedback, setAllFeedback] = useState<CustomerFeedback[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [appliedCouponCode, setAppliedCouponCodeState] = useState<string>(() => {
    return localStorage.getItem(LOCAL_COUPON_KEY) || '';
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastMessage['type'] = 'info') => {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3800);
    },
    []
  );

  const setSelectedLocation = useCallback((loc: string) => {
    setSelectedLocationState(loc);
    localStorage.setItem(LOCAL_LOC_KEY, loc);
  }, []);

  const isAdmin = useMemo(() => {
    if (!user || !user.emailVerified) return false;
    return (
      user.email === BOOTSTRAPPED_ADMIN_EMAIL ||
      isAdminDoc ||
      profile?.role === 'admin'
    );
  }, [user, isAdminDoc, profile]);

  const foodItems = useMemo(() => {
    return firestoreFoodItems.length > 0 ? firestoreFoodItems : INITIAL_FOOD_ITEMS;
  }, [firestoreFoodItems]);

  const coupons = useMemo(() => {
    return firestoreCoupons.length > 0 ? firestoreCoupons : INITIAL_COUPONS;
  }, [firestoreCoupons]);

  const banners = useMemo(() => {
    return firestoreBanners.length > 0 ? firestoreBanners : INITIAL_BANNERS;
  }, [firestoreBanners]);

  const reviews = useMemo(() => {
    if (firestoreReviews.length > 0) return firestoreReviews;
    return INITIAL_REVIEWS;
  }, [firestoreReviews]);

  // Listen to public catalog collections
  useEffect(() => {
    const unsubFood = onSnapshot(
      collection(db, 'food_items'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as FoodItem);
        setFirestoreFoodItems(list);
        setLoadingData(false);
      },
      (err) => {
        setLoadingData(false);
        console.error('Food items snapshot error:', err);
      }
    );

    const unsubCoupons = onSnapshot(
      collection(db, 'coupons'),
      (snap) => {
        setFirestoreCoupons(snap.docs.map((d) => d.data() as Coupon));
      },
      (err) => console.error('Coupons snapshot error:', err)
    );

    const unsubBanners = onSnapshot(
      collection(db, 'banners'),
      (snap) => {
        setFirestoreBanners(snap.docs.map((d) => d.data() as PromoBanner));
      },
      (err) => console.error('Banners snapshot error:', err)
    );

    const unsubReviews = onSnapshot(
      collection(db, 'reviews'),
      (snap) => {
        setFirestoreReviews(snap.docs.map((d) => d.data() as FoodReview));
      },
      (err) => console.error('Reviews snapshot error:', err)
    );

    return () => {
      unsubFood();
      unsubCoupons();
      unsubBanners();
      unsubReviews();
    };
  }, []);

  // Auth listener + user profile bootstrap
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setIsAdminDoc(false);
        setOrders([]);
        setSubscriptions([]);
        setAllOrders([]);
        setAllSubscriptions([]);
        setAllUsers([]);
        setAllFeedback([]);
        setIsAdminMode(false);
        setAuthReady(true);
        return;
      }

      try {
        // Check admins/{uid}
        const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
        const hasAdminMarker = adminSnap.exists();
        setIsAdminDoc(hasAdminMarker);

        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        const isBootstrappedAdmin =
          firebaseUser.email === BOOTSTRAPPED_ADMIN_EMAIL &&
          firebaseUser.emailVerified;

        if (!userSnap.exists()) {
          const codeSeed = firebaseUser.uid.slice(0, 6).toUpperCase();
          const newProfile: Record<string, unknown> = {
            uid: firebaseUser.uid,
            name: (firebaseUser.displayName || 'Dehradun Student').slice(0, 100),
            email: (firebaseUser.email || '').slice(0, 160),
            phone: '',
            role: isBootstrappedAdmin || hasAdminMarker ? 'admin' : 'student',
            collegeName: 'UPES Dehradun',
            hostelName: '',
            roomNumber: '',
            addresses: [],
            favorites: [],
            referralCode: `CB-${codeSeed}`,
            walletBalance: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
        }
      } catch (err) {
        console.error('Error initializing user profile:', err);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, []);

  // User-scoped Firestore listeners (Profile, Cart, Orders, Subscriptions)
  useEffect(() => {
    if (!authReady || !user) return;

    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`)
    );

    const unsubCart = onSnapshot(
      doc(db, 'carts', user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { items?: CartItem[]; couponCode?: string };
          if (Array.isArray(data.items)) {
            setCart(data.items);
            localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(data.items));
          }
          if (typeof data.couponCode === 'string') {
            setAppliedCouponCodeState(data.couponCode);
            localStorage.setItem(LOCAL_COUPON_KEY, data.couponCode);
          }
        }
      },
      (err) => console.error('Cart snapshot error:', err)
    );

    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubOrders = onSnapshot(
      ordersQuery,
      (snap) => {
        setOrders(snap.docs.map((d) => d.data() as Order));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    const subsQuery = query(
      collection(db, 'subscriptions'),
      where('userId', '==', user.uid)
    );
    const unsubSubs = onSnapshot(
      subsQuery,
      (snap) => {
        setSubscriptions(snap.docs.map((d) => d.data() as Subscription));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'subscriptions')
    );

    return () => {
      unsubProfile();
      unsubCart();
      unsubOrders();
      unsubSubs();
    };
  }, [authReady, user]);

  // Seed catalog automatically when an Admin signs in and Firestore food_items is empty
  const seedCatalogToFirestore = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const batch = writeBatch(db);
      for (const item of INITIAL_FOOD_ITEMS) {
        batch.set(doc(db, 'food_items', item.id), {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const coupon of INITIAL_COUPONS) {
        batch.set(doc(db, 'coupons', coupon.couponCode), coupon);
      }
      for (const banner of INITIAL_BANNERS) {
        batch.set(doc(db, 'banners', banner.id), banner);
      }
      await batch.commit();
      showToast('CampusBite menu, coupons, and banners synced to Firestore.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'food_items');
    }
  }, [isAdmin, showToast]);

  useEffect(() => {
    if (authReady && isAdmin && !loadingData && firestoreFoodItems.length === 0) {
      seedCatalogToFirestore().catch((e) => console.error('Auto-seed error:', e));
    }
  }, [authReady, isAdmin, loadingData, firestoreFoodItems.length, seedCatalogToFirestore]);

  // Admin-scoped Firestore listeners
  useEffect(() => {
    if (!authReady || !user || !isAdmin) return;

    const unsubAllOrders = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      (snap) => setAllOrders(snap.docs.map((d) => d.data() as Order)),
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    const unsubAllSubs = onSnapshot(
      collection(db, 'subscriptions'),
      (snap) => setAllSubscriptions(snap.docs.map((d) => d.data() as Subscription)),
      (err) => handleFirestoreError(err, OperationType.LIST, 'subscriptions')
    );

    const unsubAllUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => setAllUsers(snap.docs.map((d) => d.data() as UserProfile)),
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    );

    const unsubFeedback = onSnapshot(
      collection(db, 'feedback'),
      (snap) => setAllFeedback(snap.docs.map((d) => d.data() as CustomerFeedback)),
      (err) => handleFirestoreError(err, OperationType.LIST, 'feedback')
    );

    return () => {
      unsubAllOrders();
      unsubAllSubs();
      unsubAllUsers();
      unsubFeedback();
    };
  }, [authReady, user, isAdmin]);

  const persistCart = useCallback(
    async (nextCart: CartItem[], nextCoupon: string) => {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(nextCart));
      localStorage.setItem(LOCAL_COUPON_KEY, nextCoupon);
      if (user && user.emailVerified) {
        try {
          await setDoc(doc(db, 'carts', user.uid), {
            userId: user.uid,
            items: nextCart.slice(0, 50),
            couponCode: nextCoupon.slice(0, 32),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `carts/${user.uid}`);
        }
      }
    },
    [user]
  );

  const setAppliedCouponCode = useCallback(
    (code: string) => {
      const normalized = code.trim().toUpperCase().slice(0, 32);
      setAppliedCouponCodeState(normalized);
      persistCart(cart, normalized);
    },
    [cart, persistCart]
  );

  const addToCart = useCallback(
    (item: FoodItem, qty = 1) => {
      if (!item.availability) {
        showToast(`${item.name} is currently out of stock.`, 'error');
        return;
      }
      setCart((prev) => {
        const existing = prev.find((c) => c.foodId === item.id);
        const next = existing
          ? prev.map((c) =>
              c.foodId === item.id ? { ...c, quantity: Math.min(20, c.quantity + qty) } : c
            )
          : [
              ...prev,
              {
                foodId: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                isVeg: item.isVeg,
                quantity: qty,
              },
            ];
        persistCart(next, appliedCouponCode);
        return next;
      });
      showToast(`Added ${item.name} to cart`, 'success');
    },
    [appliedCouponCode, persistCart, showToast]
  );

  const updateCartQty = useCallback(
    (foodId: string, qty: number) => {
      setCart((prev) => {
        const next =
          qty <= 0
            ? prev.filter((c) => c.foodId !== foodId)
            : prev.map((c) => (c.foodId === foodId ? { ...c, quantity: Math.min(20, qty) } : c));
        persistCart(next, appliedCouponCode);
        return next;
      });
    },
    [appliedCouponCode, persistCart]
  );

  const removeFromCart = useCallback(
    (foodId: string) => {
      setCart((prev) => {
        const next = prev.filter((c) => c.foodId !== foodId);
        persistCart(next, appliedCouponCode);
        return next;
      });
    },
    [appliedCouponCode, persistCart]
  );

  const clearCart = useCallback(async () => {
    setCart([]);
    setAppliedCouponCodeState('');
    await persistCart([], '');
  }, [persistCart]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const cartDeliveryCharge = useMemo(() => {
    if (cart.length === 0) return 0;
    return cartSubtotal >= 149 ? 0 : 15;
  }, [cart.length, cartSubtotal]);

  const cartDiscount = useMemo(() => {
    if (!appliedCouponCode || cartSubtotal <= 0) return 0;
    const found = coupons.find(
      (c) => c.couponCode.toUpperCase() === appliedCouponCode.toUpperCase() && c.isActive
    );
    if (!found) return 0;
    if (found.minOrderAmount && cartSubtotal < found.minOrderAmount) return 0;
    if (found.firstOrderOnly && orders.length > 0) return 0;
    if (found.discountType === 'flat') {
      return Math.min(cartSubtotal, found.discountValue);
    }
    const raw = Math.round((cartSubtotal * found.discountValue) / 100);
    return found.maxDiscount ? Math.min(raw, found.maxDiscount) : raw;
  }, [appliedCouponCode, cartSubtotal, coupons, orders.length]);

  const cartTotal = useMemo(
    () => Math.max(0, cartSubtotal + cartDeliveryCharge - cartDiscount),
    [cartSubtotal, cartDeliveryCharge, cartDiscount]
  );

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const loginWithGoogle = useCallback(async () => {
    try {
      const signedInUser = await signInWithGoogle();
      showToast(`Welcome, ${signedInUser.displayName || 'Student'}!`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In cancelled.';
      showToast(msg, 'error');
    }
  }, [showToast]);

  const logout = useCallback(async () => {
    await signOutUser();
    setIsAdminMode(false);
    setActiveView('home');
    showToast('Signed out from CampusBite.', 'info');
  }, [showToast]);

  const toggleFavorite = useCallback(
    async (foodId: string) => {
      if (!user || !profile) {
        showToast('Sign in to save favourite meals.', 'info');
        return;
      }
      const exists = profile.favorites.includes(foodId);
      const nextFavs = exists
        ? profile.favorites.filter((id) => id !== foodId)
        : [...profile.favorites, foodId].slice(0, 100);
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          favorites: nextFavs,
          updatedAt: serverTimestamp(),
        });
        showToast(exists ? 'Removed from favourites.' : 'Saved to favourites.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    },
    [profile, showToast, user]
  );

  const updateUserProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) return;
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          ...(updates.name !== undefined ? { name: updates.name.slice(0, 100) } : {}),
          ...(updates.phone !== undefined ? { phone: updates.phone.slice(0, 20) } : {}),
          ...(updates.collegeName !== undefined ? { collegeName: updates.collegeName.slice(0, 140) } : {}),
          ...(updates.hostelName !== undefined ? { hostelName: updates.hostelName.slice(0, 140) } : {}),
          ...(updates.roomNumber !== undefined ? { roomNumber: updates.roomNumber.slice(0, 40) } : {}),
          updatedAt: serverTimestamp(),
        });
        showToast('Profile details saved.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    },
    [showToast, user]
  );

  const addSavedAddress = useCallback(
    async (addr: Omit<SavedAddress, 'id'>) => {
      if (!user || !profile) return;
      const next: SavedAddress[] = [
        ...profile.addresses,
        { ...addr, id: `addr_${Date.now()}` },
      ].slice(0, 10);
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          addresses: next,
          updatedAt: serverTimestamp(),
        });
        showToast('Delivery address saved.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    },
    [profile, showToast, user]
  );

  const removeSavedAddress = useCallback(
    async (id: string) => {
      if (!user || !profile) return;
      const next = profile.addresses.filter((a) => a.id !== id);
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          addresses: next,
          updatedAt: serverTimestamp(),
        });
        showToast('Address removed.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    },
    [profile, showToast, user]
  );

  const placeOrder = useCallback(
    async (params: {
      customerName: string;
      customerPhone: string;
      deliveryAddress: DeliveryAddressPayload;
      instructions: string;
      paymentMethod: PaymentMethod;
      paymentStatus: PaymentStatus;
      paymentReference?: string;
    }): Promise<Order | null> => {
      if (!user) {
        showToast('Please sign in to place an order.', 'error');
        return null;
      }
      if (cart.length === 0) {
        showToast('Your cart is empty.', 'error');
        return null;
      }

      const orderId = `ORD-${Date.now()}`;
      const orderPayload: Record<string, unknown> = {
        orderId,
        userId: user.uid,
        customerName: params.customerName.trim().slice(0, 100),
        customerPhone: params.customerPhone.trim().slice(0, 20),
        items: cart.map((c) => ({
          foodId: c.foodId,
          name: c.name,
          price: c.price,
          quantity: c.quantity,
          image: c.image,
          isVeg: c.isVeg,
        })),
        subtotal: cartSubtotal,
        deliveryCharge: cartDeliveryCharge,
        discount: cartDiscount,
        ...(appliedCouponCode ? { couponCode: appliedCouponCode } : {}),
        totalAmount: cartTotal,
        paymentMethod: params.paymentMethod,
        paymentStatus: params.paymentStatus,
        ...(params.paymentReference ? { paymentReference: params.paymentReference.slice(0, 128) } : {}),
        orderStatus: 'placed',
        deliveryAddress: params.deliveryAddress,
        instructions: params.instructions.trim().slice(0, 300),
        estimatedDeliveryTime: '25-35 mins',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(db, 'orders', orderId), orderPayload);
        await clearCart();
        showToast(`Order ${orderId} placed!`, 'success');
        return orderPayload as unknown as Order;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
      }
    },
    [
      appliedCouponCode,
      cart,
      cartDeliveryCharge,
      cartDiscount,
      cartSubtotal,
      cartTotal,
      clearCart,
      showToast,
      user,
    ]
  );

  const cancelCustomerOrder = useCallback(
    async (orderId: string) => {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          orderStatus: 'cancelled',
          updatedAt: serverTimestamp(),
        });
        showToast('Order cancelled.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
      }
    },
    [showToast]
  );

  const createSubscription = useCallback(
    async (params: {
      planType: PlanType;
      cadence: 'weekly' | 'monthly';
      mealSlot: 'lunch' | 'dinner' | 'both';
      price: number;
      totalMeals: number;
      startDate: string;
      preferredMeals: string[];
      dietaryPreference: 'Pure Veg' | 'Veg + Egg';
      deliveryAddress: string;
    }) => {
      if (!user) {
        showToast('Please sign in to activate a meal plan.', 'error');
        return;
      }
      const start = new Date(params.startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + (params.cadence === 'weekly' ? 7 : 30));

      const subId = `SUB-${Date.now()}`;
      try {
        await setDoc(doc(db, 'subscriptions', subId), {
          subscriptionId: subId,
          userId: user.uid,
          customerName: (profile?.name || user.displayName || 'Student').slice(0, 100),
          planType: params.planType,
          cadence: params.cadence,
          mealSlot: params.mealSlot,
          price: params.price,
          startDate: params.startDate.slice(0, 30),
          endDate: end.toISOString().slice(0, 10),
          totalMeals: params.totalMeals,
          remainingMeals: params.totalMeals,
          preferredMeals: params.preferredMeals.slice(0, 20),
          dietaryPreference: params.dietaryPreference,
          deliveryAddress: params.deliveryAddress.slice(0, 240),
          status: 'active',
          paymentStatus: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast(`${params.planType} sample subscription started!`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `subscriptions/${subId}`);
      }
    },
    [profile?.name, showToast, user]
  );

  const updateSubscriptionCustomer = useCallback(
    async (subscriptionId: string, status: 'active' | 'paused' | 'cancelled') => {
      try {
        await updateDoc(doc(db, 'subscriptions', subscriptionId), {
          status,
          updatedAt: serverTimestamp(),
        });
        showToast(`Subscription ${status}.`, 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `subscriptions/${subscriptionId}`);
      }
    },
    [showToast]
  );

  const submitReview = useCallback(
    async (foodId: string, rating: number, comment: string) => {
      if (!user) {
        showToast('Sign in to post a review.', 'info');
        return;
      }
      // Ensure food item exists in Firestore if admin hasn't seeded yet
      const reviewId = `REV-${Date.now()}`;
      try {
        await setDoc(doc(db, 'reviews', reviewId), {
          id: reviewId,
          userId: user.uid,
          userName: (profile?.name || user.displayName || 'Student').slice(0, 80),
          campus: (profile?.collegeName || 'Dehradun Campus').slice(0, 100),
          foodId,
          rating: Math.max(1, Math.min(5, rating)),
          comment: comment.trim().slice(0, 400),
          createdAt: serverTimestamp(),
        });
        showToast('Thank you for reviewing this meal!', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `reviews/${reviewId}`);
      }
    },
    [profile?.collegeName, profile?.name, showToast, user]
  );

  const submitFeedback = useCallback(
    async (category: CustomerFeedback['category'], message: string) => {
      if (!user) {
        showToast('Please sign in to submit feedback.', 'info');
        return;
      }
      const feedbackId = `FB-${Date.now()}`;
      try {
        await setDoc(doc(db, 'feedback', feedbackId), {
          id: feedbackId,
          userId: user.uid,
          userName: (profile?.name || user.displayName || 'Student').slice(0, 80),
          category,
          message: message.trim().slice(0, 500),
          createdAt: serverTimestamp(),
        });
        showToast('Feedback sent to the CampusBite kitchen team.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `feedback/${feedbackId}`);
      }
    },
    [profile?.name, showToast, user]
  );

  // Admin Operations
  const saveFoodItem = useCallback(
    async (item: Omit<FoodItem, 'createdAt' | 'updatedAt'>, isNew: boolean) => {
      try {
        const cleanId = item.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
        const ref = doc(db, 'food_items', cleanId);
        if (isNew) {
          await setDoc(ref, {
            ...item,
            id: cleanId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(ref, {
            ...item,
            id: cleanId,
            updatedAt: serverTimestamp(),
          });
        }
        showToast(`${item.name} saved to menu.`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `food_items/${item.id}`);
      }
    },
    [showToast]
  );

  const deleteFoodItem = useCallback(
    async (foodId: string) => {
      try {
        await deleteDoc(doc(db, 'food_items', foodId));
        showToast('Menu item deleted.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `food_items/${foodId}`);
      }
    },
    [showToast]
  );

  const updateOrderAdmin = useCallback(
    async (
      orderId: string,
      updates: {
        orderStatus?: OrderStatus;
        paymentStatus?: PaymentStatus;
        estimatedDeliveryTime?: string;
      }
    ) => {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        showToast(`Order ${orderId} updated.`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
      }
    },
    [showToast]
  );

  const updateSubscriptionAdmin = useCallback(
    async (
      subscriptionId: string,
      updates: {
        status?: Subscription['status'];
        remainingMeals?: number;
        paymentStatus?: Subscription['paymentStatus'];
      }
    ) => {
      try {
        await updateDoc(doc(db, 'subscriptions', subscriptionId), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        showToast('Subscription updated.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `subscriptions/${subscriptionId}`);
      }
    },
    [showToast]
  );

  const saveCoupon = useCallback(
    async (coupon: Coupon) => {
      const code = coupon.couponCode.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      try {
        await setDoc(doc(db, 'coupons', code), {
          ...coupon,
          couponCode: code,
        });
        showToast(`Coupon ${code} saved.`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `coupons/${code}`);
      }
    },
    [showToast]
  );

  const deleteCoupon = useCallback(
    async (couponCode: string) => {
      try {
        await deleteDoc(doc(db, 'coupons', couponCode));
        showToast(`Coupon ${couponCode} removed.`, 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `coupons/${couponCode}`);
      }
    },
    [showToast]
  );

  const saveBanner = useCallback(
    async (banner: PromoBanner) => {
      try {
        await setDoc(doc(db, 'banners', banner.id), banner);
        showToast('Promotional banner saved.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `banners/${banner.id}`);
      }
    },
    [showToast]
  );

  const deleteBanner = useCallback(
    async (bannerId: string) => {
      try {
        await deleteDoc(doc(db, 'banners', bannerId));
        showToast('Banner deleted.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `banners/${bannerId}`);
      }
    },
    [showToast]
  );

  const grantAdminRole = useCallback(
    async (uid: string, email: string) => {
      try {
        await setDoc(doc(db, 'admins', uid), {
          uid,
          email,
          grantedAt: new Date().toISOString(),
        });
        await updateDoc(doc(db, 'users', uid), {
          role: 'admin',
          updatedAt: serverTimestamp(),
        });
        showToast(`Admin access granted to ${email}.`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `admins/${uid}`);
      }
    },
    [showToast]
  );

  const value: CampusBiteContextValue = {
    user,
    profile,
    authReady,
    isAdmin,
    isCatalogFromFirestore: firestoreFoodItems.length > 0,
    selectedLocation,
    setSelectedLocation,
    activeView,
    setActiveView,
    isAdminMode,
    setIsAdminMode,
    isCartOpen,
    setIsCartOpen,
    isAiOpen,
    setIsAiOpen,
    selectedFood,
    setSelectedFood,
    foodItems,
    coupons,
    banners,
    reviews,
    orders,
    allOrders,
    subscriptions,
    allSubscriptions,
    allUsers,
    allFeedback,
    cart,
    appliedCouponCode,
    setAppliedCouponCode,
    cartSubtotal,
    cartDeliveryCharge,
    cartDiscount,
    cartTotal,
    cartItemCount,
    loadingData,
    loginWithGoogle,
    logout,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    toggleFavorite,
    updateUserProfile,
    addSavedAddress,
    removeSavedAddress,
    placeOrder,
    cancelCustomerOrder,
    createSubscription,
    updateSubscriptionCustomer,
    submitReview,
    submitFeedback,
    seedCatalogToFirestore,
    saveFoodItem,
    deleteFoodItem,
    updateOrderAdmin,
    updateSubscriptionAdmin,
    saveCoupon,
    deleteCoupon,
    saveBanner,
    deleteBanner,
    grantAdminRole,
    showToast,
  };

  return (
    <CampusBiteContext.Provider value={value}>
      {children}
      <ToastStack
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </CampusBiteContext.Provider>
  );
}

export function useCampusBite() {
  const ctx = useContext(CampusBiteContext);
  if (!ctx) {
    throw new Error('useCampusBite must be used within CampusBiteProvider');
  }
  return ctx;
}

export type FoodCategory =
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Snacks'
  | 'Beverages'
  | 'Thalis'
  | 'Homemade Meals';

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

export type PaymentMethod = 'COD' | 'UPI' | 'RAZORPAY';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface SavedAddress {
  id: string;
  label: string;
  collegeName: string;
  hostelName: string;
  roomNumber: string;
  streetAddress: string;
  landmark?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'admin';
  collegeName?: string;
  hostelName?: string;
  roomNumber?: string;
  addresses: SavedAddress[];
  favorites: string[];
  referralCode?: string;
  walletBalance?: number;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  category: FoodCategory;
  price: number;
  image: string;
  availability: boolean;
  preparationTime: number;
  rating: number;
  reviewCount?: number;
  isVeg: boolean;
  isPopular?: boolean;
  isTodaysSpecial?: boolean;
  isBestseller?: boolean;
  ingredients?: string[];
  calories?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CartItem {
  foodId: string;
  name: string;
  price: number;
  image: string;
  isVeg: boolean;
  quantity: number;
}

export interface OrderItem {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  isVeg?: boolean;
}

export interface DeliveryAddressPayload {
  collegeName: string;
  hostelName: string;
  roomNumber: string;
  streetAddress: string;
  campusZone: string;
}

export interface Order {
  orderId: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  couponCode?: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  orderStatus: OrderStatus;
  deliveryAddress: DeliveryAddressPayload;
  instructions?: string;
  estimatedDeliveryTime?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export type PlanType =
  | 'Weekly Lunch'
  | 'Weekly Dinner'
  | 'Weekly Lunch + Dinner'
  | 'Monthly Lunch'
  | 'Monthly Dinner'
  | 'Monthly Lunch + Dinner';

export interface Subscription {
  subscriptionId: string;
  userId: string;
  customerName: string;
  planType: PlanType;
  cadence: 'weekly' | 'monthly';
  mealSlot: 'lunch' | 'dinner' | 'both';
  price: number;
  startDate: string;
  endDate: string;
  totalMeals: number;
  remainingMeals: number;
  preferredMeals?: string[];
  dietaryPreference?: 'Pure Veg' | 'Veg + Egg';
  deliveryAddress?: string;
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid';
  createdAt: unknown;
  updatedAt: unknown;
}

export interface Coupon {
  couponCode: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  description?: string;
  expiryDate: string;
  isActive: boolean;
  firstOrderOnly?: boolean;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  couponCode?: string;
  ctaLabel?: string;
  isActive: boolean;
}

export interface FoodReview {
  id: string;
  userId: string;
  userName: string;
  campus?: string;
  foodId: string;
  rating: number;
  comment: string;
  createdAt: unknown;
}

export interface CustomerFeedback {
  id: string;
  userId: string;
  userName: string;
  category: 'Food Quality' | 'Delivery' | 'Pricing' | 'App Experience' | 'Other';
  message: string;
  createdAt: unknown;
}

export type CustomerView =
  | 'home'
  | 'menu'
  | 'subscriptions'
  | 'orders'
  | 'profile'
  | 'checkout'
  | 'about';

export type AdminTab =
  | 'dashboard'
  | 'food'
  | 'orders'
  | 'customers'
  | 'subscriptions'
  | 'offers'
  | 'analytics'
  | 'settings';

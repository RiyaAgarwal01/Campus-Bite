import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChefHat,
  Clock,
  MapPin,
  Package,
  RotateCcw,
  Truck,
  XCircle,
} from 'lucide-react';
import { useCampusBite } from '../context/CampusBiteContext';
import { formatFirestoreDate } from '../lib/firebase';
import type { Order, OrderStatus } from '../types';

const TRACKING_STAGES: { key: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { key: 'placed', label: 'Order Placed', icon: <Package className="w-4 h-4" /> },
  { key: 'accepted', label: 'Order Accepted', icon: <CheckCircle2 className="w-4 h-4" /> },
  { key: 'preparing', label: 'Food Preparation', icon: <ChefHat className="w-4 h-4" /> },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: <Truck className="w-4 h-4" /> },
  { key: 'delivered', label: 'Delivered', icon: <CheckCircle2 className="w-4 h-4" /> },
];

export function OrdersView({
  initialOrderId,
}: {
  initialOrderId?: string | null;
}) {
  const {
    user,
    loginWithGoogle,
    orders,
    cancelCustomerOrder,
    foodItems,
    addToCart,
    setActiveView,
    setIsCartOpen,
  } = useCampusBite();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId || null);

  useEffect(() => {
    if (initialOrderId) {
      setSelectedOrderId(initialOrderId);
    } else if (!selectedOrderId && orders.length > 0) {
      setSelectedOrderId(orders[0].orderId);
    }
  }, [initialOrderId, orders, selectedOrderId]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-[#18181B] mb-2">
          Track Your Hostel Orders
        </h1>
        <p className="text-sm text-stone-500 mb-6">
          Sign in with Google to view real-time kitchen prep updates and past orders.
        </p>
        <button
          onClick={loginWithGoogle}
          className="px-6 py-3 rounded-xl bg-[#EA580C] text-white text-sm font-semibold hover:bg-[#C2410C] cursor-pointer"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  const activeOrder: Order | undefined =
    orders.find((o) => o.orderId === selectedOrderId) || orders[0];

  const getStageIndex = (status: OrderStatus) => {
    return TRACKING_STAGES.findIndex((s) => s.key === status);
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((oi) => {
      const found = foodItems.find((f) => f.id === oi.foodId);
      if (found) addToCart(found, oi.quantity);
    });
    setIsCartOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#18181B]">
            My Orders &amp; Live Tracking
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Real-time kitchen &amp; hostel delivery updates powered by Firestore.
          </p>
        </div>
        <button
          onClick={() => setActiveView('menu')}
          className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-800 hover:border-[#EA580C] self-start cursor-pointer"
        >
          Order Another Meal
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <Package className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h2 className="font-display text-lg font-semibold text-stone-900 mb-1">
            No orders placed yet
          </h2>
          <p className="text-sm text-stone-500 mb-6">
            Your placed orders and live 5-step hostel tracking will appear here.
          </p>
          <button
            onClick={() => setActiveView('menu')}
            className="px-5 py-2.5 rounded-xl bg-[#EA580C] text-white text-xs font-semibold cursor-pointer"
          >
            Browse Today&apos;s Menu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          {/* Active Tracked Order Panel */}
          {activeOrder && (
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-stone-100">
                  <div>
                    <div className="font-mono text-xs text-stone-500">
                      Order ID: {activeOrder.orderId}
                    </div>
                    <h2 className="font-display text-xl font-bold text-[#18181B] mt-0.5">
                      {activeOrder.orderStatus === 'cancelled'
                        ? 'Order Cancelled'
                        : activeOrder.orderStatus === 'rejected'
                        ? 'Order Rejected by Kitchen'
                        : activeOrder.orderStatus === 'delivered'
                        ? 'Meal Delivered'
                        : 'Live Order Progress'}
                    </h2>
                  </div>

                  <div className="text-right">
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600">
                      <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
                      <span>ETA: {activeOrder.estimatedDeliveryTime || '25-35 mins'}</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      Placed {formatFirestoreDate(activeOrder.createdAt)}
                    </div>
                  </div>
                </div>

                {/* 5-Stage Visual Stepper */}
                {activeOrder.orderStatus === 'cancelled' || activeOrder.orderStatus === 'rejected' ? (
                  <div className="my-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-sm text-red-800">
                    <XCircle className="w-5 h-5 shrink-0" />
                    <span>
                      This order was {activeOrder.orderStatus}. Any prepaid amount is automatically marked for refund.
                    </span>
                  </div>
                ) : (
                  <div className="my-6 space-y-4">
                    {TRACKING_STAGES.map((stage, idx) => {
                      const currentIdx = getStageIndex(activeOrder.orderStatus);
                      const completed = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <div key={stage.key} className="flex items-center gap-4">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                              completed
                                ? 'bg-[#EA580C] border-[#EA580C] text-white'
                                : 'bg-stone-50 border-stone-200 text-stone-400'
                            }`}
                          >
                            {stage.icon}
                          </div>
                          <div className="flex-1 flex items-center justify-between border-b border-stone-100 pb-3">
                            <div>
                              <div
                                className={`text-sm font-semibold ${
                                  completed ? 'text-[#18181B]' : 'text-stone-400'
                                }`}
                              >
                                {idx + 1}. {stage.label}
                              </div>
                              {isCurrent && (
                                <div className="text-xs text-[#EA580C] font-medium">
                                  Current Stage
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-stone-400">
                              {completed ? 'Done' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Cancellation Rule Enforcement */}
                {(activeOrder.orderStatus === 'placed' ||
                  activeOrder.orderStatus === 'accepted') && (
                  <div className="mb-5 p-3.5 rounded-xl bg-[#FAF7F2] border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-stone-600">
                      Cancellation is allowed before kitchen preparation starts.
                    </span>
                    <button
                      onClick={() => cancelCustomerOrder(activeOrder.orderId)}
                      className="px-3.5 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}

                {/* Delivery Address & Payment Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100 text-xs">
                  <div>
                    <div className="font-semibold text-stone-700 flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-[#EA580C]" />
                      Delivery Destination
                    </div>
                    <p className="text-stone-600 leading-relaxed">
                      {activeOrder.deliveryAddress.collegeName}
                      <br />
                      {activeOrder.deliveryAddress.hostelName}, Room{' '}
                      {activeOrder.deliveryAddress.roomNumber}
                      <br />
                      {activeOrder.deliveryAddress.streetAddress}
                    </p>
                  </div>

                  <div>
                    <div className="font-semibold text-stone-700 mb-1">Payment Details</div>
                    <p className="text-stone-600">
                      Method: <span className="font-mono font-medium">{activeOrder.paymentMethod}</span>
                      <br />
                      Status:{' '}
                      <span className="font-semibold capitalize">{activeOrder.paymentStatus}</span>
                      <br />
                      Total Paid/Due:{' '}
                      <span className="font-mono font-bold text-[#18181B] tabular-nums">
                        ₹{activeOrder.totalAmount}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Ordered Items */}
                <div className="mt-5 pt-4 border-t border-stone-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-stone-700">Ordered Items</h3>
                    <button
                      onClick={() => handleReorder(activeOrder)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reorder Items
                    </button>
                  </div>
                  <div className="space-y-2">
                    {activeOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm text-stone-700">
                        <span>
                          {item.quantity} × {item.name}
                        </span>
                        <span className="font-mono tabular-nums">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order History List */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <h2 className="font-display text-base font-semibold text-[#18181B] mb-4">
                Order History ({orders.length})
              </h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {orders.map((order) => {
                  const selected = activeOrder?.orderId === order.orderId;
                  return (
                    <button
                      key={order.orderId}
                      onClick={() => setSelectedOrderId(order.orderId)}
                      className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#EA580C] bg-orange-50/40'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-xs font-semibold text-[#18181B]">
                          {order.orderId}
                        </span>
                        <span className="text-xs font-semibold capitalize text-[#EA580C]">
                          {order.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-stone-600 line-clamp-1 mb-2">
                        {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                      </div>
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span>{formatFirestoreDate(order.createdAt)}</span>
                        <span className="font-mono font-bold text-[#18181B] tabular-nums">
                          ₹{order.totalAmount}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

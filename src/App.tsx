import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import { CampusBiteProvider, useCampusBite } from './context/CampusBiteContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { MenuView } from './components/MenuView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { OrdersView } from './components/OrdersView';
import { ProfileView } from './components/ProfileView';
import { CheckoutView } from './components/CheckoutView';
import { AboutContactView } from './components/AboutContactView';
import { FoodDetailModal } from './components/FoodDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { AdminDashboard } from './components/AdminDashboard';
import type { FoodCategory } from './types';

function CampusBiteShell() {
  const { activeView, setActiveView, isAdminMode, setIsAiOpen } = useCampusBite();
  const [menuCategory, setMenuCategory] = useState<'All' | FoodCategory>('All');
  const [menuSearch, setMenuSearch] = useState('');
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);

  if (isAdminMode) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#18181B] flex flex-col">
      <Navbar />

      <main className="flex-1">
        {activeView === 'home' && (
          <HomeView
            onSelectCategory={(cat) => {
              setMenuCategory(cat);
              setMenuSearch('');
              setActiveView('menu');
            }}
            onSearchToMenu={(query) => {
              setMenuCategory('All');
              setMenuSearch(query);
              setActiveView('menu');
            }}
          />
        )}

        {activeView === 'menu' && (
          <MenuView
            key={`${menuCategory}_${menuSearch}`}
            initialCategory={menuCategory}
            initialSearch={menuSearch}
          />
        )}

        {activeView === 'subscriptions' && <SubscriptionsView />}

        {activeView === 'orders' && <OrdersView initialOrderId={trackedOrderId} />}

        {activeView === 'profile' && <ProfileView />}

        {activeView === 'checkout' && (
          <CheckoutView
            onOrderPlaced={(orderId) => {
              setTrackedOrderId(orderId);
              setActiveView('orders');
            }}
          />
        )}

        {activeView === 'about' && <AboutContactView />}
      </main>

      {/* Floating AI Meal Guide Button */}
      <button
        onClick={() => setIsAiOpen(true)}
        aria-label="Open CampusBite AI Meal Guide"
        className="fixed bottom-18 md:bottom-6 left-4 sm:left-6 z-30 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#18181B] text-white text-xs font-semibold shadow-lg hover:bg-[#EA580C] transition-colors cursor-pointer"
      >
        <Bot className="w-4 h-4 text-[#F97316]" />
        <span>Meal Guide</span>
      </button>

      <FoodDetailModal />
      <CartDrawer />
      <AiAssistantDrawer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CampusBiteProvider>
        <CampusBiteShell />
      </CampusBiteProvider>
    </ErrorBoundary>
  );
}

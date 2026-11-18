import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Utensils } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icon =
          toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-[#EA580C] shrink-0" />
          );

        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-center justify-between gap-3 bg-white/95 backdrop-blur-md border border-stone-200 shadow-lg rounded-xl px-4 py-3 text-sm text-stone-800"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {icon}
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function VegIndicator({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      title={isVeg ? 'Vegetarian' : 'Contains Egg / Non-Veg'}
      aria-label={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
      className={`inline-flex items-center justify-center w-4 h-4 rounded-[3px] border shrink-0 ${
        isVeg ? 'border-emerald-700' : 'border-amber-800'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isVeg ? 'bg-emerald-700' : 'bg-amber-800'
        }`}
      />
    </span>
  );
}

export function FoodImage({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`bg-gradient-to-br from-orange-50 via-stone-100 to-amber-50 flex flex-col items-center justify-center p-4 text-center ${className}`}
      >
        <Utensils className="w-7 h-7 text-[#EA580C]/70 mb-2" />
        <span className="text-xs font-medium text-stone-600 line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

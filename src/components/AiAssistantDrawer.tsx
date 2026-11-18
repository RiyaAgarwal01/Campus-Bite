import React, { useState } from 'react';
import { Bot, Plus, Send, X } from 'lucide-react';
import { useCampusBite } from '../context/CampusBiteContext';
import { FoodImage } from './Toast';

interface AiChatMessage {
  role: 'user' | 'assistant';
  text: string;
  recommendedIds?: string[];
  comboSummary?: string;
  estimatedTotal?: number;
}

const QUICK_PROMPTS = [
  'Suggest a filling lunch under ₹100.',
  'Best pure veg dinner combo under ₹150?',
  'Quick breakfast and chai under ₹70.',
  'Late night study snack with cold coffee.',
];

export function AiAssistantDrawer() {
  const { isAiOpen, setIsAiOpen, foodItems, addToCart } = useCampusBite();
  const [input, setInput] = useState('');
  const [budget, setBudget] = useState<string>('100');
  const [dietary, setDietary] = useState<'any' | 'veg'>('veg');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: 'assistant',
      text: 'Hi! I am the CampusBite Meal Guide. Tell me your budget, meal time, or craving and I will suggest real available dishes from our Dehradun kitchen.',
    },
  ]);

  if (!isAiOpen) return null;

  const askAssistant = async (promptText: string) => {
    const clean = promptText.trim();
    if (!clean || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: clean }]);
    setInput('');
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: clean,
          budget: budget ? Number(budget) : null,
          dietaryPreference: dietary === 'veg' ? 'Pure Vegetarian only' : 'Any (Veg or Egg)',
          menuItems: foodItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not reach meal assistant.');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply,
          recommendedIds: data.recommendedFoodIds || [],
          comboSummary: data.comboSummary,
          estimatedTotal: data.estimatedTotal,
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to fetch AI recommendation.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/50 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={() => setIsAiOpen(false)} aria-hidden="true" />

      <aside
        className="relative z-10 w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-stone-200"
        aria-label="CampusBite Meal Guide"
      >
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-[#18181B]">
                CampusBite Meal Guide
              </h2>
              <p className="text-[11px] text-stone-500">
                Grounded on live menu &amp; ₹ prices
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAiOpen(false)}
            aria-label="Close AI assistant"
            className="w-9 h-9 rounded-xl border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Budget & Diet Controls */}
        <div className="px-5 py-3 bg-[#FAF7F2] border-b border-stone-200 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-stone-500">Max ₹:</span>
            <input
              type="number"
              min={40}
              max={500}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-16 px-2 py-1 rounded-lg border border-stone-200 bg-white font-mono text-xs tabular-nums"
            />
          </div>
          <div className="flex items-center gap-1 bg-stone-200/60 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setDietary('veg')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                dietary === 'veg' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
              }`}
            >
              Pure Veg
            </button>
            <button
              onClick={() => setDietary('any')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                dietary === 'any' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
              }`}
            >
              Veg + Egg
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                onClick={() => askAssistant(q)}
                className="text-left text-[11px] px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-orange-50 hover:text-[#EA580C] text-stone-700 transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {messages.map((msg, i) => {
            const matchedFoods = (msg.recommendedIds || [])
              .map((id) => foodItems.find((f) => f.id === id))
              .filter((f): f is NonNullable<typeof f> => Boolean(f));

            return (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#18181B] text-white'
                      : 'bg-[#FAF7F2] border border-stone-200 text-stone-800'
                  }`}
                >
                  {msg.text}
                </div>

                {matchedFoods.length > 0 && (
                  <div className="w-full mt-2.5 space-y-2">
                    {matchedFoods.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-stone-200"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FoodImage
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-10 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-stone-900 truncate">
                              {item.name}
                            </div>
                            <div className="font-mono text-xs text-[#EA580C] tabular-nums">
                              ₹{item.price}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(item, 1)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EA580C] text-white text-xs font-semibold hover:bg-[#C2410C] shrink-0 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                    ))}
                    {msg.estimatedTotal && msg.estimatedTotal > 0 ? (
                      <div className="text-[11px] font-mono text-stone-500 text-right tabular-nums">
                        Suggested Combo Total: ₹{msg.estimatedTotal}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="bg-[#FAF7F2] border border-stone-200 rounded-2xl px-4 py-3 text-xs text-stone-500">
              Checking live kitchen menu and calculating budget matches...
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
              {errorMsg}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            askAssistant(input);
          }}
          className="p-4 border-t border-stone-200 flex gap-2 bg-white"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Suggest a lunch under ₹100"
            className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-[#EA580C]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="px-4 py-2.5 rounded-xl bg-[#EA580C] text-white hover:bg-[#C2410C] disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </aside>
    </div>
  );
}

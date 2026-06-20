"use client";

import { useState, useEffect, useRef } from "react";
import { Send, ShoppingBasket, ImageIcon } from "lucide-react";

function AutoAwesomeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
      <path fill="white" d="m19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25zm0 6l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25zm-7.5-5.5L9 4L6.5 9.5L1 12l5.5 2.5L9 20l2.5-5.5L17 12zm-1.51 3.49L9 15.17l-.99-2.18L5.83 12l2.18-.99L9 8.83l.99 2.18l2.18.99z" />
    </svg>
  );
}

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  text: string;
}


const SUGGESTIONS = [
  "High protein meals under 500 calories",
  "Vegetarian dinner ideas",
  "Quick 15-minute breakfast",
  "Keto-friendly lunch options",
  "Gluten-free dinner recipes",
  "Vegan meal prep ideas",
];

const GREETING: ChatMessage = {
  id: "init",
  role: "bot",
  text: "Hello! I'm your AI recipe recommendation assistant. Tell me what you're in the mood for, choose your dietary preferences, or upload a photo using one of the buttons below.",
};

function mockReply(prompt: string, filters: Set<string> = new Set()): string {
  const filterList = [...filters]
  if (filterList.length > 0 && !prompt.trim()) {
    return `Got it! I'll prioritize recipes that are ${filterList.join(", ")} friendly:\n\n• Zucchini Noodles with Pesto (15 min, 310 cal)\n• Stuffed Bell Peppers (40 min, 420 cal)\n• Roasted Veggie Grain Bowl (30 min, 390 cal)\n\nShould I generate more options?`
  }
  const lower = prompt.toLowerCase();
  if (lower.includes("quick") || lower.includes("15") || lower.includes("fast") || lower.includes("minute")) {
    return "Great choice! Here are 3 quick recipes under 20 minutes:\n\n• Avocado Toast with Egg (10 min, 320 cal)\n• Greek Yogurt Parfait (5 min, 280 cal)\n• Stir-Fry Veggies with Rice (15 min, 390 cal)\n\nWould you like full ingredients and steps for any of these?";
  }
  if (lower.includes("protein") || lower.includes("muscle") || lower.includes("chicken") || lower.includes("keto")) {
    return "Here are some high-protein options perfect for your goals:\n\n• Grilled Salmon with Broccoli (25 min, 480 cal, 42g protein)\n• Chicken & Quinoa Bowl (30 min, 520 cal, 48g protein)\n• Turkey Meatballs (35 min, 440 cal, 38g protein)\n\nShall I detail any of these?";
  }
  if (lower.includes("vegan") || lower.includes("vegetarian") || lower.includes("plant")) {
    return "Lovely plant-based picks coming up:\n\n• Quinoa Buddha Bowl (25 min, 420 cal)\n• Lentil Soup (40 min, 350 cal)\n• Chickpea Curry (30 min, 460 cal)\n\nAll are nutrient-rich and satisfying. Want the full recipe for any?";
  }
  if (lower.includes("breakfast")) {
    return "Here are some energizing breakfast ideas:\n\n• Overnight Oats with Berries (5 min prep, 340 cal)\n• Spinach Omelette (10 min, 290 cal)\n• Banana Pancakes (15 min, 380 cal)\n\nWant the full recipe for any of these?";
  }
  if (lower.includes("dinner") || lower.includes("pasta") || lower.includes("italian")) {
    return "Here are some hearty dinner options:\n\n• Classic Spaghetti Bolognese (45 min, 620 cal)\n• Baked Salmon with Asparagus (25 min, 510 cal)\n• Mushroom Risotto (35 min, 490 cal)\n\nWhich one catches your eye?";
  }
  return `Based on your request, here are some ideas:\n\n• Garlic Butter Chicken Bowl (30 min, 520 cal)\n• One-pan Veggie Stir-fry (20 min, 380 cal)\n• Tomato Herb Rice (25 min, 410 cal)\n\nTell me your preferred meal type or cooking time for more tailored suggestions.`;
}

function mockIngredientsReply(filename: string): string {
  const lower = filename.toLowerCase();
  const detected: string[] = [];
  if (lower.includes("egg")) detected.push("Egg");
  if (lower.includes("tomato")) detected.push("Tomato");
  if (lower.includes("chicken")) detected.push("Chicken");
  if (lower.includes("rice")) detected.push("Rice");
  if (lower.includes("milk") || lower.includes("cheese")) detected.push("Dairy");
  if (lower.includes("onion")) detected.push("Onion");
  if (lower.includes("carrot")) detected.push("Carrot");
  if (detected.length === 0) detected.push("Tomato", "Onion", "Garlic");
  return `Awesome! I detected ${detected.length} ingredient${detected.length > 1 ? "s" : ""} from your photo: ${detected.join(", ")}.\n\nHere are some recipe ideas:\n\n• Tomato Basil Soup (20 min, 280 cal)\n• Shakshuka (25 min, 350 cal)\n• Roasted Veggie Pasta (30 min, 420 cal)\n\nWant quick recipes or full meal prep ideas?`;
}

function mockDishPhotoReply(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes("pizza")) return "This looks like pizza! Recommended recipes: Margherita Pizza, Mushroom Pizza, and Spicy Pepperoni Pizza. Want the easiest one first?";
  if (lower.includes("salad")) return "This dish looks like a fresh salad. You can try Greek Salad, Chicken Caesar Salad, or Quinoa Avocado Salad.";
  if (lower.includes("pasta") || lower.includes("spaghetti")) return "This looks like a pasta dish. Recipe ideas: Creamy Mushroom Pasta, Aglio e Olio, and Tomato Basil Spaghetti.";
  if (lower.includes("chicken")) return "Looks like a chicken dish! Try: Grilled Lemon Chicken, Chicken Stir-fry, or Butter Chicken Curry.";
  return "Dish recognized. Suggested matching recipes:\n\n• Garlic Butter Chicken Bowl\n• One-pan Veggie Stir-fry\n• Tomato Herb Rice with Protein\n\nIf you want, I can narrow these by calories or cooking time.";
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[75%] px-3 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-line" style={{ backgroundColor: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0" }}>
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 mb-3">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#059669" }}>
        <AutoAwesomeIcon size={15} />
      </div>
      <div className="max-w-[80%] px-3 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-line" style={{ backgroundColor: "var(--tm-surface)", color: "var(--tm-text-2)", border: "1px solid #D1D5DB" }}>
        {message.text}
      </div>
    </div>
  );
}

export default function RecsPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [profileFilters, setProfileFilters] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);
  const ingredientsInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const hasUserMessage = messages.some(m => m.role === "user");

  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem("fh_profile") ?? "{}")
      const filters: string[] = []
      if (profile.primaryGoal) filters.push(profile.primaryGoal)
      if (Array.isArray(profile.dietaryRestrictions)) filters.push(...profile.dietaryRestrictions)
      setProfileFilters(filters)
    } catch {}
  }, []);

  function toggleFilter(f: string) {
    setSelectedFilters(prev => {
      const next = new Set(prev)
      next.has(f) ? next.delete(f) : next.add(f)
      return next
    })
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setInput("");
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);
    await new Promise(r => setTimeout(r, 900));
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "bot", text: mockReply(trimmed, selectedFilters) }]);
    setSending(false);
  }

  async function handleFileUpload(file: File, type: "ingredients" | "dish") {
    const userText = type === "ingredients"
      ? `Ingredients photo: ${file.name}`
      : `Dish photo: ${file.name}`;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", text: userText };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);
    await new Promise(r => setTimeout(r, 900));
    const reply = type === "ingredients" ? mockIngredientsReply(file.name) : mockDishPhotoReply(file.name);
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "bot", text: reply }]);
    setSending(false);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>, type: "ingredients" | "dish") {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    handleFileUpload(file, type);
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--tm-subtle)" }}>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Header */}
        <div className="flex items-start gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#059669" }}>
            <AutoAwesomeIcon size={17} />
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: "var(--tm-text)" }}>AI Recipe Recommendations</p>
            <p className="text-[10.5px]" style={{ color: "#6B7280" }}>Powered by Large Language Model</p>
          </div>
        </div>

        {/* Profile nutrition filters */}
        {profileFilters.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {profileFilters.map(f => {
              const active = selectedFilters.has(f)
              return (
                <button
                  key={f}
                  onClick={() => toggleFilter(f)}
                  className="text-[10.5px] px-2.5 py-1 rounded-full border transition-colors"
                  style={{
                    backgroundColor: active ? "#D1FAE5" : "var(--tm-subtle)",
                    color: active ? "#065F46" : "var(--tm-text-2)",
                    borderColor: active ? "#059669" : "var(--tm-border-i)",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {f}
                </button>
              )
            })}
          </div>
        )}

        {/* Try asking suggestions */}
        {!hasUserMessage && (
          <div className="mb-5">
            <p className="text-xs mb-2.5" style={{ color: "#059669" }}>Try asking:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)} className="text-left text-xs px-3 py-2.5 rounded-lg border transition-colors" style={{ backgroundColor: 'var(--tm-surface)', color: "#059669", borderColor: 'var(--tm-border)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map(m => <ChatBubble key={m.id} message={m} />)}

        {/* Typing indicator */}
        {sending && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#059669" }}>
              <AutoAwesomeIcon size={15} />
            </div>
            <div className="px-3 py-2.5 rounded-xl" style={{ backgroundColor: "var(--tm-surface)", border: "1px solid #D1D5DB" }}>
              <span className="text-sm" style={{ color: "var(--tm-text-3)" }}>Thinking…</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Bottom input bar */}
      <div className="border-t px-4 py-3 shrink-0" style={{ backgroundColor: 'var(--tm-surface)', borderColor: "var(--tm-border-i)" }}>
        <div className="flex gap-2 mb-2.5">
          <button
            onClick={() => ingredientsInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: "var(--tm-border-i)", color: "var(--tm-text-2)", backgroundColor: "var(--tm-subtle)" }}
          >
            <ShoppingBasket size={15} />
            Ingredients
          </button>
          <button
            onClick={() => photoInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: "var(--tm-border-i)", color: "var(--tm-text-2)", backgroundColor: "var(--tm-subtle)" }}
          >
            <ImageIcon size={15} />
            Dish photo
          </button>
        </div>
        <div className="flex items-center gap-2 h-10 rounded-full border px-3" style={{ borderColor: "var(--tm-border-i)", backgroundColor: "var(--tm-subtle)" }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Ask for recommendations..."
            className="flex-1 bg-transparent text-xs focus:outline-none"
            style={{ color: "var(--tm-text)" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || sending}
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "#059669" }}
          >
            <Send size={12} color="var(--tm-surface)" />
          </button>
        </div>
        <p className="text-center text-[10px] mt-1.5" style={{ color: "var(--tm-text-3)" }}>
          <span style={{ color: "#059669" }}>Ingredients</span> — detect what&apos;s in your fridge ·{" "}
          <span style={{ color: "#A855F7" }}>Dish photo</span> — find recipes for a dish you see
        </p>
      </div>

      {/* Hidden file inputs */}
      <input ref={ingredientsInputRef} type="file" accept="image/*" className="hidden" onChange={e => onFileChange(e, "ingredients")} />
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={e => onFileChange(e, "dish")} />
    </div>
  );
}

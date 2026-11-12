"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const GREETING: Msg = {
  role: "assistant",
  content: "Hi! I'm the Smile Cars assistant. Tell me your dates and I'll show you which cars are free, with prices.",
};
const SUGGESTIONS = ["Cars free this weekend?", "Monthly rental prices", "Documents needed", "Track my booking"];
const STORAGE_KEY = "smilecars-chat";

/** Turns /book... paths and https links in a reply into tappable links. */
function renderText(text: string) {
  const parts = text.split(/(\/(?:book|cars|my-orders|monthly-plans|faq)[^\s)]*|https?:\/\/[^\s)]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("/")) {
      const label = part.startsWith("/book/confirm") ? "Book this car" : part.startsWith("/book") ? "See available cars" : part;
      return (
        <Link key={i} href={part} className="font-semibold text-brand-700 underline">
          {label}
        </Link>
      );
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-brand-700 underline">
          {part.includes("wa.me") ? "WhatsApp us" : part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore the conversation when moving between pages in the same tab.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Msg[];
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from sessionStorage
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      /* storage unavailable */
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const content = text.trim().slice(0, 1500);
    if (!content || busy) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m !== GREETING).slice(-20) }),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string };
      setMessages([...next, { role: "assistant", content: data.reply ?? "Sorry, something went wrong. Please WhatsApp us." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "I couldn't connect. Please check your internet, or call us." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 left-4 z-40 flex h-14 items-center gap-2 rounded-full bg-white pl-2 pr-4 font-semibold text-brand-700 shadow-lg ring-1 ring-line hover:shadow-raised print:hidden"
          aria-label="Open chat assistant"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-brand-600 text-white">
            <MessageCircle className="size-5" aria-hidden />
          </span>
          <span className="hidden sm:inline">Ask us</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Smile Cars chat assistant"
          className="fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col rounded-t-3xl bg-white shadow-2xl sm:inset-x-auto sm:bottom-4 sm:left-4 sm:h-[600px] sm:max-h-[85dvh] sm:w-[380px] sm:rounded-3xl"
        >
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-600 text-white">
              <Bot className="size-5" aria-hidden />
            </span>
            <div className="flex-1">
              <p className="font-bold">Smile Cars Assistant</p>
              <p className="text-xs text-muted">AI assistant · replies in seconds</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="flex size-11 items-center justify-center rounded-full hover:bg-brand-50" aria-label="Close chat">
              <X className="size-5" aria-hidden />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-6 ${
                    m.role === "user" ? "rounded-br-sm bg-brand-600 text-white" : "rounded-bl-sm bg-brand-50 text-ink"
                  }`}
                >
                  {m.role === "assistant" ? renderText(m.content) : m.content}
                </p>
              </div>
            ))}
            {busy && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Checking…
              </p>
            )}
            {messages.length === 1 && !busy && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="min-h-10 rounded-full border border-brand-600 px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-line p-3"
          >
            <label htmlFor="chat-input" className="sr-only">Your message</label>
            <input
              ref={inputRef}
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
              maxLength={1500}
              autoComplete="off"
              className="field flex-1 rounded-full"
            />
            <button type="submit" disabled={busy || !input.trim()} className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white disabled:opacity-50" aria-label="Send">
              <Send className="size-5" aria-hidden />
            </button>
          </form>
          <p className="px-4 pb-3 text-center text-[11px] text-muted">AI answers can be wrong. Prices are confirmed when we call you.</p>
        </div>
      )}
    </>
  );
}

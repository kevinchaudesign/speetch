"use client";

/**
 * <ContactAvatar> — bouton flottant fixed bottom-right (logo Speetch
 * en avatar) qui ouvre un panneau de chat avec l'assistant Speetch.
 *
 * UX :
 *  - Au repos : logo en cercle avec halo cyan/jaune doux, label
 *    « Parler à Speetch » au hover (tooltip)
 *  - Clic : panneau chat glisse depuis le coin avec animation scale
 *    + slide-in. Message de bienvenue préchargé.
 *  - Conversation stateless (état React local, perdu à la fermeture
 *    de l'onglet). Persisté en sessionStorage pour survivre aux
 *    refresh.
 *  - Esc / clic outside / bouton X pour fermer
 *  - Animation pulse doux du halo si jamais ouvert (incite au clic)
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SpeetchLogo } from "../speetch-logo";
import { CONTACT_BOT_WELCOME } from "@/lib/contact-bot";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const STORAGE_KEY = "speetch:contact-bot";
const MAX_INPUT = 2000;

type Message = { role: "user" | "assistant"; content: string };

export function ContactAvatar() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Hydrate depuis sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      /* swallow */
    }
    // Bienvenue par défaut
    setMessages([{ role: "assistant", content: CONTACT_BOT_WELCOME }]);
  }, []);

  // Persiste
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* swallow */
    }
  }, [messages]);

  // Esc pour fermer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Scroll auto
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, pending, open]);

  // Autosize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  // Focus input quand on ouvre
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [open]);

  /* Écoute un event window « speetch:open-chat » pour s'ouvrir depuis
   * n'importe où (CTA « Demander un brief » dans <SkillPanel>, etc.).
   * Si un skillTitle est passé en detail, on ajoute un message
   * assistant contextuel qui amorce la conversation autour de ce
   * skill. Si la conversation est vierge (juste le welcome), on le
   * remplace ; sinon on append pour préserver l'historique. */
  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<{
        skillTitle?: string;
        skillLabel?: string;
      }>).detail;
      setOpen(true);
      if (detail?.skillTitle) {
        const ctx = `Vous regardiez **${detail.skillTitle}** — souhaitez-vous en discuter ? En quelques mots : votre contexte (entreprise, projet, échéance), et je vous oriente vers Kevin pour un rappel ou un créneau visio.`;
        setMessages((prev) => {
          if (
            prev.length === 1 &&
            prev[0].role === "assistant" &&
            prev[0].content === CONTACT_BOT_WELCOME
          ) {
            return [{ role: "assistant", content: ctx }];
          }
          return [...prev, { role: "assistant", content: ctx }];
        });
      }
    }
    window.addEventListener("speetch:open-chat", onOpen);
    return () => window.removeEventListener("speetch:open-chat", onOpen);
  }, []);

  async function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    setError(null);
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setPending(true);
    try {
      // On envoie tout l'historique SAUF le message de bienvenue
      // pré-chargé (le bot le génère lui-même via le system prompt)
      const payload = next.filter(
        (m, i) => !(i === 0 && m.role === "assistant"),
      );
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: json.reply ?? "" },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Liaison rompue.";
      setError(msg);
      setMessages((prev) => prev.slice(0, -1));
      setInput(content);
    } finally {
      setPending(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function reset() {
    if (
      messages.length > 1 &&
      !confirm("Effacer cette conversation et repartir de zéro ?")
    )
      return;
    setMessages([{ role: "assistant", content: CONTACT_BOT_WELCOME }]);
    setError(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  return (
    <>
      {/* Avatar flottant bottom-right */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={
          open ? "Fermer le chat Speetch" : "Parler à Speetch"
        }
        aria-expanded={open}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.6,
          delay: 0.4,
          ease: EASE_OUT_EXPO,
        }}
        className="group fixed bottom-5 right-5 z-[65] flex h-14 w-14 items-center justify-center rounded-full md:bottom-6 md:right-6 md:h-16 md:w-16"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(250, 204, 21, 0.18), rgba(125, 211, 252, 0.12) 60%, transparent 80%)",
          boxShadow:
            "0 0 28px rgba(250, 204, 21, 0.25), 0 8px 24px -8px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(125, 211, 252, 0.35)",
        }}
      >
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(125, 211, 252, 0.45), transparent 60%)",
            filter: "blur(14px)",
            opacity: open ? 0 : 0.6,
            transition: "opacity 500ms ease-out",
          }}
        />
        <SpeetchLogo
          size="md"
          loading="eager"
          className="relative h-10 w-10 transition-transform duration-300 ease-out group-hover:scale-110 md:h-12 md:w-12"
        />
      </motion.button>

      {/* Panneau chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="contact-chat"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="fixed bottom-24 right-5 z-[64] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden border border-cyan-200/25 bg-black/92 backdrop-blur-md md:bottom-28 md:right-6 md:max-w-md"
            style={{
              boxShadow:
                "0 32px 64px -16px rgba(0, 0, 0, 0.75), 0 0 56px -16px rgba(125, 211, 252, 0.35), inset 0 0 24px rgba(125, 211, 252, 0.04)",
              maxHeight: "min(640px, calc(100svh - 9rem))",
            }}
            role="dialog"
            aria-label="Chat avec Speetch"
          >
            {/* Header chat */}
            <div className="flex items-center justify-between gap-3 border-b border-cyan-200/15 px-5 py-3">
              <div className="flex items-center gap-3">
                <SpeetchLogo size="sm" className="h-7 w-7" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] font-light text-[#F5F5F7]">
                    Speetch
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.32em] text-cyan-200/65">
                    <span className="relative mr-1.5 inline-flex h-1 w-1">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-60" />
                      <span className="relative inline-flex h-1 w-1 rounded-full bg-cyan-300" />
                    </span>
                    En ligne · Concierge
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={reset}
                  disabled={pending}
                  className="text-[9px] uppercase tracking-[0.28em] text-white/35 transition-colors hover:text-cyan-200 disabled:opacity-40"
                  title="Réinitialiser la conversation"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-cyan-200/65 transition-colors hover:bg-cyan-200/[0.06] hover:text-cyan-100"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  >
                    <path d="M5 5 L19 19 M19 5 L5 19" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Historique messages */}
            <div
              ref={scrollRef}
              className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5"
            >
              {messages.map((m, i) => (
                <Bubble key={`${m.role}-${i}`} message={m} />
              ))}
              {pending && <PendingBubble />}
            </div>

            {/* Erreur */}
            {error && (
              <div className="border-t border-red-400/30 bg-red-400/[0.06] px-5 py-2.5 text-[10px] uppercase tracking-[0.28em] text-red-300/85">
                ⚠ {error}
              </div>
            )}

            {/* Composer */}
            <div className="flex items-end gap-3 border-t border-cyan-200/15 bg-black/40 px-5 py-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) =>
                  setInput(e.target.value.slice(0, MAX_INPUT))
                }
                onKeyDown={onKeyDown}
                placeholder="Votre message…"
                rows={1}
                disabled={pending}
                className="min-h-[36px] flex-1 resize-none bg-transparent font-sans text-[14px] leading-relaxed text-[#F5F5F7] caret-cyan-200 placeholder:text-white/30 focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => send(input)}
                disabled={pending || input.trim().length === 0}
                className="inline-flex shrink-0 items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-cyan-100/85 transition-colors duration-300 hover:text-cyan-100 disabled:opacity-40"
              >
                <span>{pending ? "Envoi…" : "Envoyer"}</span>
                <span className="inline-block h-px w-4 bg-current transition-all duration-500 ease-out group-hover:w-8" />
              </button>
            </div>
            <div className="border-t border-cyan-200/10 px-5 py-1.5 text-[8px] uppercase tracking-[0.32em] text-white/30">
              ⏎ pour envoyer · ⇧⏎ pour une nouvelle ligne
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      <span
        className={`text-[8px] uppercase tracking-[0.32em] ${
          isUser ? "text-cyan-200/70" : "text-amber-200/70"
        }`}
      >
        {isUser ? "Vous" : "Speetch"}
      </span>
      <div
        className={`max-w-[90%] whitespace-pre-wrap break-words border px-3.5 py-2.5 font-sans text-[13.5px] leading-relaxed md:text-[14px] ${
          isUser
            ? "border-cyan-200/25 bg-cyan-200/[0.04] text-[#F5F5F7]"
            : "border-amber-300/30 bg-amber-300/[0.04] text-white/90"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function PendingBubble() {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[8px] uppercase tracking-[0.32em] text-amber-200/70">
        Speetch
      </span>
      <div className="inline-flex max-w-[60%] items-center gap-2 border border-amber-300/30 bg-amber-300/[0.04] px-3.5 py-2.5">
        <Dot delay={0} />
        <Dot delay={140} />
        <Dot delay={280} />
        <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.28em] text-white/45">
          rédige…
        </span>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300"
      style={{
        animation: `contactBotDot 1.1s ease-in-out ${delay}ms infinite`,
      }}
    />
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

/**
 * <DroidChat> — interface chat dédiée d'un droïde. State client-only :
 * l'historique des messages est tenu en React state, envoyé en entier
 * à chaque tour à /api/admin/droids/[codename].
 *
 * Stockage persistant : sessionStorage (clé par droïde), survit aux
 * re-rendus et aux refresh de l'onglet, perdu à la fermeture.
 *
 * UI : panneau "holocomm" — bulles à gauche pour le droïde (couleur
 * accent), à droite pour Maître (cyan neutre). Input bas, bouton
 * "Transmettre".
 */

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  codename: string;
  displayName: string;
  role: string;
  starters: string[];
  accentHex: string;
  accentGlow: string;
};

const MAX_INPUT = 4000;

export function DroidChat({
  codename,
  displayName,
  role,
  starters,
  accentHex,
  accentGlow,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const storageKey = `speetch:droid:${codename}`;

  // Hydrate depuis sessionStorage au montage.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Message[];
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      /* swallow */
    }
  }, [storageKey]);

  // Persiste à chaque mise à jour.
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      /* swallow */
    }
  }, [messages, storageKey]);

  // Scroll auto vers le bas.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  // Autosize textarea.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }, [input]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    setError(null);
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setPending(true);

    try {
      const res = await fetch(`/api/admin/droids/${codename}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error || `Erreur HTTP ${res.status}`);
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: json.reply ?? "" },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Liaison rompue.";
      setError(msg);
      // Rollback du message user pour qu'on puisse le ré-envoyer.
      setMessages((prev) => prev.slice(0, -1));
      setInput(content);
    } finally {
      setPending(false);
      // Refocus
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      send(input);
    }
  }

  function reset() {
    if (
      messages.length > 0 &&
      !confirm("Effacer cette transmission ? L'historique sera perdu.")
    )
      return;
    setMessages([]);
    setError(null);
    sessionStorage.removeItem(storageKey);
  }

  return (
    <div
      className="relative flex flex-col overflow-hidden border border-cyan-200/15 bg-black/40 backdrop-blur-[2px]"
      style={{
        boxShadow: `inset 0 0 32px ${accentGlow}, 0 0 48px -24px ${accentGlow}`,
      }}
    >
      {/* Header chat */}
      <div className="flex items-center justify-between border-b border-cyan-200/15 px-5 py-3">
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.32em]">
          <span style={{ color: accentHex }}>{displayName}</span>
          <span className="text-white/25">·</span>
          <span className="text-white/45">{role}</span>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={pending}
          className="text-[10px] uppercase tracking-[0.28em] text-white/35 transition-colors hover:text-red-300 disabled:opacity-40"
        >
          Couper la transmission
        </button>
      </div>

      {/* Historique */}
      <div
        ref={scrollRef}
        className="flex max-h-[60vh] min-h-[280px] flex-col gap-5 overflow-y-auto px-5 py-6"
      >
        {messages.length === 0 ? (
          <Starters
            displayName={displayName}
            starters={starters}
            accentHex={accentHex}
            onPick={(s) => send(s)}
            disabled={pending}
          />
        ) : (
          messages.map((m, i) => (
            <Bubble
              key={`${m.role}-${i}`}
              message={m}
              displayName={displayName}
              accentHex={accentHex}
            />
          ))
        )}
        {pending && <PendingBubble displayName={displayName} accentHex={accentHex} />}
      </div>

      {/* Erreur */}
      {error && (
        <div className="border-t border-red-400/30 bg-red-400/[0.06] px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-red-300/85">
          ⚠ {error}
        </div>
      )}

      {/* Composer */}
      <div className="flex items-end gap-3 border-t border-cyan-200/15 bg-black/30 px-5 py-4">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
          onKeyDown={onKeyDown}
          placeholder={`Adresse-toi à ${displayName}…`}
          rows={1}
          disabled={pending}
          className="min-h-[36px] flex-1 resize-none bg-transparent font-sans text-[15px] leading-relaxed text-[#F5F5F7] caret-cyan-200 placeholder:text-white/30 focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => send(input)}
          disabled={pending || input.trim().length === 0}
          className="group inline-flex shrink-0 items-center gap-3 text-[11px] uppercase tracking-[0.32em] transition-colors duration-300 disabled:opacity-40"
          style={{ color: accentHex }}
        >
          <span>{pending ? "Transmission…" : "Transmettre"}</span>
          <span
            className="inline-block h-px w-6 transition-all duration-500 ease-out group-hover:w-12 group-disabled:w-6"
            style={{ background: "currentColor" }}
          />
        </button>
      </div>

      <div className="border-t border-cyan-200/10 px-5 py-2 text-[9px] uppercase tracking-[0.32em] text-white/30">
        ⌘ / Ctrl + ⏎ pour envoyer · session locale (perdue à la fermeture de l'onglet)
      </div>
    </div>
  );
}

function Starters({
  displayName,
  starters,
  accentHex,
  onPick,
  disabled,
}: {
  displayName: string;
  starters: string[];
  accentHex: string;
  onPick: (s: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p
        className="font-serif text-base italic"
        style={{ color: accentHex }}
      >
        {displayName} attend ta requête, Maître.
      </p>
      <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">
        Suggestions d&apos;ouverture
      </p>
      <ul className="flex flex-col gap-2">
        {starters.map((s, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onPick(s)}
              disabled={disabled}
              className="group w-full border border-cyan-200/15 bg-cyan-200/[0.02] px-4 py-3 text-left text-[13px] text-white/70 transition-colors hover:border-cyan-200/40 hover:bg-cyan-200/[0.06] hover:text-cyan-100 disabled:opacity-40"
            >
              <span
                className="mr-3 font-mono text-[10px] uppercase tracking-[0.28em]"
                style={{ color: accentHex }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bubble({
  message,
  displayName,
  accentHex,
}: {
  message: Message;
  displayName: string;
  accentHex: string;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
      <span
        className="text-[9px] uppercase tracking-[0.32em]"
        style={{ color: isUser ? "rgba(125, 211, 252, 0.8)" : accentHex }}
      >
        {isUser ? "Maître" : displayName}
      </span>
      <div
        className={`max-w-[90%] whitespace-pre-wrap break-words border px-4 py-3 font-sans text-[14px] leading-relaxed md:text-[15px] ${
          isUser
            ? "border-cyan-200/25 bg-cyan-200/[0.04] text-[#F5F5F7]"
            : "bg-black/30 text-white/90"
        }`}
        style={
          isUser
            ? undefined
            : {
                borderColor: accentHex + "55",
                boxShadow: `inset 0 0 12px ${accentHex}11`,
              }
        }
      >
        {message.content}
      </div>
    </div>
  );
}

function PendingBubble({
  displayName,
  accentHex,
}: {
  displayName: string;
  accentHex: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="text-[9px] uppercase tracking-[0.32em]"
        style={{ color: accentHex }}
      >
        {displayName}
      </span>
      <div
        className="inline-flex max-w-[70%] items-center gap-2 border bg-black/30 px-4 py-3"
        style={{
          borderColor: accentHex + "55",
          boxShadow: `inset 0 0 12px ${accentHex}22`,
        }}
      >
        <Dot accentHex={accentHex} delay={0} />
        <Dot accentHex={accentHex} delay={150} />
        <Dot accentHex={accentHex} delay={300} />
        <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
          analyse…
        </span>
      </div>
    </div>
  );
}

function Dot({ accentHex, delay }: { accentHex: string; delay: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{
        background: accentHex,
        animation: `dotPulse 1.2s ease-in-out ${delay}ms infinite`,
      }}
    />
  );
}

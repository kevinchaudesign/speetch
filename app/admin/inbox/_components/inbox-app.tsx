"use client";

/**
 * <InboxApp> — interface email split-panel.
 *  - Colonne gauche : liste des messages (preview, from, date, statut)
 *  - Colonne droite : détail du message sélectionné + actions
 *  - Compose modal : nouveau message ou réponse
 *
 * Données initiales chargées server-side (cf. /admin/inbox/page.tsx),
 * rafraîchies via server action listInbox au refresh manuel.
 */

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  listInbox,
  openMessage,
  sendInboxEmail,
  type SendEmailState,
} from "../actions";
import type { InboxMessage } from "@/lib/email/imap";
import { Eyebrow } from "@/lib/ds";
import { ConfirmDialog } from "@/lib/ds/confirm-dialog";

const SEND_INITIAL: SendEmailState = { status: "idle" };

export function InboxApp({
  initialMessages,
  initialError,
  accountEmail,
}: {
  initialMessages: InboxMessage[];
  initialError: string | null;
  accountEmail: string | null;
}) {
  const [messages, setMessages] = useState<InboxMessage[]>(initialMessages);
  const [error, setError] = useState<string | null>(initialError);
  const [refreshing, startRefresh] = useTransition();
  const [selectedUid, setSelectedUid] = useState<number | null>(
    initialMessages[0]?.uid ?? null,
  );
  const selected = messages.find((m) => m.uid === selectedUid) ?? null;
  const [openBody, setOpenBody] = useState<{
    uid: number;
    text: string | null;
    html: string | null;
  } | null>(null);
  const [openingMessage, startOpen] = useTransition();
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyContext, setReplyContext] = useState<InboxMessage | null>(null);

  function refresh() {
    startRefresh(async () => {
      const res = await listInbox(50);
      if (res.status === "ok") {
        setMessages(res.messages);
        setError(null);
      } else {
        setError(res.error);
      }
    });
  }

  function selectMessage(uid: number) {
    setSelectedUid(uid);
    setOpenBody(null);
    startOpen(async () => {
      const res = await openMessage(uid);
      if (res.status === "ok") {
        setOpenBody({ uid, text: res.text, html: res.html });
        // Marquer comme vu localement
        setMessages((prev) =>
          prev.map((m) =>
            m.uid === uid ? { ...m, flags: { ...m.flags, seen: true } } : m,
          ),
        );
      }
    });
  }

  function openCompose(reply?: InboxMessage | null) {
    setReplyContext(reply ?? null);
    setComposeOpen(true);
  }

  return (
    <>
      {/* Header — titre + actions */}
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-cyan-200/15 px-6 py-6 md:px-10">
        <div className="flex flex-col gap-2">
          <Eyebrow tracking="lg" intensity="muted">
            Conseil · Transmissions
          </Eyebrow>
          <h1
            className="font-sans font-extralight leading-none tracking-[-0.04em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
          >
            Inbox{" "}
            <span className="font-serif italic text-cyan-200/85">
              — {accountEmail ?? "—"}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/70 transition-colors hover:text-cyan-100 disabled:opacity-40"
          >
            {refreshing ? "Synchro…" : "↻ Rafraîchir"}
          </button>
          <button
            type="button"
            onClick={() => openCompose(null)}
            className="border border-cyan-200/40 px-4 py-2 text-[10px] uppercase tracking-[0.32em] text-cyan-100 transition-all hover:border-cyan-100 hover:bg-cyan-200/[0.06]"
          >
            ✱ Nouveau message
          </button>
        </div>
      </header>

      {error && (
        <div className="border-b border-red-400/30 bg-red-400/[0.06] px-6 py-3 text-[11px] uppercase tracking-[0.28em] text-red-300/85 md:px-10">
          ⚠ {error}
        </div>
      )}

      {/* Split : liste + détail */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[400px_1fr]">
        {/* Liste — colonne gauche */}
        <aside className="overflow-y-auto border-r border-cyan-200/10">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <p className="font-serif text-base italic text-white/55">
                {refreshing
                  ? "Synchronisation…"
                  : "Aucun message à afficher."}
              </p>
            </div>
          ) : (
            <ul>
              {messages.map((m) => {
                const isSelected = m.uid === selectedUid;
                return (
                  <li
                    key={m.uid}
                    className={`border-b border-cyan-200/10 transition-colors ${
                      isSelected ? "bg-cyan-200/[0.06]" : ""
                    } ${!m.flags.seen ? "" : "opacity-75"}`}
                  >
                    <button
                      type="button"
                      onClick={() => selectMessage(m.uid)}
                      className="flex w-full flex-col gap-1.5 px-5 py-4 text-left transition-colors hover:bg-cyan-200/[0.04]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`truncate text-[13px] ${
                            !m.flags.seen
                              ? "font-medium text-[#F5F5F7]"
                              : "text-white/70"
                          }`}
                        >
                          {m.from.name ?? m.from.address}
                        </span>
                        <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.28em] text-white/40">
                          {formatDate(m.date)}
                        </span>
                      </div>
                      <p
                        className={`truncate text-[13px] ${
                          !m.flags.seen
                            ? "text-[#F5F5F7]"
                            : "text-white/65"
                        }`}
                      >
                        {m.subject}
                      </p>
                      {m.preview && (
                        <p className="line-clamp-1 text-[12px] text-white/40">
                          {m.preview}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        {!m.flags.seen && (
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-300" />
                        )}
                        {m.flags.answered && (
                          <span className="font-mono text-[8px] uppercase tracking-[0.32em] text-emerald-300/70">
                            ↩ Répondu
                          </span>
                        )}
                        {m.flags.flagged && (
                          <span className="font-mono text-[8px] uppercase tracking-[0.32em] text-amber-300/85">
                            ★ Étoilé
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Détail — colonne droite */}
        <section className="flex flex-col overflow-y-auto">
          {selected ? (
            <MessageDetail
              message={selected}
              body={openBody?.uid === selected.uid ? openBody : null}
              loading={openingMessage}
              onReply={() => openCompose(selected)}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <p className="font-serif text-base italic text-white/55">
                Sélectionner une transmission à lire.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Modal compose / reply */}
      {composeOpen && (
        <ComposeModal
          reply={replyContext}
          onClose={() => setComposeOpen(false)}
          onSent={() => {
            setComposeOpen(false);
            refresh();
          }}
        />
      )}
    </>
  );
}

function MessageDetail({
  message,
  body,
  loading,
  onReply,
}: {
  message: InboxMessage;
  body: { text: string | null; html: string | null } | null;
  loading: boolean;
  onReply: () => void;
}) {
  return (
    <article className="flex flex-col gap-6 p-6 md:p-10">
      <header className="flex flex-col gap-3 border-b border-cyan-200/15 pb-6">
        <h2
          className="font-sans font-extralight leading-tight tracking-[-0.03em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
        >
          {message.subject}
        </h2>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="text-[13px] text-white/85">
            <span className="text-white/45">De : </span>
            {message.from.name ? (
              <>
                {message.from.name}{" "}
                <span className="text-white/45">
                  &lt;{message.from.address}&gt;
                </span>
              </>
            ) : (
              message.from.address
            )}
          </p>
          {message.to.length > 0 && (
            <p className="text-[12px] text-white/55">
              <span className="text-white/35">À : </span>
              {message.to.map((t) => t.address).join(", ")}
            </p>
          )}
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
            {new Date(message.date).toLocaleString("fr-FR", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </p>
        </div>
        <div className="flex items-center gap-4 pt-2">
          <button
            type="button"
            onClick={onReply}
            className="text-[10px] uppercase tracking-[0.32em] text-cyan-100 transition-colors hover:text-white"
          >
            ↩ Répondre
          </button>
        </div>
      </header>

      <div className="flex-1">
        {loading && !body && (
          <p className="font-serif text-base italic text-white/55">
            Chargement du contenu…
          </p>
        )}
        {body?.html ? (
          <div
            className="prose prose-invert prose-cyan max-w-none text-[14px] leading-relaxed text-white/85 [&_a]:text-cyan-200 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: body.html }}
          />
        ) : body?.text ? (
          <pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-white/85">
            {body.text}
          </pre>
        ) : !loading ? (
          <p className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-white/65">
            {message.preview || "(corps vide)"}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function ComposeModal({
  reply,
  onClose,
  onSent,
}: {
  reply: InboxMessage | null;
  onClose: () => void;
  onSent: () => void;
}) {
  const [state, formAction] = useActionState(sendInboxEmail, SEND_INITIAL);
  const [confirmClose, setConfirmClose] = useState(false);

  const initialTo = reply?.from.address ?? "";
  const initialSubject = reply
    ? reply.subject.startsWith("Re: ")
      ? reply.subject
      : `Re: ${reply.subject}`
    : "";
  const initialText = reply
    ? `\n\n\n--- ${reply.from.name ?? reply.from.address} a écrit le ${new Date(reply.date).toLocaleString("fr-FR")} ---\n${reply.preview}`
    : "";

  // Si l'envoi a réussi, ferme et notifie le parent
  useEffect(() => {
    if (state.status === "success") onSent();
  }, [state.status, onSent]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 backdrop-blur-md"
      onClick={() => setConfirmClose(true)}
    >
      <div
        className="relative w-full max-w-2xl border border-cyan-200/25 bg-black/95 px-6 py-8 md:px-10 md:py-10"
        style={{
          boxShadow:
            "0 32px 64px -16px rgba(0, 0, 0, 0.75), 0 0 56px -16px rgba(125, 211, 252, 0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-6 flex items-center justify-between">
          <Eyebrow tracking="lg" intensity="strong">
            {reply ? "Répondre" : "Nouveau message"}
          </Eyebrow>
          <button
            type="button"
            onClick={() => setConfirmClose(true)}
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
        </header>

        <form action={formAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-200/70">
              À
            </span>
            <input
              type="email"
              name="to"
              required
              defaultValue={initialTo}
              placeholder="destinataire@exemple.fr"
              className="border-b border-cyan-200/20 bg-transparent py-2 text-[14px] text-[#F5F5F7] caret-cyan-200 placeholder:text-white/30 focus:border-cyan-200/60 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-200/70">
              Objet
            </span>
            <input
              type="text"
              name="subject"
              required
              defaultValue={initialSubject}
              placeholder="Objet du message"
              className="border-b border-cyan-200/20 bg-transparent py-2 text-[14px] text-[#F5F5F7] caret-cyan-200 placeholder:text-white/30 focus:border-cyan-200/60 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-200/70">
              Message
            </span>
            <textarea
              name="text"
              required
              rows={10}
              defaultValue={initialText}
              placeholder="Écrire le message…"
              className="resize-none border border-cyan-200/15 bg-cyan-200/[0.02] px-3 py-2 font-sans text-[14px] leading-relaxed text-[#F5F5F7] caret-cyan-200 placeholder:text-white/30 focus:border-cyan-200/40 focus:outline-none"
            />
          </label>

          {reply?.messageId && (
            <>
              <input
                type="hidden"
                name="in_reply_to"
                value={reply.messageId}
              />
              <input
                type="hidden"
                name="references"
                value={reply.messageId}
              />
            </>
          )}

          {state.status === "error" && state.error && (
            <p className="border-l-2 border-red-400/60 bg-red-400/[0.06] px-3 py-2 text-[12px] text-red-300/85">
              ⚠ {state.error}
            </p>
          )}

          <div className="flex items-center justify-end gap-4 border-t border-cyan-200/15 pt-4">
            <button
              type="button"
              onClick={() => setConfirmClose(true)}
              className="text-[10px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-cyan-100"
            >
              Annuler
            </button>
            <SubmitButton />
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={confirmClose}
        title="Abandonner ce message ?"
        description="Le contenu rédigé ne sera pas sauvegardé."
        confirmLabel="Abandonner"
        tone="warning"
        zIndex={95}
        onConfirm={() => {
          setConfirmClose(false);
          onClose();
        }}
        onCancel={() => setConfirmClose(false)}
      />
    </div>
  );
}

function SubmitButton() {
  return (
    <button
      type="submit"
      className="border border-cyan-200/40 px-5 py-2 text-[10px] uppercase tracking-[0.32em] text-cyan-100 transition-all hover:border-cyan-100 hover:bg-cyan-200/[0.06] disabled:opacity-50"
    >
      ↗ Transmettre
    </button>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < day && now.getDate() === d.getDate()) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffMs < 7 * day) {
    return d.toLocaleDateString("fr-FR", { weekday: "short" });
  }
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

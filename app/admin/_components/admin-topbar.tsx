"use client";

/**
 * AdminTopbar — barre flottante en haut à droite du back-office.
 *
 * Contient :
 *  - Bouton messagerie : raccourci pour ouvrir Maître Yoda (dispatch d'un
 *    CustomEvent que AdminAssistant écoute, évite de lifter son state)
 *  - Avatar du Maître connecté : ouvre un menu dropdown avec liens vers
 *    l'Identité Jedi (settings/profile) et la déconnexion (form signout)
 *
 * Le bouton "Quitter le Temple" a été déplacé ici depuis la sidebar :
 * regroupé avec l'avatar, il fait office d'actions personnelles du
 * Maître connecté.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SpeetchLogo } from "@/app/_components/speetch-logo";

const ASSISTANT_OPEN_EVENT = "speetch:assistant:open";
const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function AdminTopbar({
  displayName,
  avatarUrl,
}: {
  displayName: string | null;
  avatarUrl: string | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  function openAssistant() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(ASSISTANT_OPEN_EVENT));
  }

  // Click outside + Escape pour fermer le menu profil.
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (
        target &&
        !menuRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div
      className="fixed right-4 top-4 z-30 hidden items-center gap-5 md:flex"
      role="toolbar"
      aria-label="Barre utilisateur admin"
    >
      {/* Icône To-Do — liste de tâches Jedi (placeholder, route à venir).
          Pas de cercle d'arrière-plan : l'icône respire dans l'espace. */}
      <Link
        href="/admin/todo"
        aria-label="Tâches Jedi"
        title="Tâches Jedi"
        className="inline-flex h-10 w-10 items-center justify-center text-cyan-200/70 transition-colors duration-300 hover:text-cyan-100"
      >
        <TodoIcon />
      </Link>

      {/* Icône messagerie — ouvre Maître Yoda */}
      <button
        type="button"
        onClick={openAssistant}
        aria-label="Ouvrir la messagerie Maître Yoda"
        title="Ouvrir Maître Yoda"
        className="inline-flex h-10 w-10 items-center justify-center text-cyan-200/70 transition-colors duration-300 hover:text-cyan-100"
      >
        <MessageIcon />
      </button>

      {/* Avatar du Maître — déclenche le menu profil */}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={
            displayName
              ? `Menu profil de ${displayName}`
              : "Menu profil"
          }
          title={displayName ?? "Identité Jedi"}
          className="group relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-200/20 bg-cyan-200/[0.04] backdrop-blur-md transition-colors duration-300 hover:border-cyan-200/55"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName ?? "Avatar"}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            // Fallback : logo Speetch quand aucun avatar n'est défini.
            <SpeetchLogo size="md" className="h-full w-full object-cover" />
          )}
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 rounded-full transition-all duration-500",
              menuOpen
                ? "ring-2 ring-cyan-200/40"
                : "ring-0 ring-cyan-200/0 group-hover:ring-2 group-hover:ring-cyan-200/30",
            )}
          />
        </button>

        {/* Menu profil — Identité Jedi + Quitter le Temple */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              ref={menuRef}
              key="profile-menu"
              role="menu"
              aria-label="Menu profil"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
              className="absolute right-0 top-12 w-60 origin-top-right overflow-hidden rounded-xl border border-cyan-200/20 bg-black/85 backdrop-blur-xl"
              style={{
                boxShadow:
                  "0 18px 48px -12px rgba(0, 0, 0, 0.7), 0 0 24px rgba(125, 211, 252, 0.12)",
              }}
            >
              {/* En-tête : nom + identifiant */}
              <div className="flex flex-col gap-1 border-b border-cyan-200/10 px-5 py-4">
                <span className="text-[9px] uppercase tracking-[0.4em] text-cyan-200/55">
                  Maître connecté
                </span>
                <span className="font-serif text-[15px] italic font-light text-[#F5F5F7]">
                  {displayName ?? "Identité Jedi"}
                </span>
              </div>

              <ul className="flex flex-col p-2">
                <li>
                  <Link
                    href="/admin/settings/profile"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="group flex items-center gap-3 rounded-md px-3 py-2.5 text-[11px] uppercase tracking-[0.28em] text-white/70 transition-colors duration-300 hover:bg-cyan-200/[0.06] hover:text-cyan-100"
                  >
                    <ProfileIcon />
                    <span>Identité Jedi</span>
                  </Link>
                </li>
                <li>
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      role="menuitem"
                      className="group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[11px] uppercase tracking-[0.28em] text-white/55 transition-colors duration-300 hover:bg-red-400/[0.08] hover:text-red-200"
                    >
                      <ExitIcon />
                      <span>Quitter le Temple</span>
                    </button>
                  </form>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MessageIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12c0 4.5-4 8-9 8-1.3 0-2.6-.2-3.7-.7L3 21l1.7-4.6C3.6 15.2 3 13.6 3 12c0-4.5 4-8 9-8s9 3.5 9 8Z" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TodoIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Clipboard avec cocher — liste de tâches */}
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 11l2 2 4-4" />
      <path d="M9 17h6" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-cyan-200/65 transition-colors group-hover:text-cyan-100"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

function ExitIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-white/40 transition-colors group-hover:text-red-300"
      aria-hidden
    >
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 16l-4-4 4-4" />
      <path d="M6 12h12" />
    </svg>
  );
}


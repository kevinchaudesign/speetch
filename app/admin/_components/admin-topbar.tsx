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
      {/* Chronomètre galactique — agenda du Conseil Jedi (route à venir) */}
      <Link
        href="/admin/calendar"
        aria-label="Chronomètre galactique"
        title="Chronomètre galactique"
        className="inline-flex h-10 w-10 items-center justify-center text-cyan-200/70 transition-colors duration-300 hover:text-cyan-100"
      >
        <ChronometerIcon />
      </Link>

      {/* Codex datapad — Tâches Jedi */}
      <Link
        href="/admin/todo"
        aria-label="Codex des tâches"
        title="Codex des tâches"
        className="inline-flex h-10 w-10 items-center justify-center text-cyan-200/70 transition-colors duration-300 hover:text-cyan-100"
      >
        <CodexIcon />
      </Link>

      {/* Émetteur holographique — transmissions reçues (route à venir).
          Maître Yoda reste accessible via la floating orb en bas-droite. */}
      <Link
        href="/admin/inbox"
        aria-label="Transmissions holographiques"
        title="Transmissions holographiques"
        className="inline-flex h-10 w-10 items-center justify-center text-cyan-200/70 transition-colors duration-300 hover:text-cyan-100"
      >
        <TransmissionIcon />
      </Link>

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

/* ──────────────────────────────────────────────────────────────────────
   Icônes topbar — grammaire visuelle SW / Conseil Jedi.
   Géométrie épurée (cercles concentriques, hexagones, triangles), dots
   pleins pour le feel "holocron". Stroke 1.3 pour cohérence avec la
   sidebar.
   ────────────────────────────────────────────────────────────────────── */

function TransmissionIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Émetteur holographique — base disque + cône de projection
          triangulaire + données scintillantes à l'intérieur, look R2-D2
          qui projette un message. */}
      <ellipse cx="12" cy="20" rx="7" ry="1.4" />
      <path d="M6 20 L12 5 L18 20" />
      <path d="M9 20 L12 11 L15 20" />
      <circle cx="12" cy="16.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="11" cy="14" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="13" cy="13" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CodexIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Codex datapad — face hexagonale (silhouette holocron) + lignes
          de mission + dot lumineux marquant la tâche active. */}
      <path d="M7 3.5 L17 3.5 L21 12 L17 20.5 L7 20.5 L3 12 Z" />
      <path d="M9 10 L16 10" />
      <path d="M9 13 L16 13" />
      <path d="M9 16 L13.5 16" />
      <circle cx="7.2" cy="10" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ChronometerIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Chronomètre galactique — dial concentrique avec ticks cardinaux,
          stem en couronne et noyau plein. Évoque un instrument de bord
          d'un X-wing plutôt qu'un calendrier mural. */}
      <circle cx="12" cy="13" r="8" />
      <circle cx="12" cy="13" r="4.5" />
      <path d="M12 5.5 L12 7" />
      <path d="M19.5 13 L18 13" />
      <path d="M12 21 L12 19.5" />
      <path d="M4.5 13 L6 13" />
      <path d="M10.5 2.5 L13.5 2.5" />
      <path d="M12 4.5 L12 2.5" />
      <circle cx="12" cy="13" r="1.1" fill="currentColor" stroke="none" />
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
      {/* Jedi encapuchonné — hood triangulaire + visage plein, plus
          énigmatique que la classique silhouette épaules/tête. */}
      <path d="M12 3 L19.5 20.5 L4.5 20.5 Z" />
      <circle cx="12" cy="11" r="2.2" fill="currentColor" stroke="none" />
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
      {/* Sas du Temple — porte verrouillée à gauche, double chevron de
          fuite en hyperespace à droite. */}
      <rect x="3.5" y="3.5" width="9" height="17" rx="0.8" />
      <circle cx="9.5" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <path d="M14 12 L21 12" />
      <path d="M17 8 L21 12 L17 16" />
      <path d="M14.5 9.5 L17 12 L14.5 14.5" />
    </svg>
  );
}


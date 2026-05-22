"use client";

/**
 * Toggle audio Conseil Jedi — petit speaker glyph en bas de la sidebar.
 *
 * Stocké en localStorage. Au premier clic active aussi le AudioContext
 * (requis par les politiques d'autoplay des navigateurs : un user
 * gesture doit avoir initié la création/reprise du contexte).
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  isAudioEnabled,
  playLightsaberIgnite,
  setAudioEnabled,
  subscribeAudio,
} from "@/lib/sw/audio";

export function AudioToggle({ collapsed }: { collapsed: boolean }) {
  const [enabled, setEnabled] = useState(false);
  // Évite l'hydration mismatch (localStorage indispo côté serveur).
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEnabled(isAudioEnabled());
    setHydrated(true);
    const unsub = subscribeAudio((next) => setEnabled(next));
    return unsub;
  }, []);

  function handleToggle() {
    const next = !enabled;
    setAudioEnabled(next);
    setEnabled(next);
    // Première activation = on joue immédiatement le son d'allumage pour
    // confirmer auditivement (et débloquer le AudioContext via user gesture).
    if (next) {
      // Léger délai pour laisser le ctx reprendre après resume()
      window.setTimeout(() => playLightsaberIgnite(), 30);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={
        hydrated
          ? enabled
            ? "Audio Conseil Jedi · ON (cliquer pour couper)"
            : "Audio Conseil Jedi · OFF (cliquer pour activer)"
          : "Audio Conseil Jedi"
      }
      aria-label={
        enabled
          ? "Couper l'audio Conseil Jedi"
          : "Activer l'audio Conseil Jedi"
      }
      aria-pressed={enabled}
      className={cn(
        "group inline-flex items-center gap-3 whitespace-nowrap text-[10px] uppercase tracking-[0.32em] transition-colors duration-300",
        hydrated && enabled
          ? "text-cyan-100 hover:text-cyan-100"
          : "text-white/45 hover:text-cyan-100",
      )}
    >
      <SpeakerGlyph enabled={hydrated && enabled} />
      <span
        className={cn(
          "transition-opacity duration-300",
          collapsed && "pointer-events-none opacity-0",
        )}
      >
        Audio
        {hydrated && enabled && (
          <span className="ml-2 text-cyan-200/60">· ON</span>
        )}
      </span>
    </button>
  );
}

function SpeakerGlyph({ enabled }: { enabled: boolean }) {
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
      className={cn(
        "shrink-0 transition-transform duration-300",
        enabled && "sw-hologram-text",
      )}
      aria-hidden
    >
      {/* Cône speaker */}
      <path d="M5 10 L9 10 L13 6 L13 18 L9 14 L5 14 Z" />
      {enabled ? (
        // Ondes sortantes (audio ON)
        <>
          <path d="M16 9 Q18 12 16 15" />
          <path d="M19 6 Q22 12 19 18" />
        </>
      ) : (
        // Croix (audio OFF)
        <path d="M17 9 L21 15 M21 9 L17 15" />
      )}
    </svg>
  );
}

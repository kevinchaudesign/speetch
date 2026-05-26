"use client";

/**
 * OwnerImagePicker — modal qui liste les images de la médiathèque studio
 * (profil owner). Click sur une vignette = sélection immédiate.
 * Fetch lazy à la première ouverture, cache state-local ensuite.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fetchOwnerImages, type OwnerImage } from "../actions";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function OwnerImagePicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (image: OwnerImage) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<OwnerImage[]>([]);
  const [fetched, setFetched] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open || fetched) return;
    setLoading(true);
    setError(null);
    fetchOwnerImages().then((res) => {
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setImages(res.images);
      setFetched(true);
    });
  }, [open, fetched]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = images.filter((m) => {
    if (!query.trim()) return true;
    return m.filename.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm md:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="flex w-full max-w-4xl flex-col gap-5 rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 md:p-8"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
                Choisir une image — Galerie studio
              </p>
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white"
              >
                Fermer ×
              </button>
            </div>

            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom de fichier…"
              className="w-full border-b border-white/15 bg-transparent py-2 text-base text-white outline-none transition-colors focus:border-white/45"
              autoFocus
            />

            <div className="max-h-[60vh] overflow-y-auto">
              {loading ? (
                <p className="py-10 text-center font-serif text-base italic text-white/40">
                  Chargement de la médiathèque…
                </p>
              ) : error ? (
                <p
                  role="alert"
                  className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                >
                  {error}
                </p>
              ) : filtered.length === 0 ? (
                <p className="py-10 text-center font-serif text-base italic text-white/40">
                  {images.length === 0
                    ? "Aucune image dans la Galerie. Uploade depuis /admin/clients/<owner>/media."
                    : "Aucun résultat pour cette recherche."}
                </p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {filtered.map((img) => (
                    <li key={img.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(img)}
                        className={cn(
                          "group relative block aspect-square w-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] transition-all",
                          "hover:border-white/35",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.public_url}
                          alt={img.filename}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 font-mono text-[10px] text-white/80">
                          {img.filename}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

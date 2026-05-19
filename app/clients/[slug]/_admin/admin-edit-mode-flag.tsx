"use client";

import { useEffect } from "react";

/**
 * Pose un attribut `data-speetch-admin` sur `<html>` quand un admin Speetch
 * est connecté pendant la consultation d'un espace client. Les vues de pages
 * (raw_html, document, fwa) le lisent pour décider d'activer ou non leur
 * mode édition (overlays + bridge vers l'assistant).
 */
export function AdminEditModeFlag() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.speetchAdmin = "true";
    return () => {
      delete root.dataset.speetchAdmin;
    };
  }, []);
  return null;
}

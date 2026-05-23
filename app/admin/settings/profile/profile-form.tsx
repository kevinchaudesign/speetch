"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateOwnerProfile, type UpdateOwnerState } from "./actions";
import { Field } from "@/lib/ds";
import { playR2Beep } from "@/lib/sw/audio";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const INITIAL_STATE: UpdateOwnerState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cyan-100/80 transition-colors duration-300 hover:text-cyan-100 disabled:cursor-wait disabled:opacity-50"
    >
      <span>{pending ? "Scellement…" : "Sceller"}</span>
      <span className="inline-block h-px w-6 bg-cyan-200/85 transition-all duration-500 ease-out group-hover:w-12 group-hover:bg-cyan-100" />
    </button>
  );
}

export function ProfileForm({
  initialFullName,
  initialAvatarUrl,
  ownerEmail,
}: {
  initialFullName: string;
  initialAvatarUrl: string;
  ownerEmail: string | null;
}) {
  const [state, formAction] = useActionState(
    updateOwnerProfile,
    INITIAL_STATE,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initialAvatarUrl);
  const [pendingFileName, setPendingFileName] = useState<string | null>(null);
  const [clearRequested, setClearRequested] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  // Cleanup des object URLs créés pour la preview locale (mémoire).
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  // Beep R2-D2 + reset des états locaux sur scellement réussi.
  useEffect(() => {
    if (state.status === "success") {
      playR2Beep();
      setPendingFileName(null);
      setClearRequested(false);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      // Reset l'input file pour qu'un même fichier puisse être re-sélectionné.
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [state.status]);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setClearRequested(false);
    setPendingFileName(file.name);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreviewUrl(url);
  }

  function onClearAvatar() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setPreviewUrl("");
    setPendingFileName(null);
    setClearRequested(true);
  }

  return (
    <motion.form
      action={formAction}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT_EXPO }}
      className="flex w-full max-w-2xl flex-col gap-10"
      encType="multipart/form-data"
    >
      <Field label="Identifiant Conseil" hint="lecture seule">
        <span className="border-b border-cyan-200/15 bg-transparent pb-3 font-mono text-base text-white/55">
          {ownerEmail ?? "—"}
        </span>
      </Field>

      <Field label="Nom de Maître">
        <input
          type="text"
          name="full_name"
          required
          autoComplete="off"
          defaultValue={initialFullName}
          placeholder="Yoda"
          className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-xl font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none md:text-2xl"
        />
      </Field>

      <Field
        label="Sigil holographique"
        hint="JPG / PNG / WEBP / SVG · 5 MB max"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-200/25 bg-white/[0.03] transition-colors hover:border-cyan-200/55 hover:bg-cyan-200/[0.04]"
              aria-label="Changer la photo de profil"
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Aperçu avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[9px] uppercase tracking-[0.32em] text-cyan-200/55 transition-colors group-hover:text-cyan-100">
                  Aucun
                </span>
              )}
            </button>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cyan-100/80 transition-colors hover:text-cyan-100"
              >
                <span>
                  {pendingFileName
                    ? "Choisir un autre fichier"
                    : previewUrl
                      ? "Remplacer la photo"
                      : "Téléverser une photo"}
                </span>
                <span className="inline-block h-px w-5 bg-cyan-200/65 transition-all duration-500 ease-out group-hover:w-10 group-hover:bg-cyan-100" />
              </button>
              {(previewUrl || pendingFileName) && (
                <button
                  type="button"
                  onClick={onClearAvatar}
                  className="text-left text-[10px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-red-300"
                >
                  Retirer
                </button>
              )}
              {pendingFileName && (
                <span className="font-mono text-[10px] text-cyan-200/65">
                  {pendingFileName}
                </span>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            name="avatar_file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
            onChange={onPickFile}
            className="hidden"
          />
          {clearRequested && (
            <input type="hidden" name="clear_avatar" value="1" />
          )}
        </div>
      </Field>

      <Field
        label="Ou colle une URL externe"
        hint="optionnel — utilisée si aucun fichier n'est téléversé"
      >
        <input
          type="url"
          name="avatar_url"
          autoComplete="off"
          defaultValue={initialAvatarUrl}
          placeholder="https://…"
          className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
        />
      </Field>

      <AnimatePresence>
        {state.status === "error" && state.error && (
          <motion.p
            key={state.error}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="border-l-2 border-red-400/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/85"
            style={{ textShadow: "0 0 8px rgba(252, 165, 165, 0.35)" }}
          >
            {state.error}
          </motion.p>
        )}
        {state.status === "success" && (
          <motion.p
            key="ok"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="border-l-2 border-cyan-300/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-cyan-200/90"
            style={{ textShadow: "0 0 8px rgba(125, 211, 252, 0.45)" }}
          >
            Identité scellée.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between border-t border-cyan-200/15 pt-6">
        <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/35">
          Code holocron géré via Supabase Auth
        </span>
        <SubmitButton />
      </div>
    </motion.form>
  );
}

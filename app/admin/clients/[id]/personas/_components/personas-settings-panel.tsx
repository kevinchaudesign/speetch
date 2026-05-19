"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  addPersonasProjectPin,
  removePersonasProjectPin,
  setPersonasPublished,
} from "../actions";

export type ProjectOption = {
  id: string;
  name: string;
};

export function PersonasSettingsPanel({
  profileId,
  published,
  pinnedProjectIds,
  projects,
}: {
  profileId: string;
  published: boolean;
  pinnedProjectIds: string[];
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const pinnedSet = new Set(pinnedProjectIds);
  const pinnedCount = pinnedSet.size;

  function handleTogglePublished() {
    setError(null);
    startTransition(async () => {
      const res = await setPersonasPublished({
        profileId,
        published: !published,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleTogglePin(projectId: string) {
    setError(null);
    const isPinned = pinnedSet.has(projectId);
    startTransition(async () => {
      const res = isPinned
        ? await removePersonasProjectPin({ profileId, projectId })
        : await addPersonasProjectPin({ profileId, projectId });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  const statusText = (() => {
    if (!published) return "Masquée côté client";
    if (pinnedCount === 0) return "Visible · section top-level";
    if (pinnedCount === 1) {
      const name = projects.find((p) => pinnedSet.has(p.id))?.name;
      return name ? `Visible · rangée dans « ${name} »` : "Visible · rangée dans 1 projet";
    }
    return `Visible · rangée dans ${pinnedCount} projets`;
  })();

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
      <header className="flex items-baseline justify-between gap-6">
        <p className="text-[11px] uppercase tracking-[0.4em] text-white/45">
          Publication
        </p>
        <p className="text-[11px] uppercase tracking-[0.32em] text-white/30">
          {statusText}
        </p>
      </header>

      {error && (
        <p className="border-l-2 border-red-400/40 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/80">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto] md:items-center">
        {/* Toggle publication */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
            Partager avec le client
          </span>
          <p className="font-serif text-sm italic text-white/45">
            Quand activé, la page Personas devient consultable depuis
            l&apos;espace privé du client.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={published}
          aria-label="Partager les personas avec le client"
          onClick={handleTogglePublished}
          disabled={pending}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-all duration-300 ease-out disabled:cursor-wait disabled:opacity-50",
            published
              ? "border-white/45 bg-white/85"
              : "border-white/15 bg-white/[0.04] hover:border-white/35",
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full transition-transform duration-300 ease-out",
              published
                ? "translate-x-[22px] bg-black/85"
                : "translate-x-[2px] bg-white/55",
            )}
          />
        </button>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-6">
        <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
          Ranger dans des projets
        </span>
        <p className="font-serif text-sm italic text-white/45">
          {projects.length === 0
            ? "Aucun projet pour ce client — la page restera en section top-level."
            : "Coche un ou plusieurs projets : le lien « Personas » apparaîtra dans la liste de pages de chacun. Si aucun n'est coché, la page reste en section top-level sur la home espace."}
        </p>

        {projects.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {projects.map((p) => {
              const checked = pinnedSet.has(p.id);
              return (
                <li key={p.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors",
                      pending
                        ? "cursor-wait opacity-60"
                        : "hover:bg-white/[0.03]",
                    )}
                  >
                    <span
                      role="checkbox"
                      aria-checked={checked}
                      tabIndex={-1}
                      className={cn(
                        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-200 ease-out",
                        checked
                          ? "border-white bg-white text-black"
                          : "border-white/35 text-transparent hover:border-white/70",
                      )}
                    >
                      {checked && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 11 11"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M2 5.5 L4.5 8 L9 3" />
                        </svg>
                      )}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleTogglePin(p.id)}
                      disabled={pending}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        "text-sm transition-colors",
                        checked ? "text-[#F5F5F7]" : "text-white/65",
                      )}
                    >
                      {p.name}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

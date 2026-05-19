"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { setPersonasProject, setPersonasPublished } from "../actions";

export type ProjectOption = {
  id: string;
  name: string;
};

export function PersonasSettingsPanel({
  profileId,
  published,
  projectId,
  projects,
}: {
  profileId: string;
  published: boolean;
  projectId: string | null;
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  function handleChangeProject(value: string) {
    setError(null);
    const nextProjectId = value === "" ? null : value;
    startTransition(async () => {
      const res = await setPersonasProject({
        profileId,
        projectId: nextProjectId,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  const projectLabel =
    projectId && projects.length > 0
      ? projects.find((p) => p.id === projectId)?.name ?? null
      : null;

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
      <header className="flex items-baseline justify-between gap-6">
        <p className="text-[11px] uppercase tracking-[0.4em] text-white/45">
          Publication
        </p>
        <p className="text-[11px] uppercase tracking-[0.32em] text-white/30">
          {published
            ? projectLabel
              ? `Visible · rangée dans « ${projectLabel} »`
              : "Visible · section top-level"
            : "Masquée côté client"}
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

      <div className="flex flex-col gap-2 border-t border-white/10 pt-6">
        <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
          Ranger dans un projet
        </span>
        <p className="font-serif text-sm italic text-white/45">
          {projects.length === 0
            ? "Aucun projet pour ce client — la page restera en section top-level."
            : "Si un projet est sélectionné, le lien « Personas » apparaît dans la liste de pages de ce projet. Sinon, en section top-level sur la home espace."}
        </p>
        <select
          value={projectId ?? ""}
          onChange={(e) => handleChangeProject(e.target.value)}
          disabled={pending || projects.length === 0}
          aria-label="Projet où ranger la page Personas"
          className={cn(
            "mt-2 cursor-pointer border-0 border-b border-white/15 bg-transparent py-2 text-sm outline-none transition-colors hover:border-white/35 focus:border-white/45 disabled:cursor-not-allowed disabled:opacity-50",
            projectId ? "text-white/85" : "text-white/45",
          )}
        >
          <option value="" className="bg-[#0a0a0a] text-white/65">
            — Aucun · section top-level —
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id} className="bg-[#0a0a0a] text-white">
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

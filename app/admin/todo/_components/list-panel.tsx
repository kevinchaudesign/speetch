"use client";

/**
 * ListPanel — colonne 1 : sidebar des collections / dossiers.
 * Inclut les 3 raccourcis globaux (Toutes, Épinglées, Non classées) +
 * les listes custom du Maître + bouton "+ Liste".
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { TodoListItem } from "../_lib/types";
import type { SelectedScope } from "./todo-app";

export function ListPanel({
  className,
  lists,
  selectedScope,
  stats,
  pending,
  onSelectScope,
  onCreateList,
  onRenameList,
  onDeleteList,
}: {
  className?: string;
  lists: TodoListItem[];
  selectedScope: SelectedScope;
  stats: { total: number; pinned: number; unfiled: number };
  pending: boolean;
  onSelectScope: (scope: SelectedScope) => void;
  onCreateList: () => void;
  onRenameList: (id: string, name: string) => void;
  onDeleteList: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <aside
      className={cn(
        "flex flex-col gap-1 overflow-y-auto bg-black/30 px-4 py-5 backdrop-blur-sm",
        className,
      )}
      aria-label="Listes de tâches"
    >
      <h2 className="mb-3 px-3 text-[10px] uppercase tracking-[0.4em] text-cyan-200/55">
        Collections
      </h2>

      <ScopeRow
        label="Toutes"
        count={stats.total}
        active={selectedScope.kind === "all"}
        onClick={() => onSelectScope({ kind: "all" })}
        icon={<AllIcon />}
      />
      <ScopeRow
        label="Épinglées"
        count={stats.pinned}
        active={selectedScope.kind === "pinned"}
        onClick={() => onSelectScope({ kind: "pinned" })}
        icon={<PinIcon />}
      />
      <ScopeRow
        label="Non classées"
        count={stats.unfiled}
        active={selectedScope.kind === "unfiled"}
        onClick={() => onSelectScope({ kind: "unfiled" })}
        icon={<FolderIcon />}
      />

      <div
        aria-hidden
        className="sw-hologram-line my-4 mx-2 h-px"
      />

      <h2 className="mb-2 px-3 text-[10px] uppercase tracking-[0.4em] text-cyan-200/55">
        Listes
      </h2>

      {lists.length === 0 ? (
        <p className="px-3 py-2 font-serif text-xs italic text-white/40">
          Aucune liste. Crée-en une pour ranger tes parchemins.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {lists.map((list) => {
            const active =
              selectedScope.kind === "list" &&
              selectedScope.listId === list.id;
            const isEditing = editingId === list.id;
            return (
              <li key={list.id}>
                {isEditing ? (
                  <ListNameInput
                    initialName={list.name}
                    onConfirm={(name) => {
                      if (name.trim()) onRenameList(list.id, name.trim());
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      onSelectScope({ kind: "list", listId: list.id })
                    }
                    onDoubleClick={() => setEditingId(list.id)}
                    className={cn(
                      "group flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[13px] transition-colors",
                      active
                        ? "bg-cyan-200/[0.08] text-cyan-100"
                        : "text-white/65 hover:bg-cyan-200/[0.04] hover:text-cyan-100/90",
                    )}
                    title="Double-clic pour renommer"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <FolderIcon
                        small
                        className={cn(active ? "text-cyan-100" : "text-cyan-200/50")}
                      />
                      <span className="truncate">{list.name}</span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-[10px]",
                        active ? "text-cyan-200/85" : "text-white/30",
                      )}
                    >
                      {list.count}
                    </span>
                  </button>
                )}
                {active && !isEditing && (
                  <div className="flex items-center gap-3 px-3 pb-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingId(list.id)}
                      className="text-[9px] uppercase tracking-[0.3em] text-cyan-200/50 transition-colors hover:text-cyan-100"
                    >
                      Renommer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `Effacer la liste "${list.name}" ? Les notes seront déplacées en "Non classées".`,
                          )
                        ) {
                          onDeleteList(list.id);
                        }
                      }}
                      className="text-[9px] uppercase tracking-[0.3em] text-white/35 transition-colors hover:text-red-300"
                    >
                      Effacer
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Action en bas — bouton "+ Liste" */}
      <button
        type="button"
        onClick={onCreateList}
        disabled={pending}
        className="mt-auto flex items-center gap-2 rounded-md px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors hover:bg-cyan-200/[0.04] hover:text-cyan-100 disabled:opacity-50"
      >
        <PlusIcon />
        <span>{pending ? "Forge…" : "Nouvelle liste"}</span>
      </button>
    </aside>
  );
}

function ScopeRow({
  label,
  count,
  active,
  onClick,
  icon,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[13px] transition-colors",
        active
          ? "bg-cyan-200/[0.08] text-cyan-100"
          : "text-white/65 hover:bg-cyan-200/[0.04] hover:text-cyan-100/90",
      )}
    >
      <span className="flex items-center gap-2.5">
        <span className={cn(active ? "text-cyan-100" : "text-cyan-200/50")}>
          {icon}
        </span>
        <span>{label}</span>
      </span>
      <span
        className={cn(
          "shrink-0 font-mono text-[10px]",
          active ? "text-cyan-200/85" : "text-white/30",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ListNameInput({
  initialName,
  onConfirm,
  onCancel,
}: {
  initialName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialName);
  return (
    <input
      autoFocus
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onConfirm(value);
        } else if (e.key === "Escape") {
          onCancel();
        }
      }}
      onBlur={() => onConfirm(value)}
      className="w-full rounded-md border border-cyan-200/30 bg-cyan-200/[0.05] px-3 py-2 text-[13px] text-[#F5F5F7] caret-cyan-200 outline-none placeholder:text-white/30 focus:border-cyan-200/60"
      maxLength={80}
    />
  );
}

/* ── Icônes ───────────────────────────────────────────────────────── */

function AllIcon({ className }: { className?: string }) {
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
      className={className}
      aria-hidden
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
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
      className={className}
      aria-hidden
    >
      <path d="M12 2v6" />
      <path d="M6 8h12l-2 6H8l-2-6Z" />
      <path d="M12 14v8" />
    </svg>
  );
}

function FolderIcon({
  className,
  small,
}: {
  className?: string;
  small?: boolean;
}) {
  const s = small ? 12 : 14;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

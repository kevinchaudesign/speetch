"use client";

import { useState } from "react";

/**
 * <HolocronPicker> — select Holocron (client). À la sélection,
 * pré-remplit les champs client snapshot (nom, email, etc.) via
 * "uncontrolled inputs" du form parent — on triche en mutant les
 * valeurs des inputs frères ayant un `data-snapshot` matchant.
 *
 * v1 simplifié : on n'expose que le nom du client, l'email et un
 * éventuel SIREN. Adresse + société restent saisies manuellement (la
 * table profiles n'a pas encore ces champs).
 */

type Holocron = {
  id: string;
  full_name: string;
  client_email: string | null;
};

export function HolocronPicker({
  holocrons,
  initialId,
}: {
  holocrons: Holocron[];
  initialId: string | null;
}) {
  const [id, setId] = useState<string>(initialId ?? "");

  function applySnapshot(holocronId: string) {
    const found = holocrons.find((h) => h.id === holocronId);
    if (!found) return;
    const form = (document.activeElement?.closest("form") ??
      document.querySelector("form")) as HTMLFormElement | null;
    if (!form) return;
    const name = form.querySelector<HTMLInputElement>(
      'input[name="client_name"]',
    );
    const email = form.querySelector<HTMLInputElement>(
      'input[name="client_email"]',
    );
    if (name && !name.value) name.value = found.full_name;
    if (email && !email.value && found.client_email)
      email.value = found.client_email;
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        name="profile_id"
        value={id}
        onChange={(e) => {
          setId(e.target.value);
          if (e.target.value) applySnapshot(e.target.value);
        }}
        className="w-full cursor-pointer appearance-none border-b border-cyan-200/25 bg-transparent bg-[length:10px_10px] bg-[position:right_0.6rem_center] bg-no-repeat pb-3 pr-8 font-sans text-base font-light text-[#F5F5F7] focus:border-cyan-200/80 focus:outline-none [background-image:linear-gradient(45deg,transparent_50%,rgba(125,211,252,0.6)_50%),linear-gradient(135deg,rgba(125,211,252,0.6)_50%,transparent_50%)] [background-position:right_1.1rem_center,right_0.65rem_center] [background-size:5px_5px,5px_5px]"
      >
        <option value="" className="bg-black text-white/50">
          — Aucun Holocron rattaché —
        </option>
        {holocrons.map((h) => (
          <option key={h.id} value={h.id} className="bg-black text-white">
            {h.full_name}
            {h.client_email ? ` · ${h.client_email}` : ""}
          </option>
        ))}
      </select>
      <p className="font-serif text-[11px] italic text-white/40">
        Sélection optionnelle : auto-remplit nom + e-mail si vides. La
        société, adresse et SIREN restent à compléter ci-dessous.
      </p>
    </div>
  );
}

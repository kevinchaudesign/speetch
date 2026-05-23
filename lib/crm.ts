/**
 * CRM Speetch — source de vérité des statuts/sources Padawans.
 *
 * Les valeurs sont stockées telles quelles dans crm_padawans.status /
 * .source (TEXT, sans contrainte CHECK pour rester souple). Les libellés
 * SW sont affichés via PADAWAN_STATUS_LABEL / PADAWAN_SOURCE_LABEL.
 */

export const PADAWAN_STATUS_VALUES = [
  "detected",
  "approached",
  "qualified",
  "won",
  "lost",
] as const;

export type PadawanStatus = (typeof PADAWAN_STATUS_VALUES)[number];

export const PADAWAN_STATUS_LABEL: Record<PadawanStatus, string> = {
  detected: "Détecté",
  approached: "Approché",
  qualified: "Sensible à la Force",
  won: "Adoubé",
  lost: "Perdu pour la Force",
};

export const PADAWAN_STATUS_TONE: Record<
  PadawanStatus,
  "info" | "neutral" | "warning" | "success" | "danger"
> = {
  detected: "info",
  approached: "neutral",
  qualified: "warning",
  won: "success",
  lost: "danger",
};

export function isPadawanStatus(value: string): value is PadawanStatus {
  return (PADAWAN_STATUS_VALUES as readonly string[]).includes(value);
}

export const PADAWAN_SOURCE_VALUES = [
  "referral",
  "inbound",
  "outbound",
  "event",
  "other",
] as const;

export type PadawanSource = (typeof PADAWAN_SOURCE_VALUES)[number];

export const PADAWAN_SOURCE_LABEL: Record<PadawanSource, string> = {
  referral: "Recommandation",
  inbound: "Entrant",
  outbound: "Démarchage",
  event: "Conclave",
  other: "Autre",
};

export function isPadawanSource(value: string): value is PadawanSource {
  return (PADAWAN_SOURCE_VALUES as readonly string[]).includes(value);
}

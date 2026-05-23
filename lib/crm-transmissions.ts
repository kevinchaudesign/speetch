/**
 * Types partagés pour les transmissions CRM (emailings via Brevo).
 *
 * Une transmission = un envoi (1 sujet + 1 corps + N destinataires
 * snapshotés au moment de l'envoi).
 */

export const TRANSMISSION_STATUS_VALUES = [
  "pending",
  "sending",
  "sent",
  "partial",
  "failed",
] as const;

export type TransmissionStatus = (typeof TRANSMISSION_STATUS_VALUES)[number];

export const TRANSMISSION_STATUS_LABEL: Record<TransmissionStatus, string> = {
  pending: "En attente",
  sending: "Envoi en cours",
  sent: "Transmise",
  partial: "Partiellement transmise",
  failed: "Échec",
};

export const TRANSMISSION_STATUS_TONE: Record<
  TransmissionStatus,
  "info" | "neutral" | "warning" | "success" | "danger"
> = {
  pending: "neutral",
  sending: "info",
  sent: "success",
  partial: "warning",
  failed: "danger",
};

export function isTransmissionStatus(
  value: string,
): value is TransmissionStatus {
  return (TRANSMISSION_STATUS_VALUES as readonly string[]).includes(value);
}

export type TransmissionRecipientStatus =
  | "pending"
  | "delivered"
  | "failed";

export type TransmissionRecipient = {
  /** UUID du padawan source. null si destinataire libre (pas en BDD). */
  padawan_id: string | null;
  email: string;
  full_name: string | null;
  status: TransmissionRecipientStatus;
  brevo_message_id: string | null;
  error: string | null;
};

export type TransmissionRow = {
  id: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  sender_name: string | null;
  sender_email: string;
  reply_to: string | null;
  recipients: TransmissionRecipient[];
  recipient_count: number;
  delivered_count: number;
  failed_count: number;
  status: string;
  error: string | null;
  created_at: string;
  sent_at: string | null;
};

/** Limite de sécurité pour éviter un envoi accidentel massif. */
export const TRANSMISSION_MAX_RECIPIENTS = 200;

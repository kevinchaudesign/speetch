"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { sendBrevoTransactional, textToBrevoHtml } from "@/lib/brevo";
import { loadBrevoSettings } from "@/lib/brevo-config";
import {
  TRANSMISSION_MAX_RECIPIENTS,
  type TransmissionRecipient,
} from "@/lib/crm-transmissions";

export type SendTransmissionState = {
  status: "idle" | "success" | "error";
  error?: string;
  transmissionId?: string;
};

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireOwnerAndAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expirée. Reconnecte-toi." as const };
  }
  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { error: "Accès réservé au propriétaire." as const };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      error:
        "SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local — impossible d'écrire dans Supabase." as const,
    };
  }
  return { admin: createAdminClient() };
}

export async function sendTransmission(
  _prev: SendTransmissionState,
  formData: FormData,
): Promise<SendTransmissionState> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return { status: "error", error: auth.error };

  const brevo = await loadBrevoSettings();
  if (!brevo) {
    return {
      status: "error",
      error:
        "Émetteur Brevo non configuré. Va dans Forge → Émetteur Brevo pour le sceller.",
    };
  }

  const subject = String(formData.get("subject") ?? "").trim();
  const bodyText = String(formData.get("body_text") ?? "").trim();
  const replyToRaw = String(formData.get("reply_to") ?? "").trim();
  const padawanIds = formData
    .getAll("padawan_ids")
    .map((v) => String(v))
    .filter((id) => UUID_REGEX.test(id));

  if (subject.length < 2) {
    return { status: "error", error: "Sujet trop court (min. 2 caractères)." };
  }
  if (bodyText.length < 2) {
    return { status: "error", error: "Le corps du message est vide." };
  }
  if (padawanIds.length === 0) {
    return {
      status: "error",
      error: "Sélectionne au moins un padawan destinataire.",
    };
  }
  if (padawanIds.length > TRANSMISSION_MAX_RECIPIENTS) {
    return {
      status: "error",
      error: `Trop de destinataires (${padawanIds.length} > ${TRANSMISSION_MAX_RECIPIENTS}).`,
    };
  }
  if (replyToRaw && !EMAIL_REGEX.test(replyToRaw)) {
    return { status: "error", error: "Adresse de réponse invalide." };
  }

  // Charge les padawans sélectionnés, filtre ceux qui ont un email.
  const { data: padawanRows } = await auth.admin
    .from("crm_padawans" as never)
    .select("id, full_name, email")
    .in("id", padawanIds)
    .returns<Array<{ id: string; full_name: string; email: string | null }>>();

  const validRecipients = (padawanRows ?? [])
    .filter((p) => p.email && EMAIL_REGEX.test(p.email))
    .map<TransmissionRecipient>((p) => ({
      padawan_id: p.id,
      email: p.email as string,
      full_name: p.full_name,
      status: "pending",
      brevo_message_id: null,
      error: null,
    }));

  if (validRecipients.length === 0) {
    return {
      status: "error",
      error:
        "Aucun padawan sélectionné n'a d'e-mail valide en BDD.",
    };
  }

  const htmlContent = textToBrevoHtml(bodyText);

  // Reply-To : valeur saisie au compose, sinon valeur par défaut Brevo.
  const replyToEmail = replyToRaw || brevo.replyTo || null;

  // 1) Insère la transmission en statut 'sending' (snapshot recipients).
  const { data: inserted, error: insertError } = await auth.admin
    .from("crm_transmissions" as never)
    .insert({
      subject,
      body_text: bodyText,
      body_html: htmlContent,
      sender_email: brevo.senderEmail,
      sender_name: brevo.senderName,
      reply_to: replyToEmail,
      recipients: validRecipients,
      recipient_count: validRecipients.length,
      status: "sending",
    } as never)
    .select("id")
    .single<{ id: string }>();

  if (insertError || !inserted) {
    console.error("[sendTransmission] insert error:", insertError);
    return {
      status: "error",
      error: insertError?.message ?? "Erreur d'insertion de la transmission.",
    };
  }

  const transmissionId = inserted.id;

  // 2) Envois en parallèle via Brevo (1 API call / destinataire, OK
  // jusqu'à ~200, après on devrait passer par les Campaigns Brevo).
  const replyTo = replyToEmail
    ? { email: replyToEmail, name: brevo.senderName }
    : undefined;

  const results = await Promise.all(
    validRecipients.map(async (r) => {
      const out = await sendBrevoTransactional({
        apiKey: brevo.apiKey,
        sender: { email: brevo.senderEmail, name: brevo.senderName },
        to: { email: r.email, name: r.full_name },
        subject,
        htmlContent,
        textContent: bodyText,
        replyTo,
        tags: ["speetch-crm", `transmission:${transmissionId}`],
      });
      if (out.ok) {
        return {
          ...r,
          status: "delivered" as const,
          brevo_message_id: out.messageId,
          error: null,
        };
      }
      return {
        ...r,
        status: "failed" as const,
        brevo_message_id: null,
        error: out.error,
      };
    }),
  );

  const deliveredCount = results.filter((r) => r.status === "delivered").length;
  const failedCount = results.filter((r) => r.status === "failed").length;
  const finalStatus: "sent" | "partial" | "failed" =
    failedCount === 0
      ? "sent"
      : deliveredCount === 0
        ? "failed"
        : "partial";

  // 3) Met à jour avec les résultats détaillés.
  const { error: updateError } = await auth.admin
    .from("crm_transmissions" as never)
    .update({
      recipients: results,
      delivered_count: deliveredCount,
      failed_count: failedCount,
      status: finalStatus,
      sent_at: new Date().toISOString(),
    } as never)
    .eq("id", transmissionId);

  if (updateError) {
    console.error("[sendTransmission] final update error:", updateError);
    // La transmission a été envoyée même si l'update échoue — on remonte
    // un succès partiel avec l'id pour que l'UI affiche la trace.
    return {
      status: "success",
      transmissionId,
    };
  }

  revalidatePath("/admin/crm/transmissions");
  revalidatePath(`/admin/crm/transmissions/${transmissionId}`);
  return { status: "success", transmissionId };
}

export async function deleteTransmission(formData: FormData): Promise<void> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!UUID_REGEX.test(id)) return;

  await auth.admin
    .from("crm_transmissions" as never)
    .delete()
    .eq("id", id);

  revalidatePath("/admin/crm/transmissions");
  redirect("/admin/crm/transmissions");
}

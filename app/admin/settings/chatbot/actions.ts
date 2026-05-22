"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { DEFAULT_PRODUCT_BRIEF } from "@/lib/chatbot/system-prompt";

export type UpdateChatbotPromptState = {
  status: "idle" | "success" | "error";
  error?: string;
};

const MAX_PROMPT_LENGTH = 24_000; // ~6k tokens — large mais borné côté UI.

/**
 * Met à jour le `chatbot_system_prompt` du profil owner.
 *
 * - Si le textarea est vide (ou whitespace), on stocke NULL → le chatbot
 *   retombe sur `DEFAULT_PRODUCT_BRIEF`.
 * - Si le texte soumis est **identique** au default (au trim près), on
 *   stocke aussi NULL — pas la peine de dupliquer le default en BDD si
 *   l'utilisateur ne l'a pas modifié.
 * - Sinon on stocke le texte tel quel.
 *
 * Pas de validation lourde : c'est un prompt LLM, le format est libre. On
 * borne juste la longueur pour éviter qu'un copier-coller accidentel pète la
 * BDD ou explose les coûts API.
 */
export async function updateChatbotPrompt(
  _prev: UpdateChatbotPromptState,
  formData: FormData,
): Promise<UpdateChatbotPromptState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", error: "Session expirée. Reconnecte-toi." };
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { status: "error", error: "Accès réservé au propriétaire." };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      status: "error",
      error:
        "SUPABASE_SERVICE_ROLE_KEY manquant — impossible d'écrire dans Supabase.",
    };
  }

  const raw = String(formData.get("prompt") ?? "");
  const trimmed = raw.trim();

  if (trimmed.length > MAX_PROMPT_LENGTH) {
    return {
      status: "error",
      error: `Prompt trop long (${trimmed.length} caractères, max ${MAX_PROMPT_LENGTH}).`,
    };
  }

  // Vide ou identique au default → NULL en BDD (sémantique « pas de custom »).
  const isEmptyOrDefault =
    trimmed.length === 0 || trimmed === DEFAULT_PRODUCT_BRIEF.trim();
  const nextValue: string | null = isEmptyOrDefault ? null : raw;

  const admin = createAdminClient();
  const { data: ownerRow, error: lookupError } = await admin
    .from("profiles")
    .select("id")
    .eq("is_owner", true)
    .maybeSingle();

  if (lookupError) {
    console.error("[updateChatbotPrompt] lookup error:", lookupError);
    return { status: "error", error: lookupError.message };
  }

  if (!ownerRow) {
    return {
      status: "error",
      error:
        "Profil owner introuvable. Configure ton Identité Jedi d'abord (/admin/settings/profile).",
    };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ chatbot_system_prompt: nextValue })
    .eq("id", ownerRow.id);

  if (updateError) {
    console.error("[updateChatbotPrompt] update error:", updateError);
    return { status: "error", error: updateError.message };
  }

  // Force revalidation des pages qui affichent l'état du custom prompt.
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/chatbot");
  return { status: "success" };
}

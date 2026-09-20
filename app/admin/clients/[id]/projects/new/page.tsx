import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { clientLookupColumn, clientSegment } from "@/lib/admin/resolve-client";
import { isValidProjectType } from "@/lib/project-types";
import { NewProjectForm } from "./new-project-form";
import { TypePicker } from "./type-picker";

export const metadata: Metadata = {
  title: "Nouvelle mission",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/admin/clients/${id}/projects/new`);
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const { data: client } = await admin
    .from("profiles")
    .select("id, full_name, slug")
    .eq(clientLookupColumn(id), id)
    .eq("is_owner", false)
    .maybeSingle();

  if (!client) notFound();
  // URL canonique : le segment porte le nom du client, jamais son UUID.
  const clientSlug = clientSegment(client);
  if (clientSlug !== id) {
    const query = type ? `?type=${encodeURIComponent(type)}` : "";
    redirect(`/admin/clients/${clientSlug}/projects/new${query}`);
  }

  // Étape 2 — formulaire pré-rempli avec le type choisi
  if (type && isValidProjectType(type)) {
    return (
      <NewProjectForm
        clientId={client.id}
        clientName={client.full_name ?? "Sans nom"}
        clientSlug={client.slug ?? ""}
        initialType={type}
      />
    );
  }

  // Étape 1 — sélecteur visuel de type
  return <TypePicker clientName={client.full_name ?? "Sans nom"} />;
}

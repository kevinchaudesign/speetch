import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { clientLookupColumn, clientSegment } from "@/lib/admin/resolve-client";
import { NewContextForm } from "./new-context-form";

export const metadata: Metadata = {
  title: "Forger un parchemin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewClientContextPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/admin/clients/${id}/context/new`);
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, slug")
    .eq(clientLookupColumn(id), id)
    .eq("is_owner", false)
    .maybeSingle();

  if (!profile) notFound();
  const clientSlug = clientSegment(profile);
  // URL canonique : le segment porte le nom du client, jamais son UUID.
  if (clientSlug !== id) redirect(`/admin/clients/${clientSlug}/context/new`);

  return (
    <NewContextForm
      profileId={profile.id}
      clientName={profile.full_name ?? "Client"}
    />
  );
}

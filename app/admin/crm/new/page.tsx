import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewPadawanForm } from "./new-padawan-form";

export const metadata: Metadata = {
  title: "Repérer un Padawan",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewPadawanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/crm/new");
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  return <NewPadawanForm />;
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loadOwnerEmailAccount,
  loadOwnerEmailAccountMeta,
} from "@/lib/email/account";
import { fetchInboxMessages, type InboxMessage } from "@/lib/email/imap";
import { InboxApp } from "./_components/inbox-app";

export const metadata: Metadata = {
  title: "Transmissions · Conseil Jedi",
  robots: { index: false, follow: false },
};

// On désactive le cache : chaque visite relit IMAP en live.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InboxPage() {
  // Auth — owner only (cohérent avec /admin/todo, /admin/settings/email…)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin/inbox");
  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const meta = await loadOwnerEmailAccountMeta();

  // Pas de compte configuré → guide vers la Forge
  if (!meta) {
    return (
      <div className="flex min-h-[calc(100svh-72px)] flex-col items-center justify-center px-6 py-16 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan-200/65">
          Conseil · Transmissions
        </p>
        <h1
          className="mt-6 font-sans font-extralight leading-tight tracking-[-0.04em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
        >
          Aucune boîte connectée.
        </h1>
        <p className="mt-4 max-w-md font-serif text-base italic text-white/65">
          Pour recevoir et envoyer des transmissions depuis le Conseil,
          connectez d&apos;abord votre boîte contact@speetch.com.
        </p>
        <Link
          href="/admin/settings/email"
          className="mt-8 border border-cyan-200/40 px-5 py-2.5 text-[10px] uppercase tracking-[0.32em] text-cyan-100 transition-all hover:border-cyan-100 hover:bg-cyan-200/[0.06]"
        >
          ↗ Aller à la Forge email
        </Link>
      </div>
    );
  }

  // Charge les messages côté serveur (avec password déchiffré)
  let messages: InboxMessage[] = [];
  let error: string | null = null;
  try {
    const account = await loadOwnerEmailAccount();
    if (!account) {
      error =
        "Compte trouvé mais le mot de passe ne peut pas être déchiffré. Reconnectez la boîte.";
    } else {
      messages = await fetchInboxMessages(account, { limit: 50 });
    }
  } catch (err) {
    error =
      err instanceof Error
        ? `Connexion IMAP impossible : ${err.message}`
        : "Connexion IMAP impossible (erreur inconnue).";
  }

  return (
    <div className="flex h-[calc(100svh-72px)] flex-col bg-black">
      <InboxApp
        initialMessages={messages}
        initialError={error}
        accountEmail={meta.email}
      />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button, StatusBadge } from "@/lib/ds";
import { loadEmitterSettings, isEmitterReady } from "@/lib/credits/emitter";

export const metadata: Metadata = {
  title: "Facturation électronique · Forge",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function FacturationElectroniquePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin/settings/facturation-electronique");

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const emitter = await loadEmitterSettings();
  const emitterReady = isEmitterReady(emitter);
  const pdpConfigured = !!emitter?.pdp_provider;

  return (
    <div className="relative min-h-svh w-full overflow-hidden px-6 py-10 md:px-16 md:py-14">
      <div
        aria-hidden
        className="sw-starfield pointer-events-none absolute inset-0 -z-10"
      />
      <div
        aria-hidden
        className="sw-scanlines pointer-events-none absolute inset-0 -z-10 opacity-50"
      />
      <div
        aria-hidden
        className="sw-lightsaber-bar pointer-events-none absolute bottom-16 left-2 top-24 hidden w-[2px] rounded-full md:block"
      />

      <header className="flex items-center justify-between md:hidden">
        <Link
          href="/admin/settings"
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 hover:text-cyan-100"
        >
          ← Forge
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Facturation
        </span>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-start gap-12 pt-20">
        <div className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/55">
            <Link href="/admin" className="transition-colors hover:text-cyan-100">
              Conseil Jedi
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <Link
              href="/admin/settings"
              className="transition-colors hover:text-cyan-100"
            >
              Forge
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <span className="text-cyan-200/85">Facturation électronique</span>
          </p>

          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
          >
            Facturation{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
              électronique
            </span>
          </h1>

          <p className="max-w-2xl font-serif text-base italic text-white/55 md:text-lg">
            Réforme française imposant la transmission des factures B2B via
            un intermédiaire agréé (PDP) à partir de septembre 2026. Voici
            où Speetch en est, ce qui marche déjà, et ce qu&apos;il te
            reste à décider.
          </p>
        </div>

        {/* État actuel */}
        <Panel title="État de ton compte">
          <Row
            label="Émetteur Crédits (Forge)"
            ok={emitterReady}
            okLabel="Configuré"
            koLabel="À compléter"
            href="/admin/settings/emitter"
          />
          <Row
            label="Génération Factur-X XML"
            ok={emitterReady}
            okLabel="Active"
            koLabel="Bloquée tant que l'émetteur n'est pas configuré"
          />
          <Row
            label="Envoi par email Brevo (avec XML attaché)"
            ok={emitterReady}
            okLabel="Disponible"
            koLabel="Bloquée tant que l'émetteur n'est pas configuré"
          />
          <Row
            label="Branchement PDP"
            ok={pdpConfigured}
            okLabel={emitter?.pdp_provider ?? "Configuré"}
            koLabel="Aucun PDP branché — voir ci-dessous"
            warningIfMissing
          />
        </Panel>

        {/* C'est quoi un PDP */}
        <Panel title="C'est quoi un PDP ?">
          <p className="font-serif text-[15px] leading-relaxed text-white/80">
            Une <strong className="not-italic text-cyan-100">PDP</strong>{" "}
            (Plateforme de Dématérialisation Partenaire) est un intermédiaire
            agréé par l&apos;État qui transmet tes factures à tes clients
            B2B au format électronique. À partir de{" "}
            <strong className="not-italic text-amber-200">
              septembre 2026
            </strong>
            , tu ne pourras plus envoyer un PDF par email à une entreprise
            française : la facture devra transiter par un PDP (ton PDP →
            le PDP du client → le client).
          </p>
          <pre className="overflow-x-auto rounded-md border border-cyan-200/15 bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-cyan-200/75">
{`Speetch  →  ton PDP  →  PDP du client  →  client
                    ↘  admin fiscale (déclaration TVA auto)`}
          </pre>
        </Panel>

        {/* Calendrier */}
        <Panel title="Calendrier de l'obligation">
          <ul className="flex flex-col gap-3 text-[14px] text-white/80">
            <Calendar
              date="1ᵉʳ sept. 2026"
              text="Toutes les entreprises doivent recevoir leurs factures par PDP."
              accent="amber"
            />
            <Calendar
              date="1ᵉʳ sept. 2026"
              text="Grandes entreprises + ETI doivent émettre par PDP."
              accent="amber"
            />
            <Calendar
              date="1ᵉʳ sept. 2027"
              text="PME / TPE / micro-entreprises (toi) doivent émettre par PDP."
              accent="cyan"
            />
            <Calendar
              date="B2C / hors UE"
              text="Pas concerné par les PDP, mais e-reporting déclaratif obligatoire."
            />
          </ul>
          <p className="font-serif text-[12px] italic text-white/45">
            Date d&apos;obligation exacte pour Speetch :{" "}
            <a
              href="https://www.impots.gouv.fr/professionnel/je-passe-la-facturation-electronique"
              target="_blank"
              rel="noopener"
              className="text-cyan-200 underline-offset-4 hover:underline"
            >
              vérifier sur impots.gouv.fr
            </a>
            .
          </p>
        </Panel>

        {/* Choix PDP */}
        <Panel title="Choisir un PDP">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PdpCard
              name="Chorus Pro"
              price="Gratuit"
              pros={[
                "Plateforme publique de l'État",
                "Obligatoire pour facturer le secteur public",
                "Accepte le CII (le XML qu'on génère déjà)",
              ]}
              cons={[
                "UX austère, pas d'intégration compta",
                "Manuel : upload XML facture par facture",
              ]}
              recommended
            />
            <PdpCard
              name="PDP privé (Pennylane, Sellsy, Dext…)"
              price="10-50 €/mois"
              pros={[
                "UX moderne, intégrations compta auto",
                "Transmission auto depuis le Conseil",
                "Suivi du statut en temps réel",
              ]}
              cons={[
                "Abonnement mensuel",
                "Demande un branchement API supplémentaire",
              ]}
            />
          </div>
        </Panel>

        {/* Ce qu'on peut déjà faire / ce qui reste */}
        <Panel title="Ce qui marche déjà">
          <ul className="flex flex-col gap-2 text-[14px] text-white/80">
            <Bullet ok>
              Émission de factures conformes (numérotation séquentielle,
              mentions légales, snapshot client SIREN + TVA intra)
            </Bullet>
            <Bullet ok>
              Génération du <code className="text-cyan-100">XML Factur-X</code> téléchargeable
              depuis chaque facture (profil BASIC, conforme EN 16931)
            </Bullet>
            <Bullet ok>
              Envoi de la facture par email avec le XML attaché (Brevo)
            </Bullet>
            <Bullet ok>
              Lien public signé pour que le client télécharge le PDF
            </Bullet>
            <Bullet ok>
              Avoirs (émission + numérotation séquentielle AV-AAAA-NNNN)
            </Bullet>
          </ul>
        </Panel>

        <Panel title="Ce qu'il reste à brancher" subtle="warning">
          <ul className="flex flex-col gap-2 text-[14px] text-white/80">
            <Bullet>
              <strong className="not-italic text-amber-100">
                Wrapper PDF/A-3
              </strong>{" "}
              avec le XML embarqué (Factur-X au sens strict). Aujourd&apos;hui
              le XML est séparé du PDF ; un PDP comme Chorus Pro accepte les
              deux mais le wrapper unifié est mieux.
            </Bullet>
            <Bullet>
              <strong className="not-italic text-amber-100">
                Adapter PDP
              </strong>{" "}
              (Chorus Pro ou un PDP privé). L&apos;interface est prête côté
              code, il manque juste l&apos;intégration API du PDP choisi.
            </Bullet>
            <Bullet>
              <strong className="not-italic text-amber-100">
                Bouton « Transmettre au PDP »
              </strong>{" "}
              sur la fiche facture (1 clic = facture envoyée au client par
              le canal officiel).
            </Bullet>
            <Bullet>
              <strong className="not-italic text-amber-100">
                Suivi du cycle de vie
              </strong>{" "}
              (statut remonté par le PDP : déposée, refusée, encaissée…)
              affiché sur la liste des factures.
            </Bullet>
          </ul>
        </Panel>

        {/* CTA */}
        <Panel title="Ce qu'il te reste à décider">
          <ol className="flex list-decimal flex-col gap-3 pl-5 text-[14px] text-white/80">
            <li>
              Vérifier ta date d&apos;obligation exacte (sept. 2027 si
              micro/TPE) sur{" "}
              <a
                href="https://www.impots.gouv.fr/professionnel/je-passe-la-facturation-electronique"
                target="_blank"
                rel="noopener"
                className="text-cyan-200 underline-offset-4 hover:underline"
              >
                impots.gouv.fr
              </a>
              .
            </li>
            <li>
              Choisir entre <strong className="text-cyan-100">Chorus Pro</strong>{" "}
              (gratuit, manuel) ou un{" "}
              <strong className="text-cyan-100">PDP privé</strong> (payant,
              automatique).
            </li>
            <li>
              Me transmettre ton choix → je branche l&apos;adapter dans la
              foulée et tu pourras émettre depuis le Conseil en 1 clic.
            </li>
          </ol>
          <div className="flex flex-wrap gap-4 pt-2">
            <Button href="/admin/settings/emitter" variant="primary">
              Compléter l&apos;émetteur ↗
            </Button>
            <a
              href="https://www.impots.gouv.fr/professionnel/je-passe-la-facturation-electronique"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cyan-200/65 transition-colors hover:text-cyan-100"
            >
              Vérifier mon obligation
              <span className="inline-block h-px w-4 bg-current transition-all duration-500 ease-out hover:w-10" />
            </a>
          </div>
        </Panel>

        <p className="border-l-2 border-cyan-200/30 pl-4 font-serif text-[12px] italic text-white/45">
          Détail technique pour reprise du code :{" "}
          <code className="not-italic text-cyan-200">
            MD/facturation-electronique-roadmap.md
          </code>{" "}
          dans le repo.
        </p>

        <Link
          href="/admin/settings"
          className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55 hover:text-cyan-100"
        >
          ← Retour Forge
        </Link>
      </section>
    </div>
  );
}

/* ─── UI helpers ──────────────────────────────────────────────────── */

function Panel({
  title,
  subtle,
  children,
}: {
  title: string;
  subtle?: "warning";
  children: React.ReactNode;
}) {
  const border =
    subtle === "warning" ? "border-amber-300/25" : "border-cyan-200/15";
  return (
    <section
      className={`relative flex w-full flex-col gap-5 border ${border} bg-cyan-200/[0.018] px-6 py-6`}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 h-2 w-2 border-l border-t border-cyan-200/55"
      />
      <span
        aria-hidden
        className="absolute right-0 top-0 h-2 w-2 border-r border-t border-cyan-200/55"
      />
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-cyan-200/55"
      />
      <span
        aria-hidden
        className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-cyan-200/55"
      />
      <h2 className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/85">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({
  label,
  ok,
  okLabel,
  koLabel,
  href,
  warningIfMissing,
}: {
  label: string;
  ok: boolean;
  okLabel: string;
  koLabel: string;
  href?: string;
  warningIfMissing?: boolean;
}) {
  const tone = ok ? "success" : warningIfMissing ? "warning" : "danger";
  const content = (
    <div className="flex items-center justify-between gap-4 border-b border-cyan-200/10 py-3 last:border-b-0">
      <span className="text-sm text-white/80">{label}</span>
      <StatusBadge tone={tone}>{ok ? okLabel : koLabel}</StatusBadge>
    </div>
  );
  return href ? (
    <Link href={href} className="group transition-colors">
      {content}
    </Link>
  ) : (
    content
  );
}

function Calendar({
  date,
  text,
  accent,
}: {
  date: string;
  text: string;
  accent?: "amber" | "cyan";
}) {
  const color =
    accent === "amber"
      ? "text-amber-200/90"
      : accent === "cyan"
        ? "text-cyan-200/90"
        : "text-white/55";
  return (
    <li className="flex items-baseline gap-4 border-b border-cyan-200/10 pb-2 last:border-b-0">
      <span
        className={`shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] ${color}`}
      >
        {date}
      </span>
      <span className="font-serif italic text-white/75">{text}</span>
    </li>
  );
}

function PdpCard({
  name,
  price,
  pros,
  cons,
  recommended,
}: {
  name: string;
  price: string;
  pros: string[];
  cons: string[];
  recommended?: boolean;
}) {
  return (
    <div className="relative flex flex-col gap-3 border border-cyan-200/15 bg-black/30 p-5">
      {recommended && (
        <span className="absolute -top-2 right-3 bg-cyan-300/90 px-2 py-0.5 text-[9px] uppercase tracking-[0.32em] text-black">
          Recommandé pour démarrer
        </span>
      )}
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-sans text-lg font-light text-[#F5F5F7]">{name}</h3>
        <span className="font-mono text-[11px] text-cyan-200/85">{price}</span>
      </div>
      <ul className="flex flex-col gap-1">
        {pros.map((p, i) => (
          <li key={`p-${i}`} className="text-[12px] text-emerald-200/85">
            + {p}
          </li>
        ))}
        {cons.map((c, i) => (
          <li key={`c-${i}`} className="text-[12px] text-white/50">
            − {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bullet({
  children,
  ok,
}: {
  children: React.ReactNode;
  ok?: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
          ok ? "bg-emerald-300" : "bg-amber-300"
        }`}
        style={{ boxShadow: "0 0 6px currentColor" }}
      />
      <span>{children}</span>
    </li>
  );
}

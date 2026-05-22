import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getProjectTypeLabel } from "@/lib/project-types";
import { Button, Chip, Eyebrow, Hairline } from "@/lib/ds";
import { DeleteTemplateForm } from "./delete-button";

export const metadata: Metadata = {
  title: "Blueprints",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function TemplatesListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/templates");
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const { data: templates } = await admin
    .from("page_templates")
    .select("id, label, tagline, description, project_type, created_at, default_content")
    .order("created_at", { ascending: false });

  const list = templates ?? [];

  // Compte d'usage : combien de pages référencent chaque template.id ?
  // Une seule requête, on group côté JS.
  const usageById = new Map<string, number>();
  if (list.length > 0) {
    const { data: usageRows } = await admin
      .from("pages")
      .select("template_id")
      .in(
        "template_id",
        list.map((t) => t.id),
      );
    for (const row of usageRows ?? []) {
      usageById.set(row.template_id, (usageById.get(row.template_id) ?? 0) + 1);
    }
  }

  return (
    <div className="relative min-h-svh w-full overflow-hidden px-6 py-10 md:px-16 md:py-14">
      {/* Star field + scanlines + sabre vertical — thème Conseil Jedi */}
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
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors hover:text-cyan-100"
        >
          ← Forge
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Blueprints
        </span>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col gap-12 pt-20">
        <div className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/55">
            <Link
              href="/admin"
              className="transition-colors hover:text-cyan-100"
            >
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
            <span className="text-cyan-200/85">Blueprints</span>
          </p>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <h1
              className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
            >
              Les{" "}
              <span className="sw-hologram-text font-serif italic font-normal">
                Blueprints
              </span>
            </h1>

            <Button href="/admin/templates/new" variant="primary">
              + Forger un blueprint
            </Button>
          </div>

          <p className="max-w-xl text-balance font-serif text-base italic text-white/55 md:text-lg">
            Confie un parchemin HTML — la Force (Claude) en tire un blueprint
            éditable. Les blueprints peuvent être généraux ou liés à un type
            de mission précis.
          </p>

          <Eyebrow tracking="md" className="text-cyan-200/70">
            {list.length === 0
              ? "Aucun blueprint forgé pour le moment"
              : `${list.length} blueprint${list.length > 1 ? "s" : ""} forgé${list.length > 1 ? "s" : ""}`}
          </Eyebrow>
        </div>

        {list.length === 0 ? (
          <div className="relative flex flex-col items-start gap-8 pt-16">
            <div
              aria-hidden
              className="sw-hologram-line absolute inset-x-0 top-0"
            />
            <p className="max-w-md text-balance font-serif text-base italic text-white/55 md:text-lg">
              Aucun blueprint personnalisé en BDD. Les 5 presets ancestraux de
              la Force (parchemin blanc, présentation, moodboard, livrable,
              process) restent disponibles à la création de toute mission.
            </p>
            <Button href="/admin/templates/new" variant="large">
              Forger le premier blueprint
            </Button>
          </div>
        ) : (
          <ul className="relative flex flex-col">
            <div
              aria-hidden
              className="sw-hologram-line absolute inset-x-0 top-0"
            />
            {list.map((tpl, i) => {
              const formattedDate = new Date(tpl.created_at).toLocaleDateString(
                "fr-FR",
                { year: "numeric", month: "short", day: "numeric" },
              );
              const typeLabel = getProjectTypeLabel(tpl.project_type);
              const usageCount = usageById.get(tpl.id) ?? 0;
              const tplStyle =
                (tpl.default_content as { meta?: { style?: string } } | null)
                  ?.meta?.style ?? "document";
              const isRawHtml = tplStyle === "raw_html";
              return (
                <li
                  key={tpl.id}
                  className="relative flex flex-wrap items-baseline justify-between gap-x-10 gap-y-3 py-7"
                >
                  {/* hologram-line bottom sauf dernier */}
                  {i < list.length - 1 && (
                    <div
                      aria-hidden
                      className="sw-hologram-line absolute inset-x-0 bottom-0"
                    />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                      <h2 className="text-2xl font-light text-[#F5F5F7] md:text-3xl">
                        {tpl.label}
                      </h2>
                      {typeLabel ? (
                        <Chip tone="default">{typeLabel}</Chip>
                      ) : (
                        <Chip tone="muted">Toute mission</Chip>
                      )}
                      <Chip tone={isRawHtml ? "warning" : "muted"}>
                        {isRawHtml ? "Réplique fidèle" : "Forge ouverte"}
                      </Chip>
                    </div>
                    {tpl.tagline && (
                      <p className="font-serif text-sm italic text-white/65 md:text-base">
                        {tpl.tagline}
                      </p>
                    )}
                    {tpl.description && (
                      <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">
                        {tpl.description}
                      </p>
                    )}
                    <p className="font-mono text-[11px] text-white/35">
                      <span>{formattedDate}</span>
                      <span className="text-cyan-200/25"> · </span>
                      <span>
                        {(
                          ((tpl.default_content as { sections?: unknown[] }).sections ?? [])
                            .length
                        )}{" "}
                        section(s)
                      </span>
                      <span className="text-cyan-200/25"> · </span>
                      <span>
                        {usageCount === 0
                          ? "non engagé"
                          : `${usageCount} parchemin${usageCount > 1 ? "s" : ""}`}
                      </span>
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-6">
                    <Link
                      href={`/admin/templates/${tpl.id}`}
                      className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cyan-200/65 transition-colors hover:text-cyan-100"
                    >
                      <span>Affûter</span>
                      <Hairline width="sm" hover="lg" />
                    </Link>
                    <DeleteTemplateForm
                      templateId={tpl.id}
                      usageCount={usageCount}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center pt-4">
          <Button href="/admin/settings" variant="ghost">
            ← Retour Forge
          </Button>
        </div>
      </section>
    </div>
  );
}

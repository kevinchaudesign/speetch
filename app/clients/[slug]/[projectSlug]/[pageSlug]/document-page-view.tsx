"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import type { PageContent } from "@/types/database";
import { getProjectTypeLabel } from "@/lib/project-types";
import { Hairline } from "@/lib/ds";
import { PagesDropdown, type PageNavItem } from "./pages-dropdown";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Section = NonNullable<PageContent["sections"]>[number];

/**
 * Rendu "document" — utilisé pour les pages dont content.meta.style = "document".
 * Inspiré du brief de production Club Abrazo : papier crème, bordeaux,
 * Playfair italique. Le composant pose `.doc-mode-active` sur <body> pour
 * masquer la vignette/grain globaux et bascule la sélection en bordeaux.
 */
export function DocumentPageView({
  clientSlug,
  clientName,
  // projectName n'est pas affiché dans cette vue mais conservé dans
  // la signature pour rester drop-in avec les autres *PageView.
  projectName,
  projectSlug,
  projectType,
  pageName,
  pageSlug,
  content,
  prev,
  next,
  pages,
}: {
  clientSlug: string;
  clientName: string;
  projectSlug: string;
  projectName: string;
  projectType: string | null;
  pageName: string;
  pageSlug: string;
  content: PageContent;
  prev: { slug: string; name: string } | null;
  next: { slug: string; name: string } | null;
  pages: PageNavItem[];
}) {
  useEffect(() => {
    document.body.classList.add("doc-mode-active");
    return () => {
      document.body.classList.remove("doc-mode-active");
    };
  }, []);

  const intro = content.intro ?? null;
  const sections = content.sections ?? [];
  const projectTypeLabel = getProjectTypeLabel(projectType);
  void projectName; // prop reçu pour rester drop-in mais non affiché ici

  return (
    <div className="doc-page relative min-h-svh w-full">
      {/* Header sticky discret */}
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        className="sticky top-0 z-30 flex items-center justify-between gap-6 border-b border-[rgba(110,4,16,0.15)] bg-[rgba(248,241,224,0.9)] px-6 py-5 backdrop-blur md:px-12"
        style={{ borderBottomWidth: "0.5px" }}
      >
        <Link
          href={`/clients/${clientSlug}`}
          className="doc-link doc-eyebrow group inline-flex items-center gap-3"
          style={{ borderBottom: "none" }}
        >
          <Hairline width="md" hover="lg" />
          <span>{clientName}</span>
        </Link>
        <PagesDropdown
          clientSlug={clientSlug}
          projectSlug={projectSlug}
          currentSlug={pageSlug}
          pages={pages}
          theme="light"
        />
      </motion.header>

      {/* Document */}
      <article className="doc-frame mx-auto max-w-[860px] px-6 py-20 md:px-20 md:py-28">
        {/* Eyebrow + titre + sous-titre centrés */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
          className="flex flex-col items-center text-center"
        >
          <p className="doc-eyebrow">
            <span>{clientName}</span>
            {projectTypeLabel && (
              <>
                <span className="mx-3 opacity-40">·</span>
                <span>{projectTypeLabel}</span>
              </>
            )}
          </p>

          <h1
            className="doc-display mt-5 leading-[1.05]"
            style={{ fontSize: "clamp(2.25rem, 6vw, 3.5rem)" }}
          >
            <em>{pageName}</em>
          </h1>

          {intro && (
            <p
              className="doc-italic mt-5 max-w-xl text-balance"
              style={{ fontSize: "clamp(1rem, 1.8vw, 1.25rem)" }}
            >
              <em>{intro}</em>
            </p>
          )}

          <span aria-hidden className="mt-10 text-base text-[var(--doc-bordeaux-glow)]">
            ❦
          </span>
        </motion.div>

        {/* Sections */}
        {sections.length === 0 ? (
          <p className="doc-italic mt-20 text-center text-base opacity-60">
            Cette page n&apos;a pas encore de contenu.
          </p>
        ) : (
          <div className="mt-16 flex flex-col gap-16 md:mt-20 md:gap-20">
            {sections.map((section, i) => (
              <DocSection
                key={section.id ?? `${section.type}-${i}`}
                section={section}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Sceau de signature */}
        <div className="mt-24 flex flex-col items-center gap-3 md:mt-32">
          <span className="doc-sceau" aria-hidden>
            <em>S</em>
          </span>
          <span className="doc-italic text-sm">
            <em>Speetch · Paris</em>
          </span>
          <span className="doc-italic text-sm opacity-70">
            <em>Confidentiel — espace client</em>
          </span>
        </div>
      </article>

      {/* Navigation prev / next */}
      {(prev || next) && (
        <nav
          className="mx-auto grid max-w-[860px] grid-cols-1 gap-px border-t border-[rgba(110,4,16,0.15)] bg-[rgba(110,4,16,0.15)] md:grid-cols-2"
          style={{ borderTopWidth: "0.5px" }}
        >
          <DocNavLink
            label="Précédent"
            target={prev}
            clientSlug={clientSlug}
            projectSlug={projectSlug}
            align="left"
          />
          <DocNavLink
            label="Suivant"
            target={next}
            clientSlug={clientSlug}
            projectSlug={projectSlug}
            align="right"
          />
        </nav>
      )}

      {/* Footer */}
      <footer
        className="mx-auto flex max-w-[860px] items-baseline justify-between border-t border-[rgba(110,4,16,0.15)] px-6 py-10 text-[11px] uppercase tracking-[0.32em] text-[var(--doc-bordeaux-deep)] opacity-70 md:px-12"
        style={{ borderTopWidth: "0.5px" }}
      >
        <span>Paris · 2026</span>
        <span>Speetch</span>
      </footer>
    </div>
  );
}

function DocSection({
  section,
  index,
}: {
  section: Section;
  index: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
      className="flex flex-col gap-5"
    >
      {/* Numéro doré + titre Playfair italique */}
      {(section.title || index >= 0) && (
        <header className="flex flex-col gap-2">
          <span className="doc-num">{String(index + 1).padStart(2, "0")}</span>
          {section.title && (
            <h2
              className="doc-display leading-[1.1]"
              style={{ fontSize: "clamp(1.5rem, 3.2vw, 2.125rem)" }}
            >
              <em>{section.title}</em>
            </h2>
          )}
          <span className="doc-rule mt-2" aria-hidden />
        </header>
      )}

      {section.type === "text" && section.body && (
        <DocBody text={section.body} />
      )}

      {section.type === "image" && section.media?.[0] && (
        <figure>
          <div className="relative w-full overflow-hidden">
            <Image
              src={section.media[0].url}
              alt={section.media[0].caption ?? section.title ?? ""}
              width={section.media[0].width ?? 1920}
              height={section.media[0].height ?? 1080}
              className="h-auto w-full object-cover"
              sizes="(min-width: 900px) 760px, 100vw"
            />
          </div>
          {section.media[0].caption && (
            <figcaption className="doc-italic mt-3 text-sm opacity-75">
              <em>{section.media[0].caption}</em>
            </figcaption>
          )}
        </figure>
      )}

      {section.type === "video" && section.media?.[0] && (
        <figure>
          <video
            src={section.media[0].url}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full bg-[rgba(110,4,16,0.08)]"
          />
          {section.media[0].caption && (
            <figcaption className="doc-italic mt-3 text-sm opacity-75">
              <em>{section.media[0].caption}</em>
            </figcaption>
          )}
        </figure>
      )}

      {section.type === "embed" && section.embedUrl && (
        <div className="relative aspect-video w-full overflow-hidden bg-[rgba(110,4,16,0.06)]">
          <iframe
            src={section.embedUrl}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            className="absolute inset-0 h-full w-full"
            title={section.title ?? "Contenu intégré"}
          />
        </div>
      )}

      {section.type === "gallery" &&
        section.media &&
        section.media.length > 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {section.media.map((m, i) => (
              <figure key={`${m.url}-${i}`}>
                <div className="relative w-full overflow-hidden">
                  <Image
                    src={m.url}
                    alt={m.caption ?? `${section.title ?? "Image"} ${i + 1}`}
                    width={m.width ?? 1280}
                    height={m.height ?? 960}
                    className="h-auto w-full object-cover"
                    sizes="(min-width: 900px) 380px, 100vw"
                  />
                </div>
                {m.caption && (
                  <figcaption className="doc-italic mt-2 text-sm opacity-75">
                    <em>{m.caption}</em>
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
    </motion.section>
  );
}

/**
 * Rend un body texte avec mise en forme légère :
 * - Sépare par "\n\n" en paragraphes
 * - Détecte "Label: valeur" ou "• puce" et stylise
 * - Citations entre guillemets ou italiques marquées par Cormorant italique
 */
function DocBody({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      {paragraphs.map((para, i) => {
        const isBulletBlock = /^[•\-–*]\s/.test(para) || /\n[•\-–*]\s/.test(para);
        if (isBulletBlock) {
          const items = para
            .split(/\n+/)
            .map((line) => line.replace(/^[•\-–*]\s*/, "").trim())
            .filter(Boolean);
          return (
            <ul
              key={i}
              className="doc-body flex flex-col gap-2 pl-5"
              style={{ listStyleType: "'– '" }}
            >
              {items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="doc-body max-w-3xl whitespace-pre-line">
            {renderInline(para)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Met en italique Cormorant les passages entre « … » ou entre _…_ pour
 * marquer la voix éditoriale, sans toucher au reste du texte.
 */
function renderInline(text: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  const regex = /«\s([^»]+?)\s»|_([^_\n]+?)_/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const inner = match[1] ?? match[2] ?? "";
    nodes.push(
      <em key={key++} className="doc-italic">
        {match[1] ? `« ${inner} »` : inner}
      </em>,
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes.length === 0 ? text : nodes;
}

function DocNavLink({
  label,
  target,
  clientSlug,
  projectSlug,
  align,
}: {
  label: string;
  target: { slug: string; name: string } | null;
  clientSlug: string;
  projectSlug: string;
  align: "left" | "right";
}) {
  if (!target) {
    return <div className="bg-[var(--doc-paper)] px-6 py-10 md:px-10 md:py-14" />;
  }
  return (
    <Link
      href={`/clients/${clientSlug}/${projectSlug}/${target.slug}`}
      className={`group flex flex-col gap-3 bg-[var(--doc-paper)] px-6 py-10 transition-colors hover:bg-[rgba(110,4,16,0.04)] md:px-10 md:py-14 ${
        align === "right" ? "items-end text-right" : "items-start text-left"
      }`}
    >
      <span className="doc-eyebrow">{label}</span>
      <span
        className="doc-display leading-[1.05]"
        style={{ fontSize: "clamp(1.25rem, 2.6vw, 1.875rem)" }}
      >
        <em>{target.name}</em>
      </span>
      <span aria-hidden className="doc-rule" />
    </Link>
  );
}

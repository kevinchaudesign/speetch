"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { PageContent } from "@/types/database";
import { getProjectTypeLabel } from "@/lib/project-types";
import { Hairline } from "@/lib/ds";
import { PagesDropdown, type PageNavItem } from "./pages-dropdown";
import { CodeBlock } from "./_code/code-block";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Section = NonNullable<PageContent["sections"]>[number];

export function PublicPageView({
  clientSlug,
  clientName,
  projectSlug,
  projectName,
  projectType,
  pageName,
  pageSlug,
  content,
  prev,
  next,
  pages,
  highlightedCode = {},
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
  highlightedCode?: Record<string, string>;
}) {
  const intro = content.intro ?? null;
  const sections = content.sections ?? [];
  const projectTypeLabel = getProjectTypeLabel(projectType);

  return (
    <div className="relative min-h-svh w-full">
      {/* Header sticky avec breadcrumb */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        className="sticky top-0 z-30 flex items-center justify-between gap-6 border-b border-white/5 bg-black/65 px-6 py-5 backdrop-blur-md md:px-12"
      >
        <Link
          href={`/clients/${clientSlug}`}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-white/55 transition-colors hover:text-white"
        >
          <Hairline width="md" hover="lg" />
          <span>{clientName}</span>
        </Link>
        <PagesDropdown
          clientSlug={clientSlug}
          projectSlug={projectSlug}
          currentSlug={pageSlug}
          pages={pages}
          theme="dark"
        />
      </motion.header>

      {/* Hero page */}
      <section className="px-6 pt-20 md:px-12 md:pt-28">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-[11px] uppercase tracking-[0.4em] text-white/40"
        >
          <Link
            href={`/clients/${clientSlug}`}
            className="transition-colors hover:text-white/70"
          >
            {clientName}
          </Link>
          <span className="mx-3 text-white/20">→</span>
          <span className="text-white/55">{projectName}</span>
          {projectTypeLabel && (
            <>
              <span className="mx-3 text-white/20">·</span>
              <span className="text-white/55">{projectTypeLabel}</span>
            </>
          )}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="mt-6 font-sans font-extralight leading-[0.86] tracking-[-0.04em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}
        >
          {pageName}
        </motion.h1>

        {intro && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: EASE_OUT_EXPO }}
            className="mt-12 max-w-3xl text-balance text-lg font-light leading-relaxed text-white/75 md:text-xl md:leading-relaxed"
          >
            {intro}
          </motion.p>
        )}
      </section>

      {/* Sections */}
      {sections.length === 0 ? (
        <section className="mt-20 border-t border-white/10 px-6 py-20 md:mt-28 md:px-12">
          <p className="max-w-md text-balance font-serif text-base italic text-white/40 md:text-lg">
            Cette page n&apos;a pas encore de contenu.
          </p>
        </section>
      ) : (
        <div className="mt-20 flex flex-col gap-20 px-6 md:mt-28 md:gap-28 md:px-12">
          {sections.map((section, i) => {
            if (section.type === "container") {
              return (
                <motion.section
                  key={section.id ?? `container-${i}`}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
                  className="flex flex-col gap-12"
                >
                  {section.title && (
                    <h2
                      className="font-sans font-extralight leading-[0.95] tracking-[-0.03em] text-[#F5F5F7]"
                      style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)" }}
                    >
                      {section.title}
                    </h2>
                  )}
                  {(section.children ?? []).map((child) => (
                    <SectionBlock
                      key={child.id}
                      section={child as Section}
                      highlightedHtml={highlightedCode[child.id ?? ""]}
                    />
                  ))}
                </motion.section>
              );
            }
            return (
              <SectionBlock
                key={section.id ?? `${section.type}-${i}`}
                section={section}
                highlightedHtml={highlightedCode[section.id ?? ""]}
              />
            );
          })}
        </div>
      )}

      {/* Navigation prev / next */}
      {(prev || next) && (
        <nav className="mt-20 grid grid-cols-1 gap-px overflow-hidden border-t border-white/10 bg-white/[0.06] md:mt-28 md:grid-cols-2">
          <PageNavLink
            label="Précédent"
            target={prev}
            clientSlug={clientSlug}
            projectSlug={projectSlug}
            align="left"
          />
          <PageNavLink
            label="Suivant"
            target={next}
            clientSlug={clientSlug}
            projectSlug={projectSlug}
            align="right"
          />
        </nav>
      )}

      {/* Footer */}
      <footer className="flex items-end justify-between border-t border-white/10 px-6 py-8 text-[11px] uppercase tracking-[0.28em] text-white/40 md:px-12">
        <span>Paris · 2026</span>
        <span>Speetch · Confidentiel</span>
      </footer>
    </div>
  );
}

function PageNavLink({
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
    return <div className="bg-black px-6 py-10 md:px-12 md:py-14" />;
  }
  return (
    <Link
      href={`/clients/${clientSlug}/${projectSlug}/${target.slug}`}
      className={`group flex flex-col gap-4 bg-black px-6 py-10 transition-colors hover:bg-white/[0.03] md:px-12 md:py-14 ${
        align === "right" ? "items-end text-right" : "items-start text-left"
      }`}
    >
      <span className="text-[11px] uppercase tracking-[0.32em] text-white/40">
        {label}
      </span>
      <span
        className="font-sans font-extralight leading-[0.95] tracking-[-0.03em] text-white/80 transition-colors group-hover:text-[#F5F5F7]"
        style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
      >
        {target.name}
      </span>
      <Hairline width="lg" hover="xl" className="bg-white/40" />
    </Link>
  );
}

function SectionBlock({
  section,
  highlightedHtml,
}: {
  section: Section;
  highlightedHtml?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
      className="flex flex-col gap-8"
    >
      {section.title && (
        <h2
          className="font-sans font-extralight leading-[0.95] tracking-[-0.03em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)" }}
        >
          {section.title}
        </h2>
      )}

      {section.type === "text" && section.body && (
        <p className="max-w-3xl whitespace-pre-line text-balance text-lg font-light leading-relaxed text-white/75 md:text-xl md:leading-relaxed">
          {section.body}
        </p>
      )}

      {section.type === "image" && section.media?.[0] && (
        <figure>
          <div className="relative w-full overflow-hidden bg-white/[0.03]">
            <Image
              src={section.media[0].url}
              alt={section.media[0].caption ?? section.title ?? ""}
              width={section.media[0].width ?? 1920}
              height={section.media[0].height ?? 1080}
              className="h-auto w-full object-cover"
              sizes="(min-width: 1280px) 1280px, 100vw"
            />
          </div>
          {section.media[0].caption && (
            <figcaption className="mt-4 text-[11px] uppercase tracking-[0.32em] text-white/40">
              {section.media[0].caption}
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
            className="aspect-video w-full bg-white/[0.03]"
          />
          {section.media[0].caption && (
            <figcaption className="mt-4 text-[11px] uppercase tracking-[0.32em] text-white/40">
              {section.media[0].caption}
            </figcaption>
          )}
        </figure>
      )}

      {section.type === "embed" && section.embedUrl && (
        <div className="relative aspect-video w-full overflow-hidden bg-white/[0.03]">
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {section.media.map((m, i) => (
              <figure key={`${m.url}-${i}`}>
                <div className="relative w-full overflow-hidden bg-white/[0.03]">
                  <Image
                    src={m.url}
                    alt={m.caption ?? `${section.title ?? "Image"} ${i + 1}`}
                    width={m.width ?? 1280}
                    height={m.height ?? 960}
                    className="h-auto w-full object-cover"
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                </div>
                {m.caption && (
                  <figcaption className="mt-3 text-[11px] uppercase tracking-[0.32em] text-white/40">
                    {m.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}

      {section.type === "code" && section.code && (
        <CodeBlock
          html={highlightedHtml ?? ""}
          code={section.code}
          language={section.language}
          variant="dark"
        />
      )}
    </motion.section>
  );
}

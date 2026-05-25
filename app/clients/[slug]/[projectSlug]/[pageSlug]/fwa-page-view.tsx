"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import Link from "next/link";
import { forwardRef, useEffect, useRef, useState } from "react";
import type { PageContent } from "@/types/database";
import { getProjectTypeLabel } from "@/lib/project-types";
import { Eyebrow, Hairline, Sceau } from "@/lib/ds";
import { PagesDropdown, type PageNavItem } from "./pages-dropdown";
import { CodeBlock } from "./_code/code-block";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Section = NonNullable<PageContent["sections"]>[number];

type NavTarget = { slug: string; name: string } | null;

/**
 * Rendu "FWA Grade" — utilisé quand content.meta.style === "fwa".
 * Lit le contenu structuré (intro + sections) et le rend dans une esthétique
 * monumentale : palette Speetch (#000 / #F5F5F7), typo Inter ExtraLight +
 * Fraunces italique, custom cursor, scroll progress, index sticky, reveal
 * sur scroll, sceau de signature.
 *
 * Compatible avec l'éditeur PageEditor standard : le owner peut modifier
 * intro/sections normalement, le rendu reste FWA.
 */
export function FwaPageView({
  clientSlug,
  clientName,
  projectName,
  projectType,
  pageName,
  pageSlug,
  content,
  prev,
  next,
  projectSlug,
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
  prev: NavTarget;
  next: NavTarget;
  pages: PageNavItem[];
  highlightedCode?: Record<string, string>;
}) {
  const sections = content.sections ?? [];
  const intro = content.intro ?? "";
  const projectTypeLabel = getProjectTypeLabel(projectType);

  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeChapter, setActiveChapter] = useState(-1);

  // Cursor follow
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [cursorEnabled, setCursorEnabled] = useState(false);

  useEffect(() => {
    // Désactive le custom cursor sur touch screens
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches
    ) {
      setCursorEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!cursorEnabled) return;
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    function onMove(e: MouseEvent) {
      mx = e.clientX;
      my = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      }
    }
    function tick() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    }
    window.addEventListener("mousemove", onMove);
    tick();
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [cursorEnabled]);

  // Active chapter detection (index sticky)
  useEffect(() => {
    function onScroll() {
      const probe = window.scrollY + window.innerHeight * 0.35;
      let active = -1;
      for (let i = 0; i < chapterRefs.current.length; i++) {
        const el = chapterRefs.current[i];
        if (!el) continue;
        if (el.offsetTop <= probe) active = i;
        else break;
      }
      setActiveChapter(active);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Progress bar (top)
  const { scrollYProgress } = useScroll();
  const progressX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 40,
    restDelta: 0.001,
  });

  return (
    <div className={cursorEnabled ? "fwa-page fwa-cursor-on" : "fwa-page"}>
      <style jsx global>{`
        body:has(.fwa-page.fwa-cursor-on) { cursor: none; }
        body:has(.fwa-page.fwa-cursor-on) a,
        body:has(.fwa-page.fwa-cursor-on) button { cursor: none; }
        @media (pointer: coarse) {
          body:has(.fwa-page) { cursor: auto; }
        }
        @keyframes fwaScrollLine {
          0%, 100% { transform: scaleX(0.45); transform-origin: left; opacity: 0.3; }
          50% { transform: scaleX(1); opacity: 0.75; }
        }
        .fwa-page .fwa-scroll-cue { animation: fwaScrollLine 2.4s ease-in-out infinite; }
      `}</style>

      {/* Custom cursor */}
      {cursorEnabled && (
        <>
          <div
            ref={cursorRef}
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-[120] h-[6px] w-[6px] rounded-full bg-[#F5F5F7]"
            style={{ mixBlendMode: "difference" }}
          />
          <div
            ref={ringRef}
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-[120] h-10 w-10 rounded-full border border-[rgba(245,245,247,0.5)] transition-[width,height] duration-500"
            style={{ mixBlendMode: "difference" }}
          />
        </>
      )}

      {/* Top progress bar */}
      <motion.div
        aria-hidden
        className="fixed left-0 top-0 z-[70] h-px bg-[#F5F5F7] origin-left"
        style={{ scaleX: progressX, width: "100%" }}
      />

      {/* Top brand strip */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex items-center justify-between px-6 py-5 text-[10px] uppercase tracking-[0.4em] text-white/45 md:px-12">
        <Link
          href={`/clients/${clientSlug}`}
          className="pointer-events-auto group inline-flex items-center gap-3 transition-colors hover:text-white"
        >
          <Hairline width="md" hover="lg" />
          <span>{clientName}</span>
        </Link>
        <span className="hidden md:inline">
          {projectName}
          <span className="mx-3 text-white/20">·</span>
          {pageName}
        </span>
        <span className="pointer-events-auto">
          <PagesDropdown
            clientSlug={clientSlug}
            projectSlug={projectSlug}
            currentSlug={pageSlug}
            pages={pages}
            theme="dark"
          />
        </span>
      </header>

      {/* Index */}
      {sections.length > 1 && (
        <nav
          aria-label="Sommaire"
          className="fixed left-6 top-1/2 z-[40] hidden -translate-y-1/2 flex-col gap-3 text-[10px] uppercase tracking-[0.28em] xl:flex"
        >
          {sections.map((s, i) => {
            const { num, title } = parseChapterTitle(s.title, i);
            const isActive = i === activeChapter;
            return (
              <a
                key={s.id ?? i}
                href={`#chapter-${i}`}
                className={`group inline-flex items-center gap-3 transition-colors ${
                  isActive ? "text-[#F5F5F7]" : "text-white/30 hover:text-white"
                }`}
              >
                <span
                  className={`inline-block h-px bg-current transition-all duration-500 ease-out ${
                    isActive ? "w-10" : "w-4 group-hover:w-8"
                  }`}
                />
                <span className="font-mono">{num}</span>
                <span className="max-w-[14ch] truncate">{title}</span>
              </a>
            );
          })}
        </nav>
      )}

      {/* HERO */}
      <section className="relative flex min-h-svh flex-col justify-between px-6 pb-12 pt-32 md:px-12 md:pb-16 md:pt-40">
        <div className="flex flex-col gap-6">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="text-[11px] uppercase tracking-[0.4em] text-white/45"
          >
            <span>{clientName}</span>
            {projectTypeLabel && (
              <>
                <span className="mx-3 text-white/20">·</span>
                <span>{projectTypeLabel}</span>
              </>
            )}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.15, ease: EASE }}
            className="font-sans font-extralight leading-[0.82] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(3.5rem, 14vw, 12rem)" }}
          >
            <HeroTitle text={pageName} />
          </motion.h1>

          {intro && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.45, ease: EASE }}
              className="mt-8 max-w-[36ch] font-serif italic text-balance leading-snug text-white/75"
              style={{ fontSize: "clamp(1.125rem, 1.8vw, 1.5rem)" }}
            >
              {intro}
            </motion.p>
          )}
        </div>

        {/* Stats — count of sections + project meta */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-24 grid grid-cols-2 gap-x-12 gap-y-6 border-t border-white/10 pt-6 md:mt-32 md:grid-cols-4"
        >
          <Stat label="Projet" value={projectName} />
          {projectTypeLabel && <Stat label="Type" value={projectTypeLabel} />}
          <Stat
            label="Chapitres"
            value={String(sections.length).padStart(2, "0")}
          />
          <Stat label="Édition" value="FWA" italic />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="mt-12 flex items-center gap-4 text-[10px] uppercase tracking-[0.36em] text-white/40"
        >
          <span className="fwa-scroll-cue block h-px w-12 bg-current" />
          <span>Faire défiler</span>
        </motion.div>
      </section>

      {/* CHAPTERS */}
      {sections.map((section, i) => (
        <Chapter
          key={section.id ?? `s-${i}`}
          ref={(el) => {
            chapterRefs.current[i] = el;
          }}
          index={i}
          total={sections.length}
          section={section}
          highlightedHtml={highlightedCode[section.id ?? ""]}
        />
      ))}

      {/* SCEAU */}
      <motion.footer
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 1.1, ease: EASE }}
        className="flex flex-col items-center gap-4 border-t border-white/10 px-6 py-32 text-center md:px-12 md:py-40"
      >
        <Sceau letter="A" size="xl" />
        <Eyebrow tracking="lg" intensity="default" className="mt-3 text-white/45">
          {clientName} · Paris
        </Eyebrow>
        <span className="max-w-[32ch] font-serif text-base italic text-white/65 md:text-lg">
          <em>Brief tenu. Reste à le mettre en ondes.</em>
        </span>
      </motion.footer>

      {/* Prev / Next */}
      {(prev || next) && (
        <nav className="mt-0 grid grid-cols-1 gap-px border-t border-white/10 bg-white/10 md:grid-cols-2">
          <NavCell
            label="Précédent"
            target={prev}
            clientSlug={clientSlug}
            projectSlug={projectSlug}
            align="left"
          />
          <NavCell
            label="Suivant"
            target={next}
            clientSlug={clientSlug}
            projectSlug={projectSlug}
            align="right"
          />
        </nav>
      )}

      <footer className="flex items-end justify-between border-t border-white/10 px-6 py-8 text-[11px] uppercase tracking-[0.28em] text-white/40 md:px-12">
        <span>Paris · 2026</span>
        <span>Speetch · Confidentiel</span>
      </footer>
    </div>
  );
}

/**
 * Hero title : sépare le texte sur le dernier mot pour le mettre en Fraunces
 * italique (effet "Brief / de production." du source FWA).
 */
function HeroTitle({ text }: { text: string }) {
  const trimmed = text.trim();
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace < 0 || trimmed.length < 8) {
    return <span>{trimmed}.</span>;
  }
  const head = trimmed.slice(0, lastSpace);
  const tail = trimmed.slice(lastSpace + 1);
  return (
    <>
      <span className="block">{head}</span>
      <span className="block font-serif font-light italic text-white/85">
        {tail}.
      </span>
    </>
  );
}

function Stat({
  label,
  value,
  italic,
}: {
  label: string;
  value: string;
  italic?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] uppercase tracking-[0.36em] text-white/45">
        {label}
      </span>
      <span
        className={`font-sans font-extralight leading-none tracking-[-0.03em] text-[#F5F5F7] ${italic ? "font-serif italic" : ""}`}
        style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Chapter ───────────────────────────────────────────────────────────────

type ChapterProps = {
  index: number;
  total: number;
  section: Section;
  highlightedHtml?: string;
};

const Chapter = forwardRef<HTMLElement, ChapterProps>(function Chapter(
  { index, section, total, highlightedHtml },
  ref,
) {
  const { num, title } = parseChapterTitle(section.title, index);
  return (
    <motion.section
      ref={ref as React.Ref<HTMLDivElement>}
      id={`chapter-${index}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 1.1, ease: EASE }}
      className="relative border-t border-white/10 px-6 py-32 md:px-12 md:py-48"
    >
      <Eyebrow tracking="lg" intensity="default" as="p" className="text-white/45">
        Chapitre {num} / {String(total).padStart(2, "0")}
      </Eyebrow>

      <div className="mt-12 grid grid-cols-1 gap-12 md:gap-24 lg:grid-cols-[200px_1fr] lg:gap-24">
        <span
          className="font-serif font-extralight italic leading-[0.85] tracking-[-0.04em] text-white/85"
          style={{ fontSize: "clamp(4rem, 12vw, 9rem)" }}
        >
          {num}
        </span>
        <h2
          className="font-sans font-extralight leading-[1.02] tracking-[-0.045em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
        >
          <ChapterTitle text={title} />
        </h2>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-12 md:gap-24 lg:grid-cols-[200px_1fr]">
        <aside className="hidden lg:block">
          <span className="block border-t border-white/10 pt-3 text-[10px] uppercase tracking-[0.36em] text-white/45">
            {section.type === "text" ? "Lecture" : section.type}
          </span>
        </aside>

        <div className="flex max-w-[64ch] flex-col gap-6">
          <SectionBody section={section} highlightedHtml={highlightedHtml} />
        </div>
      </div>
    </motion.section>
  );
});

/**
 * Sépare "00 · Place de Meta dans le tunnel complet" en num="00" + title="…".
 * Fallback : index padded sur 2 chiffres.
 */
function parseChapterTitle(
  rawTitle: string | undefined,
  fallbackIndex: number,
): { num: string; title: string } {
  const fallback = String(fallbackIndex).padStart(2, "0");
  if (!rawTitle) return { num: fallback, title: "" };
  const match = rawTitle.match(/^\s*(\d{1,2})\s*[·.\-—–:]\s*(.+)$/);
  if (match) return { num: match[1].padStart(2, "0"), title: match[2].trim() };
  return { num: fallback, title: rawTitle.trim() };
}

/**
 * Met en italique Fraunces le dernier mot du titre du chapitre pour
 * l'effet "titre · accent" Speetch.
 */
function ChapterTitle({ text }: { text: string }) {
  const t = text.trim();
  if (t.length < 6) return <span>{t}.</span>;
  const lastSpace = t.lastIndexOf(" ");
  if (lastSpace < 0) return <span>{t}.</span>;
  const head = t.slice(0, lastSpace);
  const tail = t.slice(lastSpace + 1);
  return (
    <>
      <span>{head} </span>
      <em className="font-serif font-light not-italic">
        <em className="italic text-white/85">{tail}.</em>
      </em>
    </>
  );
}

/**
 * Rendu du contenu d'une section. Supporte text/image/video/embed/gallery.
 * Pour `text` : split en paragraphes, et détection légère de blocs
 * pseudo-tableau (lignes "Label : valeur").
 */
function SectionBody({
  section,
  highlightedHtml,
}: {
  section: Section;
  highlightedHtml?: string;
}) {
  if (section.type === "text" && section.body) {
    return <TextBody body={section.body} />;
  }

  if (section.type === "code" && section.code) {
    return (
      <CodeBlock
        html={highlightedHtml ?? ""}
        code={section.code}
        language={section.language}
        variant="dark"
      />
    );
  }

  if (section.type === "image" && section.media?.[0]) {
    const m = section.media[0];
    return (
      <figure className="space-y-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={m.url}
          alt={m.caption ?? ""}
          className="h-auto w-full bg-white/[0.03] object-cover"
          loading="lazy"
        />
        {m.caption && (
          <figcaption className="text-[11px] uppercase tracking-[0.32em] text-white/45">
            {m.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (section.type === "video" && section.media?.[0]) {
    const m = section.media[0];
    return (
      <figure className="space-y-3">
        <video
          src={m.url}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-white/[0.03]"
        />
        {m.caption && (
          <figcaption className="text-[11px] uppercase tracking-[0.32em] text-white/45">
            {m.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (section.type === "embed" && section.embedUrl) {
    return (
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
    );
  }

  if (section.type === "gallery" && section.media && section.media.length > 0) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {section.media.map((m, i) => (
          <figure key={`${m.url}-${i}`} className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.url}
              alt={m.caption ?? ""}
              className="h-auto w-full bg-white/[0.03] object-cover"
              loading="lazy"
            />
            {m.caption && (
              <figcaption className="text-[11px] uppercase tracking-[0.32em] text-white/45">
                {m.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    );
  }

  return null;
}

/**
 * Découpe un body texte en paragraphes (séparés par \n\n) et stylise.
 * Patterns détectés :
 *  - Bloc bullet : ≥2 lignes commençant par • / - / —
 *  - Bloc "Label : valeur" répétés → mini grille définition
 *  - Paragraphe normal
 */
function TextBody({ body }: { body: string }) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      {paragraphs.map((p, i) => {
        const lines = p.split(/\n/);
        const bulletLines = lines.filter((l) => /^\s*[•\-–—*]\s+/.test(l));
        if (bulletLines.length >= 2 && bulletLines.length === lines.length) {
          return (
            <ul
              key={i}
              className="flex flex-col gap-3 text-[15px] leading-relaxed text-white/75 md:text-base"
            >
              {lines.map((line, j) => (
                <li key={j} className="flex gap-4">
                  <span className="mt-2 inline-block h-px w-3 shrink-0 bg-white/45" />
                  <span>{renderInline(line.replace(/^\s*[•\-–—*]\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }

        const defLines = lines.filter((l) => /^[^:]{2,30}\s*:\s+/.test(l));
        if (defLines.length >= 2 && defLines.length === lines.length) {
          return (
            <dl
              key={i}
              className="grid grid-cols-1 gap-3 border-t border-white/10 pt-4 md:grid-cols-[160px_1fr] md:gap-x-8 md:gap-y-4"
            >
              {lines.map((line, j) => {
                const idx = line.indexOf(":");
                const label = line.slice(0, idx).trim();
                const value = line.slice(idx + 1).trim();
                return (
                  <div
                    key={j}
                    className="contents md:contents"
                  >
                    <dt className="text-[10px] uppercase tracking-[0.36em] text-white/45">
                      {label}
                    </dt>
                    <dd className="text-[15px] leading-relaxed text-white/80 md:text-base">
                      {renderInline(value)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          );
        }

        return (
          <p
            key={i}
            className="whitespace-pre-line text-[15px] leading-relaxed text-white/75 md:text-base md:leading-[1.7]"
          >
            {renderInline(p)}
          </p>
        );
      })}
    </>
  );
}

/**
 * Italique Fraunces sur les passages entre « … » ou _…_ pour la voix
 * éditoriale.
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
      <em
        key={key++}
        className="font-serif font-light italic text-white/90"
      >
        {match[1] ? `« ${inner} »` : inner}
      </em>,
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes.length === 0 ? text : nodes;
}

function NavCell({
  label,
  target,
  clientSlug,
  projectSlug,
  align,
}: {
  label: string;
  target: NavTarget;
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
      className={`group flex flex-col gap-3 bg-black px-6 py-10 transition-colors hover:bg-white/[0.03] md:px-12 md:py-14 ${
        align === "right" ? "items-end text-right" : "items-start text-left"
      }`}
    >
      <span className="text-[10px] uppercase tracking-[0.36em] text-white/45">
        {label}
      </span>
      <span
        className="font-sans font-extralight leading-[1.05] tracking-[-0.03em] text-[#F5F5F7]"
        style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
      >
        {target.name}
      </span>
      <Hairline width="lg" hover="xl" className="bg-white/45" />
    </Link>
  );
}

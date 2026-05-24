import Link from "next/link";
import { AurebeshMark } from "../aurebesh-mark";

export function LandingFooter() {
  return (
    <footer
      aria-label="Pied de page Speetch"
      className="relative w-full border-t border-cyan-200/10 px-6 py-12 md:px-12 md:py-16"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/45">
              Studio
            </span>
            <span className="text-[13px] text-white/75">Speetch</span>
            <span className="text-[12px] text-white/45">
              Paris · Île-de-France
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/45">
              Contact
            </span>
            <a
              href="mailto:hello@speetch.com"
              className="text-[13px] text-white/75 transition-colors hover:text-cyan-100"
            >
              hello@speetch.com
            </a>
          </div>

          <nav
            aria-label="Navigation pied de page"
            className="flex flex-col gap-3"
          >
            <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/45">
              Sections
            </span>
            <a
              href="#approche"
              className="text-[13px] text-white/75 transition-colors hover:text-cyan-100"
            >
              Approche
            </a>
            <a
              href="#disciplines"
              className="text-[13px] text-white/75 transition-colors hover:text-cyan-100"
            >
              Disciplines
            </a>
            <a
              href="#clients"
              className="text-[13px] text-white/75 transition-colors hover:text-cyan-100"
            >
              Clients
            </a>
            <a
              href="#a-propos"
              className="text-[13px] text-white/75 transition-colors hover:text-cyan-100"
            >
              À propos
            </a>
            <a
              href="#contact"
              className="text-[13px] text-white/75 transition-colors hover:text-cyan-100"
            >
              Contact
            </a>
          </nav>

          <div className="flex flex-col gap-3">
            <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/45">
              Espaces
            </span>
            <Link
              href="/clients"
              className="text-[13px] text-white/75 transition-colors hover:text-cyan-100"
            >
              Espaces clients
            </Link>
            <Link
              href="/login"
              className="text-[13px] text-white/55 transition-colors hover:text-cyan-100"
            >
              Connexion admin
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-cyan-200/10 pt-8">
          <AurebeshMark size={12} />
          <p className="text-[10px] uppercase tracking-[0.32em] text-white/40">
            © 2026 Speetch · Tous droits réservés
          </p>
        </div>
      </div>
    </footer>
  );
}

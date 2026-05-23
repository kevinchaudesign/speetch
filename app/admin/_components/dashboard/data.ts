/**
 * Récupération + agrégation des données du dashboard cockpit.
 *
 * Concentre toutes les queries pour /admin en un seul endroit, calcule
 * les buckets 30j et les agrégats prêts à afficher. Renvoie une struct
 * sérialisable que les composants graphiques consomment.
 */

import { createAdminClient } from "@/lib/supabase/server";
import {
  PADAWAN_STATUS_LABEL,
  PADAWAN_STATUS_TONE,
  PADAWAN_STATUS_VALUES,
  isPadawanStatus,
  type PadawanStatus,
} from "@/lib/crm";

export type CockpitData = {
  holocrons: { total: number; spark: number[]; last30: number };
  missions: { total: number; spark: number[]; last30: number };
  padawans: { total: number; spark: number[]; last30: number };
  transmissions: {
    total: number;
    spark: number[];
    last30: number;
    recipientsTotal: number;
    deliveredTotal: number;
    failedTotal: number;
    deliveryRate: number; // 0..1
  };
  funnel: Array<{
    status: PadawanStatus;
    label: string;
    tone: "info" | "neutral" | "warning" | "success" | "danger";
    count: number;
  }>;
  adoubement: {
    /** Taux d'adoubement = won / (won + lost). 0..1. */
    rate: number;
    won: number;
    lost: number;
  };
  transmissions30: number[]; // 30 buckets quotidiens (envois)
  activity: ActivityEvent[];
};

export type ActivityEvent = {
  /** Discriminant pour le style visuel. */
  kind: "holocron" | "padawan" | "transmission";
  title: string;
  detail: string | null;
  at: string; // ISO date
  href: string | null;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Bucketise une liste de dates ISO en N jours consécutifs (du plus
 * ancien au plus récent). Renvoie le tableau de comptes (longueur N).
 * Les dates en dehors de la fenêtre sont ignorées.
 */
export function bucketByDay(isoDates: string[], days: number): number[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const buckets = new Array<number>(days).fill(0);
  for (const iso of isoDates) {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) continue;
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    const diff = Math.floor((now.getTime() - d.getTime()) / ONE_DAY_MS);
    if (diff < 0 || diff >= days) continue;
    buckets[days - 1 - diff]++;
  }
  return buckets;
}

export async function loadCockpitData(): Promise<CockpitData> {
  const admin = createAdminClient();
  const since30dIso = new Date(Date.now() - 30 * ONE_DAY_MS).toISOString();

  const [
    profilesRes,
    projectsRes,
    padawansRes,
    transmissionsRes,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, slug, created_at")
      .eq("is_owner", false)
      .order("created_at", { ascending: false }),
    admin
      .from("projects")
      .select("id, name, profile_id, created_at, is_published")
      .order("created_at", { ascending: false }),
    admin
      .from("crm_padawans" as never)
      .select("id, full_name, status, created_at")
      .order("created_at", { ascending: false })
      .returns<
        Array<{
          id: string;
          full_name: string;
          status: string;
          created_at: string;
        }>
      >(),
    admin
      .from("crm_transmissions" as never)
      .select(
        "id, subject, status, recipient_count, delivered_count, failed_count, created_at, sent_at",
      )
      .order("created_at", { ascending: false })
      .returns<
        Array<{
          id: string;
          subject: string;
          status: string;
          recipient_count: number;
          delivered_count: number;
          failed_count: number;
          created_at: string;
          sent_at: string | null;
        }>
      >(),
  ]);

  const profiles = profilesRes.data ?? [];
  const projects = projectsRes.data ?? [];
  const padawans = padawansRes.data ?? [];
  const transmissions = transmissionsRes.data ?? [];

  // KPI cards
  const holocronsSpark = bucketByDay(
    profiles.map((p) => p.created_at),
    30,
  );
  const missionsSpark = bucketByDay(
    projects.map((p) => p.created_at),
    30,
  );
  const padawansSpark = bucketByDay(
    padawans.map((p) => p.created_at),
    30,
  );
  const transmissionsSpark = bucketByDay(
    transmissions.map((t) => t.sent_at ?? t.created_at),
    30,
  );

  const since30 = Date.parse(since30dIso);
  const last30 = (dates: string[]) =>
    dates.filter((d) => Date.parse(d) >= since30).length;

  // Funnel Padawans
  const counts: Record<PadawanStatus, number> = {
    detected: 0,
    approached: 0,
    qualified: 0,
    won: 0,
    lost: 0,
  };
  for (const p of padawans) {
    if (isPadawanStatus(p.status)) counts[p.status]++;
  }
  const funnel = PADAWAN_STATUS_VALUES.map((s) => ({
    status: s,
    label: PADAWAN_STATUS_LABEL[s],
    tone: PADAWAN_STATUS_TONE[s],
    count: counts[s],
  }));

  // Adoubement rate
  const won = counts.won;
  const lost = counts.lost;
  const decided = won + lost;
  const adoubementRate = decided === 0 ? 0 : won / decided;

  // Transmissions agg
  const recipientsTotal = transmissions.reduce(
    (s, t) => s + (t.recipient_count ?? 0),
    0,
  );
  const deliveredTotal = transmissions.reduce(
    (s, t) => s + (t.delivered_count ?? 0),
    0,
  );
  const failedTotal = transmissions.reduce(
    (s, t) => s + (t.failed_count ?? 0),
    0,
  );
  const deliveryRate =
    recipientsTotal === 0 ? 0 : deliveredTotal / recipientsTotal;

  // Activity feed — fusionne les 3 streams, garde les 8 plus récents.
  const events: ActivityEvent[] = [];
  for (const p of profiles.slice(0, 6)) {
    events.push({
      kind: "holocron",
      title: p.full_name ?? "Holocron",
      detail: p.slug ? `/clients/${p.slug}` : null,
      at: p.created_at,
      href: p.slug ? `/admin/clients/${p.slug}` : null,
    });
  }
  for (const p of padawans.slice(0, 6)) {
    events.push({
      kind: "padawan",
      title: p.full_name,
      detail: isPadawanStatus(p.status)
        ? PADAWAN_STATUS_LABEL[p.status]
        : p.status,
      at: p.created_at,
      href: `/admin/crm/${p.id}`,
    });
  }
  for (const t of transmissions.slice(0, 6)) {
    events.push({
      kind: "transmission",
      title: t.subject,
      detail: `${t.delivered_count}/${t.recipient_count} livrés`,
      at: t.sent_at ?? t.created_at,
      href: `/admin/crm/transmissions/${t.id}`,
    });
  }
  events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  return {
    holocrons: {
      total: profiles.length,
      spark: holocronsSpark,
      last30: last30(profiles.map((p) => p.created_at)),
    },
    missions: {
      total: projects.length,
      spark: missionsSpark,
      last30: last30(projects.map((p) => p.created_at)),
    },
    padawans: {
      total: padawans.length,
      spark: padawansSpark,
      last30: last30(padawans.map((p) => p.created_at)),
    },
    transmissions: {
      total: transmissions.length,
      spark: transmissionsSpark,
      last30: last30(
        transmissions.map((t) => t.sent_at ?? t.created_at),
      ),
      recipientsTotal,
      deliveredTotal,
      failedTotal,
      deliveryRate,
    },
    funnel,
    adoubement: { rate: adoubementRate, won, lost },
    transmissions30: transmissionsSpark,
    activity: events.slice(0, 8),
  };
}

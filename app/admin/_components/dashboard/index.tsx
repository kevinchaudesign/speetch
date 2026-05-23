/**
 * <DashboardCockpit> — composer principal de /admin. Orchestrer les
 * widgets (StatCard, FunnelBars, AreaChart30, RadialGauge, ActivityFeed)
 * en grille HUD façon poste de pilotage.
 */

import { CockpitPanel } from "./panel";
import { StatCard } from "./stat-card";
import { FunnelBars } from "./funnel-bars";
import { AreaChart30 } from "./area-chart";
import { RadialGauge } from "./radial-gauge";
import { ActivityFeed } from "./activity-feed";
import { QuickActions } from "./quick-actions";
import type { CockpitData } from "./data";

export function DashboardCockpit({ data }: { data: CockpitData }) {
  return (
    <div className="flex w-full flex-col gap-8">
      {/* Bandeau KPI — 4 cartes côte à côte sur desktop */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Holocrons"
          hint="clients sous gestion"
          value={data.holocrons.total}
          spark={data.holocrons.spark}
          delta30={data.holocrons.last30}
          href="/admin/clients"
          tone="cyan"
        />
        <StatCard
          label="Missions"
          hint="projets ouverts"
          value={data.missions.total}
          spark={data.missions.spark}
          delta30={data.missions.last30}
          tone="cyan"
        />
        <StatCard
          label="Padawans"
          hint="prospects en formation"
          value={data.padawans.total}
          spark={data.padawans.spark}
          delta30={data.padawans.last30}
          href="/admin/crm"
          tone="amber"
        />
        <StatCard
          label="Transmissions"
          hint="emailings émis"
          value={data.transmissions.total}
          spark={data.transmissions.spark}
          delta30={data.transmissions.last30}
          href="/admin/crm/transmissions"
          tone="emerald"
        />
      </div>

      {/* Funnel + Aire transmissions — 2 col responsive (1/2 - 1/2) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <FunnelBars rows={data.funnel} />

        <CockpitPanel
          title="Transmissions émises"
          subtitle="cadence 30 jours"
          pulsing
        >
          <AreaChart30
            values={data.transmissions30}
            total={data.transmissions.last30}
            unit="envois · 30j"
          />
          <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden border-t border-cyan-200/15 pt-4">
            <MiniStat
              label="Destinataires"
              value={data.transmissions.recipientsTotal}
              tone="cyan"
            />
            <MiniStat
              label="Livrés"
              value={data.transmissions.deliveredTotal}
              tone="emerald"
            />
            <MiniStat
              label="Échecs"
              value={data.transmissions.failedTotal}
              tone="rose"
            />
          </div>
        </CockpitPanel>
      </div>

      {/* Jauge + Activity Feed — 2 col (1/3 - 2/3) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)]">
        <CockpitPanel
          title="Taux d'adoubement"
          subtitle="padawans devenus holocrons"
        >
          <RadialGauge
            rate={data.adoubement.rate}
            label="Adoubement"
            subLabel={
              data.adoubement.won + data.adoubement.lost === 0
                ? "aucun verdict encore"
                : `${data.adoubement.won} adoubé${data.adoubement.won > 1 ? "s" : ""} · ${data.adoubement.lost} perdu${data.adoubement.lost > 1 ? "s" : ""}`
            }
            tone={
              data.adoubement.rate >= 0.5
                ? "emerald"
                : data.adoubement.rate >= 0.25
                  ? "amber"
                  : "cyan"
            }
          />
          {/* Indicateur secondaire — taux de livraison Brevo */}
          <div className="mt-2 flex flex-col items-center gap-1 border-t border-cyan-200/15 pt-4">
            <span className="text-[10px] uppercase tracking-[0.28em] text-cyan-200/55">
              Taux de livraison
            </span>
            <span className="font-mono text-lg text-emerald-300/90">
              {data.transmissions.recipientsTotal === 0
                ? "—"
                : `${Math.round(data.transmissions.deliveryRate * 100)} %`}
            </span>
          </div>
        </CockpitPanel>

        <ActivityFeed events={data.activity} />
      </div>

      {/* Bandeau actions rapides */}
      <QuickActions />
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "cyan" | "emerald" | "rose";
}) {
  const color =
    tone === "emerald"
      ? "text-emerald-300/90"
      : tone === "rose"
        ? "text-red-300/85"
        : "text-cyan-200/90";
  return (
    <div className="flex flex-col items-center gap-1 px-2">
      <span className="text-[9px] uppercase tracking-[0.28em] text-white/45">
        {label}
      </span>
      <span className={`font-mono text-lg ${color}`}>{value}</span>
    </div>
  );
}

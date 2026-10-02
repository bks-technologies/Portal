"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, Pause, Play, RefreshCw, RotateCw, X } from "lucide-react";
import { SYSTEMS, type SyncEvent, type SystemId } from "@/lib/data";
import { usePortal } from "@/lib/store";
import { ago, clock, dayLabel, duration, num } from "@/lib/format";
import { Badge, Button, Card, CardHeader, Dot, Empty, cx, type Tone } from "./ui";


const SINGULAR: Record<string, string> = {
  Dateien: "Datei",
  Bestellungen: "Bestellung",
  Kontakte: "Kontakt",
  Lagerbestände: "Lagerbestand",
  Preise: "Preis",
  Rechnungsdaten: "Rechnungsdatensatz",
};

function entityLabel(count: number, entity: string) {
  return `${num(count)} ${count === 1 ? (SINGULAR[entity] ?? entity) : entity}`;
}

export function LiveToggle() {
  const { live, setLive } = usePortal();
  return (
    <Button size="sm" variant="secondary" onClick={() => setLive(!live)} aria-pressed={live}>
      {live ? <Dot tone="ok" pulse /> : <Dot tone="muted" />}
      {live ? "Live" : "Pausiert"}
      {live ? <Pause className="size-3.5 text-muted" /> : <Play className="size-3.5 text-muted" />}
    </Button>
  );
}

type Filter = "alle" | "probleme";

export function SyncFeed({ admin = false, limit, compact = false }: { admin?: boolean; limit?: number; compact?: boolean }) {
  const { state, now } = usePortal();
  const [filter, setFilter] = useState<Filter>("alle");
  const [system, setSystem] = useState<SystemId | "">("");

  const events = useMemo(() => {
    let list = state.events;
    if (filter === "probleme") list = list.filter((e) => e.status !== "ok");
    if (system) list = list.filter((e) => e.from === system || e.to === system);
    return limit ? list.slice(0, limit) : list;
  }, [state.events, filter, system, limit]);

  const groups = useMemo(() => {
    const out: { label: string; items: SyncEvent[] }[] = [];
    for (const e of events) {
      const label = dayLabel(e.at, now);
      const last = out[out.length - 1];
      if (last?.label === label) last.items.push(e);
      else out.push({ label, items: [e] });
    }
    return out;
  }, [events, now]);

  const last = state.events[0];

  return (
    <Card>
      <CardHeader
        icon={<RefreshCw className="size-4" />}
        title={compact ? "Letzte Synchronisationen" : "Synchronisationsverlauf"}
        meta={last ? `Zuletzt ${ago(last.at, now)}: ${SYSTEMS[last.from]} → ${SYSTEMS[last.to]}` : "Noch keine Daten"}
        action={
          compact ? (
            <Link href={admin ? "/admin/sync" : "/kunde/aktivitaet"} className="flex items-center gap-1 text-[13px] font-medium text-accent hover:text-accent-ink">
              Verlauf <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <LiveToggle />
          )
        }
      />

      {!compact && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
          <div role="group" aria-label="Filter" className="flex rounded-lg bg-sunken p-0.5 ring-1 ring-line">
            {(["alle", "probleme"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={cx(
                  "rounded-md px-3 py-1 text-[13px] font-medium transition-colors",
                  filter === f ? "bg-surface text-ink shadow-(--shadow-card)" : "text-muted hover:text-ink",
                )}
              >
                {f === "alle" ? "Alle" : "Nur Probleme"}
              </button>
            ))}
          </div>
          <select
            aria-label="System"
            value={system}
            onChange={(e) => setSystem(e.target.value as SystemId | "")}
            className="h-8 rounded-lg border border-line-strong bg-surface px-2.5 text-[13px] text-ink focus:border-accent focus:outline-none"
          >
            <option value="">Alle Systeme</option>
            {(Object.keys(SYSTEMS) as SystemId[]).map((s) => (
              <option key={s} value={s}>{SYSTEMS[s]}</option>
            ))}
          </select>
          <span className="tabular ml-auto text-[12px] text-faint">{events.length} Einträge</span>
        </div>
      )}

      {events.length === 0 ? (
        <Empty icon={<Check className="size-5" />} title="Keine Einträge" text={filter === "probleme" ? "Gerade läuft alles ohne Warnung." : undefined} />
      ) : (
        <div className="px-5 py-3">
          {groups.map((g) => (
            <div key={g.label}>
              {!compact && <p className="sticky top-0 z-10 bg-surface py-2 text-[12px] font-medium text-faint">{g.label}</p>}
              <ol className="relative">
                <span aria-hidden className="absolute top-3 bottom-3 left-[7px] w-px bg-line" />
                <AnimatePresence initial={false}>
                  {g.items.map((e) => (
                    <motion.li
                      key={e.id}
                      layout="position"
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className="relative overflow-hidden"
                    >
                      <EventRow e={e} admin={admin} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ol>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function EventRow({ e, admin }: { e: SyncEvent; admin: boolean }) {
  const { retry, now } = usePortal();
  const fresh = now - e.at < 20_000;

  return (
    <div className="flex gap-3 py-2.5">
      <span
        className={cx(
          "relative z-1 mt-0.5 grid size-[15px] shrink-0 place-items-center rounded-full ring-4 ring-surface",
          e.status === "ok" ? "bg-ok" : e.status === "warnung" ? "bg-warn" : e.resolved ? "bg-faint" : "bg-bad",
        )}
      >
        {e.status === "ok" ? (
          <Check className="size-2.5 text-white" strokeWidth={3.5} />
        ) : e.status === "warnung" ? (
          <AlertTriangle className="size-2 text-white" strokeWidth={3} />
        ) : (
          <X className="size-2.5 text-white" strokeWidth={3.5} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="text-sm text-ink">
            <span className="font-medium">{entityLabel(e.count, e.entity)}</span>{" "}
            <span className="text-muted">
              {SYSTEMS[e.from]} <span aria-label="nach">→</span> {SYSTEMS[e.to]}
            </span>
            {fresh && <Badge tone="accent" className="ml-2 align-middle">neu</Badge>}
          </p>
          <p className="tabular font-mono text-[12px] text-faint">
            {clock(e.at)} · {duration(e.durationMs)}
          </p>
        </div>
        {(e.message || e.retryOf) && (
          <p className={cx("mt-0.5 text-[13px]", e.status === "fehler" && !e.resolved ? "text-bad" : e.status === "warnung" ? "text-warn" : "text-muted")}>
            {e.message}
            {e.resolved && " · erneut gesendet"}
          </p>
        )}
        {admin && e.status === "fehler" && !e.resolved && (
          <Button size="sm" variant="secondary" className="mt-2" onClick={() => retry(e.id)}>
            <RotateCw className="size-3.5" />
            Erneut senden
          </Button>
        )}
      </div>
    </div>
  );
}

/** Verbindungen auf einen Blick: letzter Lauf und Zustand je Strecke. */
export function Connections() {
  const { state, now } = usePortal();
  const pairs = useMemo(() => {
    const map = new Map<string, { from: SystemId; to: SystemId; last: SyncEvent; total: number; problems: number }>();
    for (const e of state.events) {
      const key = `${e.from}>${e.to}`;
      const cur = map.get(key);
      const problem = e.status === "fehler" && !e.resolved ? 1 : 0;
      if (!cur) map.set(key, { from: e.from, to: e.to, last: e, total: 1, problems: problem });
      else {
        cur.total++;
        cur.problems += problem;
      }
    }
    return [...map.values()].sort((a, b) => b.problems - a.problems || b.last.at - a.last.at);
  }, [state.events]);

  return (
    <Card>
      <CardHeader title="Verbindungen" meta="Letzter Lauf je Strecke" />
      <ul className="divide-y divide-line">
        {pairs.map((p) => {
          const st: Tone = p.problems > 0 ? "bad" : p.last.status === "warnung" ? "warn" : "ok";
          return (
            <li key={`${p.from}-${p.to}`} className="flex items-center gap-3 px-5 py-3">
              <Dot tone={st} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">
                  {SYSTEMS[p.from]} → {SYSTEMS[p.to]}
                </p>
                <p className="text-[12px] text-faint">{ago(p.last.at, now)} · {p.total} {p.total === 1 ? "Lauf" : "Läufe"}</p>
              </div>
              {p.problems > 0 && <Badge tone="bad">{p.problems} Fehler offen</Badge>}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

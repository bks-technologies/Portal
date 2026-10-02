"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarClock, Check, FileUp, ListTodo } from "lucide-react";
import { PHASES, type Project } from "@/lib/data";
import { usePortal } from "@/lib/store";
import { due } from "@/lib/format";
import { Badge, Card, CardHeader, Empty, Progress, cx, type Tone } from "./ui";

const healthTone: Record<Project["health"], Tone> = { "im Plan": "ok", Risiko: "warn", verzögert: "bad" };

export function ProjectStatus({ project }: { project: Project }) {
  const { now } = usePortal();
  const current = PHASES.indexOf(project.phase);
  const goLive = new Date(`${project.goLive}T00:00:00`);
  const daysLeft = Math.max(0, Math.round((goLive.getTime() - new Date(now).setHours(0, 0, 0, 0)) / 86_400_000));

  return (
    <Card>
      <CardHeader
        title="Projektstatus"
        meta={project.name}
        action={<Badge tone={healthTone[project.health]}>{project.health}</Badge>}
      />
      <div className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] text-muted">Fortschritt</p>
            <p className="tabular text-3xl font-semibold tracking-tight text-ink">{project.progress} %</p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-1.5 text-[13px] text-muted">
              <CalendarClock className="size-3.5" />
              Geplanter Livegang
            </p>
            <p className="text-sm font-medium text-ink">
              {goLive.toLocaleDateString("de-DE", { day: "numeric", month: "long" })}
              <span className="font-normal text-muted"> · in {daysLeft} Tagen</span>
            </p>
          </div>
        </div>
        <Progress className="mt-3" value={project.progress} label="Projektfortschritt" />

        <ol className="mt-6 grid grid-cols-5 gap-2">
          {PHASES.map((p, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={p} className="min-w-0">
                <div className="relative h-1 overflow-hidden rounded-full bg-line">
                  {(done || active) && (
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-accent"
                      initial={{ width: 0 }}
                      animate={{ width: done ? "100%" : "50%" }}
                      transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                </div>
                <p
                  className={cx(
                    "mt-2 items-center gap-1 text-[12px] whitespace-nowrap",
                    active ? "flex font-semibold text-ink" : done ? "hidden text-muted sm:flex" : "hidden text-faint sm:flex",
                  )}
                >
                  {done && <Check className="size-3 shrink-0 text-accent" strokeWidth={3} />}
                  <span>{p}</span>
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}

export function Tasks() {
  const { state, toggleTask, now } = usePortal();
  const mine = state.tasks.filter((t) => t.owner === "kunde").sort((a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due));
  const team = state.tasks.filter((t) => t.owner === "bks" && !t.done);
  const open = mine.filter((t) => !t.done).length;

  return (
    <Card>
      <CardHeader icon={<ListTodo className="size-4" />} title="Ihre Aufgaben" meta={open ? `${open} offen` : "Alles erledigt"} />
      <ul className="divide-y divide-line">
        {mine.map((t) => {
          const d = due(t.due, now);
          return (
            <li key={t.id}>
              <label className="flex cursor-pointer items-start gap-3 px-5 py-3 hover:bg-sunken/60">
                <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} className="peer sr-only" />
                <span
                  aria-hidden
                  className={cx(
                    "mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent",
                    t.done ? "border-accent bg-accent text-white" : "border-line-strong bg-surface",
                  )}
                >
                  {t.done && (
                    <motion.span initial={{ scale: 0.3 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 24 }}>
                      <Check className="size-3" strokeWidth={3.5} />
                    </motion.span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cx("block text-sm text-pretty", t.done ? "text-faint line-through" : "text-ink")}>{t.title}</span>
                  {!t.done && <span className={cx("text-[12px]", d.tone === "bad" ? "text-bad" : d.tone === "warn" ? "text-warn" : "text-faint")}>{d.text}</span>}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {team.length > 0 && (
        <div className="border-t border-line bg-sunken/60 px-5 py-3">
          <p className="text-[12px] font-medium text-muted">Daran arbeitet das Team gerade</p>
          <ul className="mt-1.5 space-y-1">
            {team.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-[13px] text-muted">
                <span className="size-1.5 rounded-full bg-accent" />
                {t.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

export function PendingUploads() {
  const { state, now } = usePortal();
  const pending = state.requests.filter((r) => r.fileIds.length === 0).sort((a, b) => a.due.localeCompare(b.due));

  return (
    <Card>
      <CardHeader
        icon={<FileUp className="size-4" />}
        title="Ausstehende Dateien"
        meta={pending.length ? `${pending.length} Anforderungen offen` : "Nichts ausstehend"}
      />
      {pending.length === 0 ? (
        <Empty icon={<Check className="size-5" />} title="Alles übergeben" text="Danke. Wir melden uns, wenn wir weitere Unterlagen brauchen." />
      ) : (
        <ul className="divide-y divide-line">
          {pending.map((r) => {
            const d = due(r.due, now);
            return (
              <li key={r.id}>
                <Link href={`/kunde/dateien?anforderung=${r.id}`} className="group flex items-center gap-3 px-5 py-3 hover:bg-sunken/60">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{r.title}</p>
                    <p className={cx("text-[12px]", d.tone === "bad" ? "text-bad" : d.tone === "warn" ? "text-warn" : "text-faint")}>{d.text}</p>
                  </div>
                  <span className="flex items-center gap-1 text-[13px] font-medium text-accent opacity-80 group-hover:opacity-100">
                    Hochladen <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

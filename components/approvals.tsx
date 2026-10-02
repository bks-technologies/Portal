"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, CheckCircle2, MessageSquareWarning, PenLine, Receipt, Undo2 } from "lucide-react";
import type { Milestone } from "@/lib/data";
import { usePortal } from "@/lib/store";
import { ago, dateLong } from "@/lib/format";
import { Badge, Button, Card, CardHeader, Empty, cx } from "./ui";

const UNDO_MS = 6000;

/** Freigabe-Widget der Kundensicht. `compact` zeigt nur offene Meilensteine. */
export function Approvals({ compact = false }: { compact?: boolean }) {
  const { state } = usePortal();
  const [recent, setRecent] = useState<string[]>([]);
  const timers = useRef(new Map<string, number>());

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => window.clearTimeout(t));
  }, []);

  function onDecided(id: string) {
    setRecent((r) => [...r, id]);
    const t = window.setTimeout(() => {
      setRecent((r) => r.filter((x) => x !== id));
      timers.current.delete(id);
    }, UNDO_MS);
    timers.current.set(id, t);
  }

  function onUndone(id: string) {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setRecent((r) => r.filter((x) => x !== id));
  }

  const visible = state.milestones.filter((m) => m.status === "offen" || recent.includes(m.id));
  const history = state.milestones.filter((m) => m.status !== "offen" && !recent.includes(m.id)).sort((a, b) => (b.decidedAt ?? 0) - (a.decidedAt ?? 0));
  const openCount = state.milestones.filter((m) => m.status === "offen").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          icon={<CheckCircle2 className="size-4" />}
          title="Zur Freigabe"
          meta={openCount ? `${openCount} ${openCount === 1 ? "Meilenstein wartet" : "Meilensteine warten"} auf Ihre Entscheidung` : "Nichts offen"}
          action={
            compact && (
              <Link href="/kunde/freigaben" className="flex items-center gap-1 text-[13px] font-medium text-accent hover:text-accent-ink">
                Alle <ArrowRight className="size-3.5" />
              </Link>
            )
          }
        />
        <ul className="divide-y divide-line">
          <AnimatePresence initial={false}>
            {visible.map((m) => (
              <motion.li
                key={m.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <MilestoneItem m={m} compact={compact} onDecided={onDecided} onUndone={onUndone} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {visible.length === 0 && (
          <Empty icon={<Check className="size-5" />} title="Alles freigegeben" text="Sobald wir den nächsten Meilenstein einreichen, erscheint er hier." />
        )}
      </Card>

      {!compact && history.length > 0 && (
        <Card>
          <CardHeader title="Entschieden" meta="Ihre bisherigen Freigaben und Änderungswünsche" />
          <ul className="divide-y divide-line">
            {history.map((m) => (
              <li key={m.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {m.title} <span className="font-normal text-faint">· Fassung {m.version}</span>
                  </p>
                  {m.comment && <p className="mt-1 max-w-prose text-[13px] text-pretty text-muted">„{m.comment}“</p>}
                </div>
                <div className="text-right">
                  <StatusBadge status={m.status} />
                  {m.decidedAt && <p className="mt-1 text-[12px] text-faint">{dateLong(m.decidedAt)}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: Milestone["status"] }) {
  if (status === "freigegeben") return <Badge tone="ok"><Check className="size-3" strokeWidth={2.5} />Freigegeben</Badge>;
  if (status === "aenderung") return <Badge tone="warn"><PenLine className="size-3" strokeWidth={2.2} />Änderung angefordert</Badge>;
  return <Badge tone="accent">Wartet auf Freigabe</Badge>;
}

function MilestoneItem({
  m,
  compact,
  onDecided,
  onUndone,
}: {
  m: Milestone;
  compact: boolean;
  onDecided: (id: string) => void;
  onUndone: (id: string) => void;
}) {
  const { decide, undoDecision, now } = usePortal();
  const [mode, setMode] = useState<"idle" | "change">("idle");
  const [comment, setComment] = useState("");
  const fieldId = useId();
  const tooShort = comment.trim().length < 10;

  if (m.status !== "offen") {
    const ok = m.status === "freigegeben";
    return (
      <div className={cx("flex flex-wrap items-center justify-between gap-3 px-5 py-4", ok ? "bg-ok-soft/60" : "bg-warn-soft/60")}>
        <p className="flex items-center gap-2.5 text-sm">
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className={cx("grid size-6 place-items-center rounded-full text-white", ok ? "bg-ok" : "bg-warn")}
          >
            {ok ? <Check className="size-3.5" strokeWidth={3} /> : <PenLine className="size-3.5" strokeWidth={2.4} />}
          </motion.span>
          <span>
            <span className="font-medium text-ink">{m.title}</span>{" "}
            <span className="text-muted">{ok ? "freigegeben." : "zurück an das Team."}</span>
          </span>
        </p>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            undoDecision(m.id);
            onUndone(m.id);
          }}
        >
          <Undo2 className="size-3.5" />
          Rückgängig
        </Button>
        <motion.div
          aria-hidden
          className={cx("h-0.5 w-full origin-left rounded-full", ok ? "bg-ok/40" : "bg-warn/40")}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: UNDO_MS / 1000, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-ink">{m.title}</p>
          <p className="mt-0.5 text-[13px] text-muted">
            Fassung {m.version} · eingereicht {ago(m.submittedAt, now)}
          </p>
        </div>
        {m.triggersInvoice && (
          <Badge tone="muted">
            <Receipt className="size-3" />
            Zwischenabnahme
          </Badge>
        )}
      </div>

      {!compact && (
        <>
          <p className="mt-3 max-w-prose text-sm text-pretty text-ink/85">{m.summary}</p>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {m.deliverables.map((d) => (
              <li key={d} className="flex items-start gap-2 text-[13px] text-muted">
                <Check className="mt-0.5 size-3.5 shrink-0 text-ok" strokeWidth={2.5} />
                {d}
              </li>
            ))}
          </ul>
          {m.triggersInvoice && (
            <p className="mt-3 rounded-lg bg-sunken px-3 py-2 text-[12px] text-muted ring-1 ring-line">
              Mit dieser Freigabe stellen wir die Teilrechnung der Zwischenabnahme (40 %).
            </p>
          )}
        </>
      )}

      <AnimatePresence initial={false} mode="wait">
        {mode === "idle" ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                decide(m.id, "freigegeben");
                onDecided(m.id);
              }}
            >
              <Check className="size-4" strokeWidth={2.4} />
              Freigeben
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setMode("change")}>
              <MessageSquareWarning className="size-4" />
              Änderung anfordern
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="change"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
            onSubmit={(e) => {
              e.preventDefault();
              if (tooShort) return;
              decide(m.id, "aenderung", comment.trim());
              onDecided(m.id);
            }}
          >
            <div className="mt-4">
              <label htmlFor={fieldId} className="text-[13px] font-medium text-ink">
                Was soll sich ändern?
              </label>
              <textarea
                id={fieldId}
                autoFocus
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="z. B. Die Bestellübersicht braucht einen Filter nach Lieferdatum."
                className="mt-1.5 block w-full resize-y rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none"
              />
              <p className="mt-1 text-[12px] text-faint">Je genauer, desto schneller die nächste Fassung. Mindestens 10 Zeichen.</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="submit" variant="primary" size="sm" disabled={tooShort}>
                Änderung senden
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setMode("idle")}>
                Abbrechen
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

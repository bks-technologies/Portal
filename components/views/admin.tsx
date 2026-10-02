"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, Copy, FilePlus2, Inbox, PenLine, RotateCw, Send } from "lucide-react";
import { CLIENTS, CURRENT_PROJECT_ID, SYSTEMS, type Project } from "@/lib/data";
import { usePortal } from "@/lib/store";
import { ago, bytes, due } from "@/lib/format";
import { StatusBadge } from "../approvals";
import { Connections, SyncFeed } from "../sync-feed";
import { Badge, Button, Card, CardHeader, Empty, PageHeader, Progress, Stat, cx, type Tone } from "../ui";

const healthTone: Record<Project["health"], Tone> = { "im Plan": "ok", Risiko: "warn", verzögert: "bad" };

export function AdminDashboard() {
  const { state, now } = usePortal();
  const changes = state.milestones.filter((m) => m.status === "aenderung");
  const waiting = state.milestones.filter((m) => m.status === "offen");
  const unreviewed = state.files.filter((f) => !f.reviewed);
  const failed = state.events.filter((e) => e.status === "fehler" && !e.resolved);
  const overdue = state.tasks.filter((t) => t.owner === "kunde" && !t.done && due(t.due, now).days < 0);

  const attention = [
    ...changes.map((m) => ({ key: m.id, tone: "warn" as Tone, title: `Änderung angefordert: ${m.title}`, text: m.comment, href: "/admin/freigaben", at: m.decidedAt ?? 0 })),
    ...failed.map((e) => ({ key: e.id, tone: "bad" as Tone, title: `Sync fehlgeschlagen: ${SYSTEMS[e.from]} → ${SYSTEMS[e.to]}`, text: e.message, href: "/admin/sync", at: e.at })),
    ...unreviewed.map((f) => ({ key: f.id, tone: "accent" as Tone, title: `Neue Datei: ${f.name}`, text: `${f.by} · ${f.confidentiality}`, href: "/admin/dateien", at: f.uploadedAt })),
    ...overdue.map((t) => ({ key: t.id, tone: "warn" as Tone, title: `Kundenaufgabe überfällig: ${t.title}`, text: due(t.due, now).text, href: "/admin", at: 0 })),
  ].sort((a, b) => b.at - a.at);

  return (
    <>
      <PageHeader eyebrow="Admin-Sicht" title="Alle Projekte" />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Aktive Projekte" value={state.projects.length} hint={`${CLIENTS.length} Kunden`} />
        <Stat label="Warten auf Kunden" value={waiting.length} hint="Freigaben offen" tone={waiting.length ? "accent" : "ok"} />
        <Stat label="Ungeprüfte Dateien" value={unreviewed.length} hint="im Eingang" tone={unreviewed.length ? "warn" : "ok"} />
        <Stat label="Sync-Fehler" value={failed.length} hint="nicht behoben" tone={failed.length ? "bad" : "ok"} />
      </div>

      <Card className="mb-6 overflow-hidden">
        <CardHeader title="Projekte" meta="Phase, Fortschritt und Zustand je Kunde" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-sunken text-[12px] text-muted">
              <tr>
                <th className="px-5 py-2.5 font-medium">Kunde</th>
                <th className="px-3 py-2.5 font-medium">Phase</th>
                <th className="w-48 px-3 py-2.5 font-medium">Fortschritt</th>
                <th className="px-3 py-2.5 font-medium">Zustand</th>
                <th className="px-3 py-2.5 font-medium">Leitung</th>
                <th className="px-5 py-2.5 text-right font-medium">Livegang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {state.projects.map((p) => {
                const client = CLIENTS.find((c) => c.id === p.clientId)!;
                return (
                  <tr key={p.id} className="hover:bg-sunken/50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">
                        {client.name}
                        {p.id === CURRENT_PROJECT_ID && <Badge tone="accent" className="ml-2">im Portal</Badge>}
                      </p>
                      <p className="max-w-xs truncate text-[12px] text-muted">{p.name}</p>
                    </td>
                    <td className="px-3 py-3 text-muted">{p.phase}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={p.progress} className="flex-1" label={`Fortschritt ${client.name}`} />
                        <span className="tabular w-9 text-right text-[12px] text-muted">{p.progress} %</span>
                      </div>
                    </td>
                    <td className="px-3 py-3"><Badge tone={healthTone[p.health]}>{p.health}</Badge></td>
                    <td className="px-3 py-3 text-muted">{p.lead}</td>
                    <td className="tabular px-5 py-3 text-right text-muted">
                      {new Date(`${p.goLive}T00:00:00`).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="min-w-0">
          <CardHeader icon={<AlertTriangle className="size-4" />} title="Braucht Aufmerksamkeit" meta={`${attention.length} Punkte`} />
          {attention.length === 0 ? (
            <Empty icon={<Check className="size-5" />} title="Nichts offen" />
          ) : (
            <ul className="divide-y divide-line">
              <AnimatePresence initial={false}>
                {attention.map((a) => (
                  <motion.li key={a.key} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <Link href={a.href} className="group flex items-start gap-3 px-5 py-3 hover:bg-sunken/60">
                      <span className={cx("mt-1.5 size-2 shrink-0 rounded-full", a.tone === "bad" ? "bg-bad" : a.tone === "warn" ? "bg-warn" : "bg-accent")} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{a.title}</p>
                        {a.text && <p className="truncate text-[13px] text-muted">{a.text}</p>}
                      </div>
                      {a.at > 0 && <span className="shrink-0 text-[12px] text-faint">{ago(a.at, now)}</span>}
                      <ArrowRight className="mt-0.5 size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </Card>
        <Connections />
      </div>
    </>
  );
}

export function AdminFreigaben() {
  const { state, now, resubmit } = usePortal();
  const order = { aenderung: 0, offen: 1, freigegeben: 2 } as const;
  const list = [...state.milestones].sort((a, b) => order[a.status] - order[b.status] || b.submittedAt - a.submittedAt);

  return (
    <>
      <PageHeader eyebrow={CLIENTS[0].name} title="Freigaben steuern" />
      <Card className="max-w-4xl">
        <CardHeader title="Meilensteine" meta="Was der Kunde entschieden hat und was noch bei ihm liegt" />
        <ul className="divide-y divide-line">
          <AnimatePresence initial={false}>
            {list.map((m) => (
              <motion.li key={m.id} layout transition={{ type: "spring", stiffness: 380, damping: 36 }} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium text-ink">
                      {m.title} <span className="font-normal text-faint">· Fassung {m.version}</span>
                    </p>
                    <p className="mt-0.5 text-[13px] text-muted">
                      {m.status === "offen"
                        ? `Liegt seit ${ago(m.submittedAt, now).replace("vor ", "")} beim Kunden`
                        : `${m.decidedBy} · ${ago(m.decidedAt ?? 0, now)}`}
                      {m.triggersInvoice && " · löst Teilrechnung 40 % aus"}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                {m.comment && (
                  <blockquote className="mt-3 flex gap-2 rounded-lg bg-warn-soft/60 px-3 py-2 text-[13px] text-ink ring-1 ring-warn/15">
                    <PenLine className="mt-0.5 size-3.5 shrink-0 text-warn" />
                    {m.comment}
                  </blockquote>
                )}
                {m.status === "aenderung" && (
                  <Button size="sm" variant="primary" className="mt-3" onClick={() => resubmit(m.id)}>
                    <Send className="size-3.5" />
                    Fassung {m.version + 1} einreichen
                  </Button>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </Card>
    </>
  );
}

export function AdminDateien() {
  const { state, now, reviewFile } = usePortal();
  const [copied, setCopied] = useState<string | null>(null);
  const files = [...state.files].sort((a, b) => Number(a.reviewed) - Number(b.reviewed) || b.uploadedAt - a.uploadedAt);

  async function copy(id: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    } catch {}
  }

  return (
    <>
      <PageHeader eyebrow={CLIENTS[0].name} title="Eingang" />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader icon={<Inbox className="size-4" />} title="Übergebene Dateien" meta="Mit Prüfsumme, Vertraulichkeit und Absender" />
          {files.length === 0 ? (
            <Empty icon={<Inbox className="size-5" />} title="Noch keine Dateien" />
          ) : (
            <ul className="divide-y divide-line">
              {files.map((f) => {
                const req = state.requests.find((r) => r.id === f.requestId);
                return (
                  <li key={f.id} className={cx("px-5 py-3.5", !f.reviewed && "bg-accent-soft/30")}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{f.name}</p>
                        <p className="tabular text-[12px] text-muted">
                          {bytes(f.size)} · {f.by} · {ago(f.uploadedAt, now)}
                          {req && ` · zu „${req.title}“`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={f.confidentiality === "streng vertraulich" ? "bad" : f.confidentiality === "vertraulich" ? "warn" : "muted"}>
                          {f.confidentiality}
                        </Badge>
                        {f.reviewed ? (
                          <Badge tone="ok"><Check className="size-3" strokeWidth={2.5} />geprüft</Badge>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => reviewFile(f.id)}>Als geprüft markieren</Button>
                        )}
                      </div>
                    </div>
                    {f.checksum && (
                      <button
                        onClick={() => copy(f.id, f.checksum)}
                        className="mt-1.5 flex max-w-full items-center gap-1.5 font-mono text-[11px] text-faint hover:text-ink"
                        title="Prüfsumme kopieren"
                      >
                        {copied === f.id ? <Check className="size-3 shrink-0 text-ok" /> : <Copy className="size-3 shrink-0" />}
                        <span className="truncate">SHA-256 {f.checksum}</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <div className="min-w-0 space-y-6">
          <RequestForm />
          <Card>
            <CardHeader title="Anforderungen" meta="Was der Kunde liefern soll" />
            <ul className="divide-y divide-line">
              {state.requests.map((r) => {
                const d = due(r.due, now);
                const done = r.fileIds.length > 0;
                return (
                  <li key={r.id} className="flex items-start justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink">{r.title}</p>
                      <p className={cx("text-[12px]", done ? "text-faint" : d.tone === "bad" ? "text-bad" : d.tone === "warn" ? "text-warn" : "text-faint")}>
                        {done ? `${r.fileIds.length} Datei${r.fileIds.length > 1 ? "en" : ""} erhalten` : d.text}
                      </p>
                    </div>
                    <Badge tone={done ? "ok" : "muted"}>{done ? "erhalten" : "offen"}</Badge>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

function RequestForm() {
  const { addRequest } = usePortal();
  const [title, setTitle] = useState("");
  const [hint, setHint] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [sent, setSent] = useState(false);
  const ids = { t: useId(), h: useId(), d: useId() };
  const field = "mt-1.5 block h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none";

  return (
    <Card>
      <CardHeader icon={<FilePlus2 className="size-4" />} title="Datei anfordern" meta="Erscheint sofort in der Kundensicht" />
      <form
        className="space-y-3 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !dueDate) return;
          addRequest(title.trim(), hint.trim(), dueDate);
          setTitle("");
          setHint("");
          setDueDate("");
          setSent(true);
          window.setTimeout(() => setSent(false), 2000);
        }}
      >
        <div>
          <label htmlFor={ids.t} className="text-[13px] font-medium text-ink">Was wird gebraucht?</label>
          <input id={ids.t} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Preisliste 2027" className={field} />
        </div>
        <div>
          <label htmlFor={ids.h} className="text-[13px] font-medium text-ink">Hinweis <span className="font-normal text-faint">(optional)</span></label>
          <input id={ids.h} value={hint} onChange={(e) => setHint(e.target.value)} placeholder="Format, Umfang" className={field} />
        </div>
        <div>
          <label htmlFor={ids.d} className="text-[13px] font-medium text-ink">Fällig am</label>
          <input id={ids.d} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={field} />
        </div>
        <Button type="submit" variant="primary" size="sm" disabled={!title.trim() || !dueDate} className="w-full">
          {sent ? <><Check className="size-4" />Angefordert</> : "Anfordern"}
        </Button>
      </form>
    </Card>
  );
}

export function AdminSync() {
  const { state } = usePortal();
  const failed = state.events.filter((e) => e.status === "fehler" && !e.resolved).length;
  return (
    <>
      <PageHeader eyebrow="Schnittstellen" title="Synchronisation" />
      {failed > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-bad-soft px-4 py-3 text-sm text-bad ring-1 ring-bad/15">
          <RotateCw className="size-4 shrink-0" />
          {failed} {failed === 1 ? "Lauf ist" : "Läufe sind"} fehlgeschlagen. Ursache prüfen, dann erneut senden.
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <SyncFeed admin />
        </div>
        <div className="min-w-0">
          <Connections />
        </div>
      </div>
    </>
  );
}

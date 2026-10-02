"use client";

import { CURRENT_CLIENT, CURRENT_PROJECT_ID } from "@/lib/data";
import { usePortal } from "@/lib/store";
import { Approvals } from "../approvals";
import { PendingUploads, ProjectStatus, Tasks } from "../dashboard";
import { FileDrop } from "../file-drop";
import { SyncFeed } from "../sync-feed";
import { Badge, Card, CardHeader, Empty, PageHeader, Stat } from "../ui";
import { bytes, dateLong } from "@/lib/format";
import { FolderLock } from "lucide-react";

function greeting(now: number) {
  const h = new Date(now).getHours();
  return h < 11 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend";
}

export function KundeDashboard() {
  const { state, now } = usePortal();
  const project = state.projects.find((p) => p.id === CURRENT_PROJECT_ID)!;
  const openTasks = state.tasks.filter((t) => t.owner === "kunde" && !t.done).length;
  const pending = state.requests.filter((r) => r.fileIds.length === 0).length;
  const approvals = state.milestones.filter((m) => m.status === "offen").length;
  const syncProblems = state.events.filter((e) => e.status === "fehler" && !e.resolved).length;

  return (
    <>
      <PageHeader eyebrow={CURRENT_CLIENT.name} title={`${greeting(now)}, ${CURRENT_CLIENT.contact.split(" ")[0]}.`} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Offene Aufgaben" value={openTasks} hint="bei Ihnen" tone={openTasks ? "warn" : "ok"} />
        <Stat label="Ausstehende Dateien" value={pending} hint="angefordert" tone={pending ? "warn" : "ok"} />
        <Stat label="Zur Freigabe" value={approvals} hint="Meilensteine" tone={approvals ? "accent" : "ok"} />
        <Stat label="Datenabgleich" value={syncProblems ? `${syncProblems} Fehler` : "läuft"} hint="Warenwirtschaft, CRM" tone={syncProblems ? "bad" : "ok"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <ProjectStatus project={project} />
          <Approvals compact />
          <SyncFeed compact limit={5} />
        </div>
        <div className="min-w-0 space-y-6">
          <Tasks />
          <PendingUploads />
        </div>
      </div>
    </>
  );
}

export function KundeDateien({ requestId }: { requestId?: string }) {
  const { state } = usePortal();
  const files = state.files.filter((f) => f.projectId === CURRENT_PROJECT_ID);

  return (
    <>
      <PageHeader eyebrow="Secure File & Data Drop" title="Dateien übergeben" />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <FileDrop initialRequestId={requestId} />
        </div>
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader icon={<FolderLock className="size-4" />} title="Bereits übergeben" meta={`${files.length} Dateien`} />
            {files.length === 0 ? (
              <Empty icon={<FolderLock className="size-5" />} title="Noch nichts übergeben" />
            ) : (
              <ul className="divide-y divide-line">
                {files.map((f) => (
                  <li key={f.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-medium text-ink" title={f.name}>{f.name}</p>
                      <Badge tone={f.reviewed ? "ok" : "muted"}>{f.reviewed ? "geprüft" : "in Prüfung"}</Badge>
                    </div>
                    <p className="tabular mt-0.5 text-[12px] text-faint">
                      {bytes(f.size)} · {dateLong(f.uploadedAt)} · {f.confidentiality}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <PendingUploads />
        </div>
      </div>
    </>
  );
}

export function KundeFreigaben() {
  return (
    <>
      <PageHeader eyebrow="Approval Workflow" title="Freigaben" />
      <div className="max-w-3xl">
        <Approvals />
      </div>
    </>
  );
}

export function KundeAktivitaet() {
  return (
    <>
      <PageHeader eyebrow="Live Activity & Sync Feed" title="Aktivität" />
      <p className="-mt-3 mb-6 max-w-prose text-sm text-pretty text-muted">
        Jeder Abgleich zwischen Ihrem Portal, der Warenwirtschaft, dem CRM und der Buchhaltung steht hier mit Uhrzeit, Menge und Dauer. Fehler beheben wir, bevor Sie sie bemerken müssen.
      </p>
      <SyncFeed />
    </>
  );
}

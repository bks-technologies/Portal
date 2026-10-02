"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  FileText,
  Fingerprint,
  Lock,
  UploadCloud,
  X,
} from "lucide-react";
import {
  CURRENT_CLIENT,
  CURRENT_PROJECT_ID,
  type Confidentiality,
} from "@/lib/data";
import { usePortal } from "@/lib/store";
import { bytes } from "@/lib/format";
import { Badge, Button, Card, CardHeader, Progress, cx } from "./ui";

const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED = [
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "svg",
  "csv",
  "xlsx",
  "docx",
  "zip",
  "txt",
];

type Phase = "pruefsumme" | "uebertragung" | "fertig" | "fehler";
type Upload = {
  key: string;
  file: File;
  phase: Phase;
  progress: number;
  checksum?: string;
  error?: string;
};

async function sha256(file: File) {
  if (!globalThis.crypto?.subtle) return undefined;
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function validate(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED.includes(ext))
    return `Dateityp .${ext || "?"} ist nicht erlaubt.`;
  if (file.size > MAX_BYTES) return `Größer als 50 MB (${bytes(file.size)}).`;
  if (file.size === 0) return "Die Datei ist leer.";
  return undefined;
}

export function FileDrop({ initialRequestId }: { initialRequestId?: string }) {
  const { state, addFile } = usePortal();
  const openRequests = state.requests.filter((r) => r.fileIds.length === 0);
  const [requestId, setRequestId] = useState(
    initialRequestId && openRequests.some((r) => r.id === initialRequestId)
      ? initialRequestId
      : "",
  );
  const [level, setLevel] = useState<Confidentiality>("vertraulich");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const frames = useRef(new Set<number>());
  const ids = { request: useId(), level: useId(), input: useId() };

  useEffect(() => {
    const set = frames.current;
    return () => set.forEach((f) => cancelAnimationFrame(f));
  }, []);

  function patch(key: string, p: Partial<Upload>) {
    setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...p } : u)));
  }

  // Übertragung simuliert: etwa 6 MB/s, mindestens 1,2 Sekunden, mit leichtem Ruckeln wie im echten Netz.
  function transfer(key: string, size: number) {
    return new Promise<void>((resolve) => {
      const total = Math.max(1200, (size / (6 * 1024 * 1024)) * 1000);
      const start = performance.now();
      let shown = 0;
      const step = (t: number) => {
        const raw = Math.min(1, (t - start) / total);
        const target = raw * 100;
        shown = Math.min(target, shown + Math.random() * 4 + 0.6);
        patch(key, { progress: shown });
        if (raw >= 1 && shown >= 99.5) {
          patch(key, { progress: 100 });
          resolve();
          return;
        }
        const f = requestAnimationFrame(step);
        frames.current.add(f);
      };
      frames.current.add(requestAnimationFrame(step));
    });
  }

  async function start(list: FileList | File[]) {
    const reqForBatch = requestId || undefined;
    const levelForBatch = level;
    const batch: Upload[] = [...list].map((file) => {
      const error = validate(file);
      return {
        key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        phase: error ? "fehler" : "pruefsumme",
        progress: 0,
        error,
      };
    });
    setUploads((u) => [...batch, ...u]);

    for (const u of batch) {
      if (u.error) continue;
      try {
        const checksum = await sha256(u.file);
        patch(u.key, { checksum, phase: "uebertragung" });
        await transfer(u.key, u.file.size);
        addFile({
          id: `f-${Math.random().toString(36).slice(2, 9)}`,
          projectId: CURRENT_PROJECT_ID,
          requestId: reqForBatch,
          name: u.file.name,
          size: u.file.size,
          type: u.file.type || "application/octet-stream",
          checksum: checksum ?? "",
          confidentiality: levelForBatch,
          uploadedAt: Date.now(),
          by: CURRENT_CLIENT.contact,
          reviewed: false,
        });
        patch(u.key, { phase: "fertig" });
      } catch {
        patch(u.key, {
          phase: "fehler",
          error: "Die Datei konnte nicht gelesen werden.",
        });
      }
    }
    if (reqForBatch) setRequestId("");
  }

  return (
    <Card>
      <CardHeader
        icon={<Lock className="size-4" />}
        title="Dateien sicher übergeben"
        meta="Spezifikationen, Exporte, Zugangsdaten. Bis 50 MB je Datei."
      />
      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor={ids.request}
              className="text-[13px] font-medium text-ink"
            >
              Zu welcher Anforderung?
            </label>
            <select
              id={ids.request}
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              className="mt-1.5 block h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink focus:border-accent focus:outline-none"
            >
              <option value="">Keine, freie Übergabe</option>
              {openRequests.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor={ids.level}
              className="text-[13px] font-medium text-ink"
            >
              Vertraulichkeit
            </label>
            <select
              id={ids.level}
              value={level}
              onChange={(e) => setLevel(e.target.value as Confidentiality)}
              className="mt-1.5 block h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink focus:border-accent focus:outline-none"
            >
              <option value="intern">Intern</option>
              <option value="vertraulich">Vertraulich</option>
              <option value="streng vertraulich">
                Streng vertraulich: nur Projektleitung
              </option>
            </select>
          </div>
        </div>

        <label
          htmlFor={ids.input}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length) start(e.dataTransfer.files);
          }}
          className={cx(
            "relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragging
              ? "border-accent bg-accent-soft"
              : "border-line-strong bg-sunken hover:border-accent/50",
          )}
        >
          <motion.span
            animate={dragging ? { y: -4, scale: 1.06 } : { y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={cx(
              "mb-3 grid size-11 place-items-center rounded-full",
              dragging
                ? "bg-accent text-white"
                : "bg-surface text-accent ring-1 ring-line",
            )}
          >
            <UploadCloud className="size-5" />
          </motion.span>
          <span className="text-sm font-medium text-ink">
            {dragging ? "Loslassen zum Hochladen" : "Dateien hierher ziehen"}
          </span>
          <span className="mt-1 text-[13px] text-muted">
            oder{" "}
            <span className="font-medium text-accent">
              vom Rechner auswählen
            </span>
          </span>
          <span className="mt-3 text-[12px] text-faint">
            {ALLOWED.map((e) => e.toUpperCase()).join(" · ")}
          </span>
          <input
            ref={inputRef}
            id={ids.input}
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.length) start(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        <p className="flex items-start gap-2 text-[12px] text-muted">
          <Fingerprint className="mt-px size-3.5 shrink-0" />
          Für jede Datei bilden wir eine SHA-256-Prüfsumme. Damit lässt sich
          später belegen, dass genau diese Fassung angekommen ist. In der Demo
          bleibt die Datei in Ihrem Browser.
        </p>

        <ul className="space-y-2" aria-live="polite">
          <AnimatePresence initial={false}>
            {uploads.map((u) => (
              <motion.li
                key={u.key}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.22 }}
                className="rounded-lg border border-line bg-surface px-3.5 py-3"
              >
                <UploadRow
                  u={u}
                  onRemove={() =>
                    setUploads((l) => l.filter((x) => x.key !== u.key))
                  }
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </Card>
  );
}

function UploadRow({ u, onRemove }: { u: Upload; onRemove: () => void }) {
  const label =
    u.phase === "pruefsumme"
      ? "Prüfsumme wird gebildet"
      : u.phase === "uebertragung"
        ? `Übertragung ${Math.round(u.progress)} %`
        : u.phase === "fertig"
          ? "Übergeben"
          : u.error;

  return (
    <div>
      <div className="flex items-center gap-3">
        <span
          className={cx(
            "grid size-8 shrink-0 place-items-center rounded-md",
            u.phase === "fehler"
              ? "bg-bad-soft text-bad"
              : u.phase === "fertig"
                ? "bg-ok-soft text-ok"
                : "bg-accent-soft text-accent",
          )}
        >
          {u.phase === "fehler" ? (
            <AlertCircle className="size-4" />
          ) : u.phase === "fertig" ? (
            <Check className="size-4" strokeWidth={2.5} />
          ) : (
            <FileText className="size-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{u.file.name}</p>
          <p
            className={cx(
              "tabular text-[12px]",
              u.phase === "fehler" ? "text-bad" : "text-muted",
            )}
          >
            {bytes(u.file.size)} · {label}
          </p>
        </div>
        {(u.phase === "fertig" || u.phase === "fehler") && (
          <Button
            variant="ghost"
            size="sm"
            className="size-8 px-0"
            onClick={onRemove}
            aria-label={`${u.file.name} aus der Liste entfernen`}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
      {u.phase !== "fehler" && (
        <Progress
          className="mt-2.5"
          label={`Fortschritt ${u.file.name}`}
          value={u.phase === "pruefsumme" ? 4 : u.progress}
          tone={u.phase === "fertig" ? "ok" : "accent"}
        />
      )}
      {u.checksum && u.phase === "fertig" && (
        <p
          className="mt-2 truncate font-mono text-[11px] text-faint"
          title={u.checksum}
        >
          <Badge tone="muted" className="mr-2 font-sans">
            SHA-256
          </Badge>
          {u.checksum}
        </p>
      )}
    </div>
  );
}

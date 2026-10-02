"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ADMIN_NAME,
  CURRENT_CLIENT,
  CURRENT_PROJECT_ID,
  LIVE_ISSUES,
  LIVE_TEMPLATES,
  createSeed,
  type FileItem,
  type MilestoneStatus,
  type State,
  type SyncEvent,
} from "./data";

// Der Zustand liegt im localStorage des Browsers. Kunden- und Admin-Sicht teilen ihn,
// damit eine Freigabe in der einen Sicht sofort in der anderen erscheint.
const KEY = "bks-portal-demo-v1";
const MAX_EVENTS = 80;

type Store = {
  state: State;
  now: number;
  live: boolean;
  setLive: (on: boolean) => void;
  toggleTask: (id: string) => void;
  addFile: (file: FileItem) => void;
  reviewFile: (id: string) => void;
  decide: (id: string, status: Exclude<MilestoneStatus, "offen">, comment?: string) => void;
  undoDecision: (id: string) => void;
  resubmit: (id: string) => void;
  addRequest: (title: string, hint: string, due: string) => void;
  retry: (eventId: string) => void;
  reset: () => void;
};

const Ctx = createContext<Store | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function rand(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

function pushEvents(state: State, ...events: SyncEvent[]): State {
  return { ...state, events: [...events, ...state.events].slice(0, MAX_EVENTS) };
}

function makeEvent(partial: Omit<SyncEvent, "id" | "at">): SyncEvent {
  return { id: uid("e"), at: Date.now(), ...partial };
}

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const [now, setNow] = useState(0);
  const [live, setLiveState] = useState(true);
  const hydrated = useRef(false);

  // Laden nach dem ersten Rendern: localStorage gibt es nur im Browser.
  useEffect(() => {
    let initial: State | null = null;
    let liveInit = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        if (parsed?.version === 1) initial = parsed;
      }
      liveInit = localStorage.getItem(`${KEY}-live`) !== "0";
    } catch {}
    const t = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- einmaliges Laden aus dem Browser-Speicher
    setState(initial ?? createSeed(t));
    setLiveState(liveInit);
    setNow(t);
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!state || !hydrated.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  // Andere Tabs (z. B. Admin-Sicht nebenan) halten den Zustand gleich.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== KEY || !e.newValue) return;
      try {
        setState(JSON.parse(e.newValue) as State);
      } catch {}
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  // Laufende Synchronisationen, simuliert. Alle 7 bis 12 Sekunden ein Ereignis.
  useEffect(() => {
    if (!live || !state) return;
    const delay = rand(7000, 12000);
    const id = window.setTimeout(() => {
      const t = LIVE_TEMPLATES[rand(0, LIVE_TEMPLATES.length - 1)];
      const roll = Math.random();
      const status = roll < 0.07 ? "fehler" : roll < 0.18 ? "warnung" : "ok";
      const issues = status === "ok" ? undefined : LIVE_ISSUES[status];
      setState((s) =>
        s &&
        pushEvents(
          s,
          makeEvent({
            from: t.from,
            to: t.to,
            entity: t.entity,
            count: rand(...t.count),
            status,
            durationMs: status === "fehler" ? 30000 : rand(...t.ms),
            message: issues ? issues[rand(0, issues.length - 1)] : undefined,
          }),
        ),
      );
      setNow(Date.now());
    }, delay);
    return () => window.clearTimeout(id);
  }, [live, state]);

  const update = useCallback((fn: (s: State) => State) => {
    setState((s) => (s ? fn(s) : s));
    setNow(Date.now());
  }, []);

  const setLive = useCallback((on: boolean) => {
    setLiveState(on);
    try {
      localStorage.setItem(`${KEY}-live`, on ? "1" : "0");
    } catch {}
  }, []);

  const toggleTask = useCallback(
    (id: string) => update((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
    [update],
  );

  const addFile = useCallback(
    (file: FileItem) =>
      update((s) =>
        pushEvents(
          {
            ...s,
            files: [file, ...s.files],
            requests: s.requests.map((r) => (r.id === file.requestId ? { ...r, fileIds: [...r.fileIds, file.id] } : r)),
          },
          makeEvent({ from: "portal", to: "ablage", entity: "Dateien", count: 1, status: "ok", durationMs: rand(400, 1200), message: file.name }),
        ),
      ),
    [update],
  );

  const reviewFile = useCallback(
    (id: string) => update((s) => ({ ...s, files: s.files.map((f) => (f.id === id ? { ...f, reviewed: true } : f)) })),
    [update],
  );

  const decide = useCallback(
    (id: string, status: Exclude<MilestoneStatus, "offen">, comment?: string) =>
      update((s) => {
        const m = s.milestones.find((x) => x.id === id);
        if (!m) return s;
        const next = {
          ...s,
          milestones: s.milestones.map((x) =>
            x.id === id ? { ...x, status, comment, decidedAt: Date.now(), decidedBy: CURRENT_CLIENT.contact } : x,
          ),
        };
        const events = [
          makeEvent({
            from: "portal",
            to: "crm",
            entity: "Meilenstein",
            count: 1,
            status: "ok",
            durationMs: rand(200, 500),
            message: `${m.title}: ${status === "freigegeben" ? "freigegeben" : "Änderung angefordert"}`,
          }),
        ];
        if (status === "freigegeben" && m.triggersInvoice) {
          events.unshift(
            makeEvent({
              from: "portal",
              to: "buchhaltung",
              entity: "Teilrechnung",
              count: 1,
              status: "ok",
              durationMs: rand(300, 700),
              message: "Zwischenabnahme, 40 % angestoßen",
            }),
          );
        }
        return pushEvents(next, ...events);
      }),
    [update],
  );

  const undoDecision = useCallback(
    (id: string) =>
      update((s) => ({
        ...s,
        milestones: s.milestones.map((x) =>
          x.id === id ? { ...x, status: "offen", comment: undefined, decidedAt: undefined, decidedBy: undefined } : x,
        ),
      })),
    [update],
  );

  const resubmit = useCallback(
    (id: string) =>
      update((s) => ({
        ...s,
        milestones: s.milestones.map((x) =>
          x.id === id
            ? { ...x, status: "offen", version: x.version + 1, submittedAt: Date.now(), comment: undefined, decidedAt: undefined, decidedBy: undefined }
            : x,
        ),
      })),
    [update],
  );

  const addRequest = useCallback(
    (title: string, hint: string, due: string) =>
      update((s) => ({
        ...s,
        requests: [...s.requests, { id: uid("r"), projectId: CURRENT_PROJECT_ID, title, hint, due, fileIds: [] }],
      })),
    [update],
  );

  const retry = useCallback(
    (eventId: string) =>
      update((s) => {
        const e = s.events.find((x) => x.id === eventId);
        if (!e) return s;
        const marked = { ...s, events: s.events.map((x) => (x.id === eventId ? { ...x, resolved: true } : x)) };
        return pushEvents(
          marked,
          makeEvent({ from: e.from, to: e.to, entity: e.entity, count: e.count, status: "ok", durationMs: rand(300, 1600), retryOf: e.id, message: `Erneut gesendet von ${ADMIN_NAME}` }),
        );
      }),
    [update],
  );

  const reset = useCallback(() => {
    const t = Date.now();
    setState(createSeed(t));
    setNow(t);
  }, []);

  const value = useMemo<Store | null>(
    () =>
      state
        ? { state, now, live, setLive, toggleTask, addFile, reviewFile, decide, undoDecision, resubmit, addRequest, retry, reset }
        : null,
    [state, now, live, setLive, toggleTask, addFile, reviewFile, decide, undoDecision, resubmit, addRequest, retry, reset],
  );

  if (!value) return <LoadingShell />;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function LoadingShell() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg" aria-busy="true">
      <div className="h-1 w-40 overflow-hidden rounded-full bg-line">
        <div className="h-full w-1/3 animate-[load_1.1s_ease-in-out_infinite] rounded-full bg-accent" />
      </div>
    </div>
  );
}

export function usePortal() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePortal außerhalb von PortalProvider");
  return ctx;
}

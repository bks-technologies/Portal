// Datenmodell und Beispieldaten des Demo-Portals.
// Alles hier ist erfunden: Firmen, Personen, Projekte und Ereignisse.

export type Role = "kunde" | "admin";

export type Client = {
  id: string;
  name: string;
  contact: string;
  initials: string;
};

export type Phase = "Konzept" | "Design" | "Entwicklung" | "Test" | "Livegang";
export const PHASES: Phase[] = ["Konzept", "Design", "Entwicklung", "Test", "Livegang"];

export type Project = {
  id: string;
  clientId: string;
  name: string;
  phase: Phase;
  progress: number; // 0–100
  health: "im Plan" | "Risiko" | "verzögert";
  lead: string;
  goLive: string; // ISO-Datum
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  owner: "kunde" | "bks";
  due: string; // ISO-Datum
  done: boolean;
};

export type Confidentiality = "intern" | "vertraulich" | "streng vertraulich";

export type FileRequest = {
  id: string;
  projectId: string;
  title: string;
  hint: string;
  due: string;
  fileIds: string[];
};

export type FileItem = {
  id: string;
  projectId: string;
  requestId?: string;
  name: string;
  size: number;
  type: string;
  checksum: string; // SHA-256, hex
  confidentiality: Confidentiality;
  uploadedAt: number;
  by: string;
  reviewed: boolean;
};

export type MilestoneStatus = "offen" | "freigegeben" | "aenderung";

export type Milestone = {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  deliverables: string[];
  version: number;
  submittedAt: number;
  status: MilestoneStatus;
  decidedAt?: number;
  decidedBy?: string;
  comment?: string;
  triggersInvoice: boolean; // Zwischenabnahme löst die 40-%-Teilrechnung aus
};

export type SyncStatus = "ok" | "warnung" | "fehler";
export type SystemId = "portal" | "erp" | "crm" | "buchhaltung" | "ablage";

export const SYSTEMS: Record<SystemId, string> = {
  portal: "Portal",
  erp: "Warenwirtschaft",
  crm: "CRM",
  buchhaltung: "Buchhaltung",
  ablage: "Dokumentenablage",
};

export type SyncEvent = {
  id: string;
  at: number;
  from: SystemId;
  to: SystemId;
  entity: string;
  count: number;
  status: SyncStatus;
  message?: string;
  durationMs: number;
  retryOf?: string;
  resolved?: boolean;
};

export type State = {
  version: 1;
  tasks: Task[];
  requests: FileRequest[];
  files: FileItem[];
  milestones: Milestone[];
  events: SyncEvent[];
  projects: Project[];
};

export const CLIENTS: Client[] = [
  { id: "muster", name: "Muster Logistik GmbH", contact: "Julia Berger", initials: "JB" },
  { id: "alpen", name: "Alpenblick Ferienwohnungen", contact: "Tobias Huber", initials: "TH" },
  { id: "kraus", name: "Kraus Haustechnik", contact: "Sabine Kraus", initials: "SK" },
];

/** Der Kunde, als der man in der Kundensicht angemeldet ist. */
export const CURRENT_CLIENT = CLIENTS[0];
export const CURRENT_PROJECT_ID = "p-muster";
export const ADMIN_NAME = "Projektleitung BKS";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function isoDay(base: number, offsetDays: number) {
  const d = new Date(base + offsetDays * DAY);
  return d.toISOString().slice(0, 10);
}

export function fakeChecksum(seed: string) {
  let h = 2166136261;
  let out = "";
  for (let i = 0; out.length < 64; i++) {
    h ^= seed.charCodeAt(i % seed.length) + i;
    h = Math.imul(h, 16777619) >>> 0;
    out += h.toString(16).padStart(8, "0");
  }
  return out.slice(0, 64);
}

/** Startzustand, relativ zur aktuellen Zeit, damit die Demo immer frisch wirkt. */
export function createSeed(now: number): State {
  const projects: Project[] = [
    {
      id: "p-muster",
      clientId: "muster",
      name: "Kundenportal mit Anbindung an die Warenwirtschaft",
      phase: "Entwicklung",
      progress: 58,
      health: "im Plan",
      lead: "Kevin",
      goLive: isoDay(now, 38),
    },
    {
      id: "p-alpen",
      clientId: "alpen",
      name: "Buchungsseite mit Belegungskalender",
      phase: "Design",
      progress: 31,
      health: "Risiko",
      lead: "Sami",
      goLive: isoDay(now, 52),
    },
    {
      id: "p-kraus",
      clientId: "kraus",
      name: "Auftrags-App für Monteure",
      phase: "Test",
      progress: 86,
      health: "im Plan",
      lead: "Brandon",
      goLive: isoDay(now, 11),
    },
  ];

  const files: FileItem[] = [
    {
      id: "f-1",
      projectId: "p-muster",
      requestId: "r-0",
      name: "Lastenheft_Portal_v2.pdf",
      size: 1_842_311,
      type: "application/pdf",
      checksum: fakeChecksum("lastenheft"),
      confidentiality: "vertraulich",
      uploadedAt: now - 9 * DAY,
      by: "Julia Berger",
      reviewed: true,
    },
    {
      id: "f-2",
      projectId: "p-muster",
      name: "Artikelstamm_Export.csv",
      size: 412_904,
      type: "text/csv",
      checksum: fakeChecksum("artikel"),
      confidentiality: "streng vertraulich",
      uploadedAt: now - 2 * DAY - 3 * HOUR,
      by: "Julia Berger",
      reviewed: false,
    },
  ];

  const requests: FileRequest[] = [
    {
      id: "r-0",
      projectId: "p-muster",
      title: "Lastenheft",
      hint: "Aktuelle Fassung als PDF.",
      due: isoDay(now, -10),
      fileIds: ["f-1"],
    },
    {
      id: "r-1",
      projectId: "p-muster",
      title: "Zugangsdaten Testumgebung Warenwirtschaft",
      hint: "Als passwortgeschütztes PDF. Das Passwort bitte telefonisch durchgeben.",
      due: isoDay(now, 2),
      fileIds: [],
    },
    {
      id: "r-2",
      projectId: "p-muster",
      title: "Logo und Hausfarben",
      hint: "SVG oder PDF, dazu die Farbwerte, falls vorhanden.",
      due: isoDay(now, 5),
      fileIds: [],
    },
    {
      id: "r-3",
      projectId: "p-muster",
      title: "Beispiel-Lieferscheine",
      hint: "Drei bis fünf echte Lieferscheine, Kundendaten geschwärzt.",
      due: isoDay(now, 9),
      fileIds: [],
    },
  ];

  const tasks: Task[] = [
    { id: "t-1", projectId: "p-muster", title: "Testzugang zur Warenwirtschaft bereitstellen", owner: "kunde", due: isoDay(now, 2), done: false },
    { id: "t-2", projectId: "p-muster", title: "Rollen im Portal festlegen: wer darf bestellen, wer nur ansehen", owner: "kunde", due: isoDay(now, 4), done: false },
    { id: "t-3", projectId: "p-muster", title: "Ansprechpartner für den Abnahmetest benennen", owner: "kunde", due: isoDay(now, 12), done: false },
    { id: "t-4", projectId: "p-muster", title: "Schnittstelle Artikelstamm umsetzen", owner: "bks", due: isoDay(now, 6), done: false },
    { id: "t-5", projectId: "p-muster", title: "Bestellübersicht mit Filter bauen", owner: "bks", due: isoDay(now, 9), done: false },
    { id: "t-6", projectId: "p-muster", title: "Lastenheft freigeben", owner: "kunde", due: isoDay(now, -8), done: true },
  ];

  const milestones: Milestone[] = [
    {
      id: "m-1",
      projectId: "p-muster",
      title: "Konzept und Seitenplan",
      summary: "Alle Seiten, Rollen und Abläufe des Portals auf einer Karte.",
      deliverables: ["Seitenplan mit 14 Seiten", "Rollenmodell", "Ablauf Bestellung"],
      version: 1,
      submittedAt: now - 16 * DAY,
      status: "freigegeben",
      decidedAt: now - 15 * DAY,
      decidedBy: "Julia Berger",
      triggersInvoice: false,
    },
    {
      id: "m-2",
      projectId: "p-muster",
      title: "Gestaltung der Kernseiten",
      summary: "Startseite, Bestellübersicht und Artikelseite als klickbarer Entwurf.",
      deliverables: ["Klickbarer Entwurf, Desktop und Handy", "Farben und Schriften", "Zustände: leer, Fehler, Laden"],
      version: 2,
      submittedAt: now - 1 * DAY - 4 * HOUR,
      status: "offen",
      triggersInvoice: false,
    },
    {
      id: "m-3",
      projectId: "p-muster",
      title: "Zwischenabnahme: Bestellung Ende zu Ende",
      summary: "Eine Bestellung läuft vom Portal bis in die Warenwirtschaft, auf der Testumgebung.",
      deliverables: ["Bestellung anlegen und absenden", "Übergabe an die Warenwirtschaft", "Bestätigung per Statusanzeige"],
      version: 1,
      submittedAt: now - 3 * HOUR,
      status: "offen",
      triggersInvoice: true,
    },
  ];

  const templates: Omit<SyncEvent, "id" | "at">[] = [
    { from: "erp", to: "portal", entity: "Artikel", count: 1284, status: "ok", durationMs: 2140 },
    { from: "portal", to: "erp", entity: "Bestellungen", count: 3, status: "ok", durationMs: 380 },
    { from: "crm", to: "portal", entity: "Kontakte", count: 42, status: "ok", durationMs: 610 },
    { from: "portal", to: "ablage", entity: "Dateien", count: 1, status: "ok", durationMs: 920 },
    { from: "erp", to: "portal", entity: "Lagerbestände", count: 1284, status: "warnung", durationMs: 4810, message: "7 Artikel ohne Lagerort übersprungen" },
    { from: "portal", to: "buchhaltung", entity: "Rechnungsdaten", count: 1, status: "ok", durationMs: 450 },
    { from: "erp", to: "portal", entity: "Preise", count: 1284, status: "fehler", durationMs: 30000, message: "Zeitüberschreitung nach 30 s, Testumgebung nicht erreichbar" },
    { from: "portal", to: "crm", entity: "Projektstatus", count: 1, status: "ok", durationMs: 290 },
  ];

  const events: SyncEvent[] = templates.map((t, i) => ({
    ...t,
    id: `e-seed-${i}`,
    at: now - (i * 47 + 6) * MIN,
  }));

  return { version: 1, tasks, requests, files, milestones, events, projects };
}

/** Vorlagen für laufend erzeugte Synchronisationen. */
export const LIVE_TEMPLATES: { from: SystemId; to: SystemId; entity: string; count: [number, number]; ms: [number, number] }[] = [
  { from: "erp", to: "portal", entity: "Lagerbestände", count: [1200, 1300], ms: [1800, 4200] },
  { from: "portal", to: "erp", entity: "Bestellungen", count: [1, 6], ms: [220, 700] },
  { from: "crm", to: "portal", entity: "Kontakte", count: [1, 12], ms: [300, 900] },
  { from: "erp", to: "portal", entity: "Preise", count: [20, 140], ms: [600, 2400] },
  { from: "portal", to: "crm", entity: "Projektstatus", count: [1, 1], ms: [180, 420] },
  { from: "erp", to: "portal", entity: "Lieferstatus", count: [4, 30], ms: [400, 1400] },
];

export const LIVE_ISSUES: Record<Exclude<SyncStatus, "ok">, string[]> = {
  warnung: ["2 Datensätze ohne Pflichtfeld übersprungen", "Antwortzeit über 3 s", "1 Artikel doppelt, ältere Fassung verworfen"],
  fehler: ["Zeitüberschreitung nach 30 s", "Anmeldung an der Schnittstelle abgelehnt (401)", "Zielsystem antwortet mit 503"],
};

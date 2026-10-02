const DAY = 86_400_000;

export function ago(at: number, now: number) {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 45) return "gerade eben";
  const m = Math.round(s / 60);
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.round(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.round(h / 24);
  return d === 1 ? "gestern" : `vor ${d} Tagen`;
}

export function clock(at: number) {
  return new Date(at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function dateLong(at: number) {
  return new Date(at).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
}

export function dayLabel(at: number, now: number) {
  const start = (t: number) => new Date(t).setHours(0, 0, 0, 0);
  const diff = Math.round((start(now) - start(at)) / DAY);
  if (diff === 0) return "Heute";
  if (diff === 1) return "Gestern";
  return new Date(at).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
}

/** Fälligkeit eines ISO-Datums relativ zu heute. */
export function due(iso: string, now: number) {
  const target = new Date(`${iso}T00:00:00`).getTime();
  const today = new Date(now).setHours(0, 0, 0, 0);
  const d = Math.round((target - today) / DAY);
  const label = new Date(target).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
  if (d < 0) return { text: `überfällig seit ${label}`, tone: "bad" as const, days: d };
  if (d === 0) return { text: "heute fällig", tone: "warn" as const, days: d };
  if (d === 1) return { text: "morgen fällig", tone: "warn" as const, days: d };
  if (d <= 3) return { text: `fällig in ${d} Tagen`, tone: "warn" as const, days: d };
  return { text: `fällig ${label}`, tone: "muted" as const, days: d };
}

export function bytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toLocaleString("de-DE", { maximumFractionDigits: 0 })} KB`;
  return `${(n / 1024 ** 2).toLocaleString("de-DE", { maximumFractionDigits: 1 })} MB`;
}

export function duration(ms: number) {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} s`;
}

export function num(n: number) {
  return n.toLocaleString("de-DE");
}

import { ImageResponse } from "next/og";

/** Vorschaubild beim Teilen: Name, drei Bausteine, Hinweis auf die Demo. Wird beim Bauen erzeugt. */
export const runtime = "nodejs";
export const alt = "Projektportal: Kundenportal mit Freigaben, Dateiübergabe und Synchronisationsverlauf";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const items = [
  { label: "Freigaben", value: "2 offen", color: "#2350d8" },
  { label: "Dateien", value: "SHA-256", color: "#12805c" },
  { label: "Sync", value: "live", color: "#a65c06" },
];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#f3f4f7",
          color: "#0e1628",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#0e1628", display: "flex", flexWrap: "wrap", padding: 12, gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: "#fff" }} />
            <div style={{ width: 14, height: 14, borderRadius: 3, background: "#2350d8" }} />
            <div style={{ width: 14, height: 14, borderRadius: 3, background: "#2350d8" }} />
            <div style={{ width: 14, height: 14, borderRadius: 3, background: "#fff" }} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 600 }}>Projektportal</div>
          <div style={{ marginLeft: "auto", fontSize: 22, color: "#5a6478" }}>Demo · erfundene Daten</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>Ein Ort für Kunde und Team.</div>
          <div style={{ marginTop: 20, fontSize: 30, color: "#5a6478" }}>Aufgaben, Dateien, Freigaben und Datenabgleich auf einen Blick.</div>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {items.map((i) => (
            <div
              key={i.label}
              style={{ display: "flex", flexDirection: "column", flex: 1, background: "#fff", borderRadius: 18, padding: "22px 26px", border: "1px solid rgba(14,22,40,0.09)" }}
            >
              <div style={{ fontSize: 22, color: "#5a6478" }}>{i.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, fontSize: 36, fontWeight: 600 }}>
                <div style={{ width: 14, height: 14, borderRadius: 999, background: i.color }} />
                {i.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}

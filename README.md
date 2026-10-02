# Projektportal (Demo)

B2B-Kundenportal mit getrennter Kunden- und Admin-Sicht. Portfolio-Stück von BKS Technologies,
alle Firmen, Personen und Daten sind erfunden.

## Was drin ist

- **Kundensicht** (`/kunde`): Übersicht mit Aufgaben, ausstehenden Dateien, Projektstatus und Phasen;
  Dateiübergabe mit Prüfsumme (SHA-256, echt im Browser berechnet), Vertraulichkeitsstufe und
  Fortschritt; Freigaben mit einem Klick, Änderungswunsch mit Pflichtbegründung, sechs Sekunden
  „Rückgängig“; Aktivität mit Synchronisationsverlauf.
- **Admin-Sicht** (`/admin`): alle Projekte, „Braucht Aufmerksamkeit“, Freigaben steuern (neue Fassung
  einreichen), Dateieingang prüfen, Dateien anfordern, fehlgeschlagene Synchronisationen erneut senden.
- Beide Sichten teilen einen Zustand im `localStorage` (auch über Tabs hinweg).

## Was simuliert ist

- **Kein Backend.** Dateien verlassen den Browser nicht; gespeichert werden nur Name, Größe, Prüfsumme.
  Die Übertragung ist eine Fortschrittsanimation.
- **Synchronisationen** sind erzeugte Ereignisse (alle 7–12 s, abschaltbar über „Live“).
- **Keine Anmeldung.** Die Sichten wechselt man über den Schalter in der Navigation.

Für den echten Einsatz fehlen: Anmeldung und Rechte je Mandant, Datei-Speicher mit Verschlüsselung
(z. B. S3-kompatibel in Frankfurt), echte Schnittstellen, Protokoll, Mail-Benachrichtigungen.

## Entwicklung

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lucide.

Aufbau: `lib/data.ts` (Typen und Beispieldaten), `lib/store.tsx` (Zustand, Simulation),
`components/` (Bausteine), `components/views/` (Seiten je Sicht), `app/` (Routen).

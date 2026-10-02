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

## Veröffentlichen (Vercel)

1. Repo nach GitHub schieben (`bks-technologies/portal`, privat reicht).
2. In Vercel „Add New Project“ → Repo wählen. Framework wird erkannt, keine Einstellungen nötig.
   Region Frankfurt kommt aus `vercel.json`.
3. Optional Variable `NEXT_PUBLIC_SITE_URL` = endgültige Adresse (für Vorschaubilder beim Teilen).
   Ohne sie nimmt das Portal die Produktionsadresse von Vercel.
4. Domain: in Vercel `portal.bkstechnologies.de` hinzufügen, bei IONOS einen CNAME `portal` auf den
   angezeigten Vercel-Wert setzen. MX-Einträge nicht anfassen.

Keine Geheimnisse, keine Datenbank, keine Cronjobs. Impressum und Datenschutz liegen unter `/impressum`
und `/datenschutz` (Fakten aus `lib/legal.ts`, Quelle ist `../website/lib/site.ts`). Die
Datenschutzerklärung ist ein Entwurf.

Wer externe Skripte, Analytics oder Einbettungen ergänzt, muss die CSP in `next.config.ts` erweitern.

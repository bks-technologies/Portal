import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck } from "lucide-react";
import { LegalLinks } from "@/components/legal-page";

const views = [
  {
    href: "/kunde",
    icon: Building2,
    title: "Kundensicht",
    who: "Muster Logistik GmbH",
    text: "Projektstatus, Aufgaben, Dateien übergeben, Meilensteine freigeben, Datenabgleich verfolgen.",
  },
  {
    href: "/admin",
    icon: ShieldCheck,
    title: "Admin-Sicht",
    who: "Projektleitung",
    text: "Alle Projekte, Änderungswünsche, Dateieingang mit Prüfsumme, fehlgeschlagene Synchronisationen.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-4 py-12 sm:px-8">
      <p className="text-[13px] font-medium text-muted">
        Demo · erfundene Daten
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance text-ink sm:text-4xl">
        Projektportal für Kunden und Team
      </h1>
      <p className="mt-3 max-w-prose text-[15px] text-pretty text-muted">
        Beide Sichten teilen denselben Stand. Geben Sie in der Kundensicht einen
        Meilenstein frei und wechseln Sie in die Admin-Sicht: Die Entscheidung
        ist schon da.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {views.map((v) => (
          <li key={v.href}>
            <Link
              href={v.href}
              className="group flex h-full flex-col rounded-xl border border-line bg-surface p-5 shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-pop)"
            >
              <span
                className={
                  v.href === "/admin"
                    ? "grid size-9 place-items-center rounded-lg bg-admin text-white"
                    : "grid size-9 place-items-center rounded-lg bg-accent-soft text-accent"
                }
              >
                <v.icon className="size-4.5" />
              </span>
              <span className="mt-4 text-base font-semibold text-ink">
                {v.title}
              </span>
              <span className="text-[13px] text-muted">{v.who}</span>
              <span className="mt-3 flex-1 text-sm text-pretty text-muted">
                {v.text}
              </span>
              <span className="mt-4 flex items-center gap-1 text-sm font-medium text-accent">
                Öffnen{" "}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-10 flex flex-wrap justify-between gap-2 text-[12px] text-faint">
        <span>
          Eine Demo von{" "}
          <a
            href="https://bkstechnologies.de"
            className="underline underline-offset-2 hover:text-ink"
          >
            BKS Technologies
          </a>
          . Daten bleiben im Browser.
        </span>
        <LegalLinks />
      </p>
    </main>
  );
}

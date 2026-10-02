"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  FileUp,
  LayoutDashboard,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { ADMIN_NAME, CLIENTS, CURRENT_CLIENT, type Role } from "@/lib/data";
import { usePortal } from "@/lib/store";
import { LegalLinks } from "./legal-page";
import { cx } from "./ui";

type NavItem = { href: string; label: string; icon: LucideIcon; count?: number };

function useNav(role: Role): NavItem[] {
  const { state } = usePortal();
  const openMilestones = state.milestones.filter((m) => m.status === "offen").length;
  const openRequests = state.requests.filter((r) => r.fileIds.length === 0).length;
  const failed = state.events.filter((e) => e.status === "fehler" && !e.resolved).length;
  const unreviewed = state.files.filter((f) => !f.reviewed).length;
  const changes = state.milestones.filter((m) => m.status === "aenderung").length;

  if (role === "kunde") {
    return [
      { href: "/kunde", label: "Übersicht", icon: LayoutDashboard },
      { href: "/kunde/dateien", label: "Dateien", icon: FileUp, count: openRequests },
      { href: "/kunde/freigaben", label: "Freigaben", icon: CheckCircle2, count: openMilestones },
      { href: "/kunde/aktivitaet", label: "Aktivität", icon: Activity },
    ];
  }
  return [
    { href: "/admin", label: "Übersicht", icon: LayoutDashboard },
    { href: "/admin/freigaben", label: "Freigaben", icon: CheckCircle2, count: changes },
    { href: "/admin/dateien", label: "Eingang", icon: FileUp, count: unreviewed },
    { href: "/admin/sync", label: "Synchronisation", icon: RefreshCw, count: failed },
  ];
}

export function Shell({ role, children }: { role: Role; children: React.ReactNode }) {
  const pathname = usePathname();
  const nav = useNav(role);
  const { reset } = usePortal();
  const admin = role === "admin";

  const isActive = (href: string) => (href === `/${role}` ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside
        className={cx(
          "sticky top-0 z-30 border-b lg:h-dvh lg:border-r lg:border-b-0",
          admin ? "border-white/10 bg-admin text-admin-ink" : "border-line bg-surface text-ink",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-5 lg:py-5">
            <Link href="/" className="flex items-center gap-2.5">
              <span
                className={cx(
                  "grid size-8 grid-cols-2 gap-0.5 rounded-lg p-[7px]",
                  admin ? "bg-white" : "bg-ink",
                )}
                aria-hidden
              >
                <span className={cx("rounded-[2px]", admin ? "bg-admin" : "bg-white")} />
                <span className="rounded-[2px] bg-accent" />
                <span className="rounded-[2px] bg-accent" />
                <span className={cx("rounded-[2px]", admin ? "bg-admin" : "bg-white")} />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold tracking-tight">Projektportal</span>
                <span className={cx("block text-[12px]", admin ? "text-admin-muted" : "text-muted")}>
                  {admin ? "Admin-Sicht" : "Kundensicht"}
                </span>
              </span>
            </Link>
            <RoleSwitch role={role} className="lg:hidden" />
          </div>

          <nav aria-label="Hauptnavigation" className="overflow-x-auto px-2 pb-2 lg:flex-1 lg:px-3 lg:pb-0">
            <ul className="flex gap-1 lg:flex-col">
              {nav.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href} className="relative">
                    {active && (
                      <motion.span
                        layoutId={`nav-${role}`}
                        className={cx("absolute inset-0 rounded-lg", admin ? "bg-admin-2" : "bg-sunken ring-1 ring-line")}
                        transition={{ type: "spring", stiffness: 420, damping: 36 }}
                      />
                    )}
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "relative flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm whitespace-nowrap transition-colors",
                        active
                          ? admin ? "text-white" : "font-medium text-ink"
                          : admin ? "text-admin-muted hover:text-white" : "text-muted hover:text-ink",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" strokeWidth={1.8} />
                      <span>{item.label}</span>
                      {!!item.count && (
                        <span
                          className={cx(
                            "tabular ml-auto min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 font-semibold",
                            admin
                              ? item.href.endsWith("sync") ? "bg-bad text-white" : "bg-white/15 text-white"
                              : "bg-accent text-white",
                          )}
                        >
                          {item.count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={cx("hidden space-y-3 border-t p-4 lg:block", admin ? "border-white/10" : "border-line")}>
            <RoleSwitch role={role} />
            <div className="flex items-center gap-3 px-1">
              <span
                className={cx(
                  "grid size-8 place-items-center rounded-full text-[12px] font-semibold",
                  admin ? "bg-white/10 text-white" : "bg-accent-soft text-accent-ink",
                )}
              >
                {admin ? "PL" : CURRENT_CLIENT.initials}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[13px] font-medium">{admin ? ADMIN_NAME : CURRENT_CLIENT.contact}</p>
                <p className={cx("truncate text-[12px]", admin ? "text-admin-muted" : "text-muted")}>
                  {admin ? `${CLIENTS.length} Kunden` : CURRENT_CLIENT.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line bg-surface/70 px-4 py-2 text-[12px] text-muted backdrop-blur sm:px-8">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-3.5" strokeWidth={2} />
            Demo mit erfundenen Daten. Nichts verlässt Ihren Browser.
          </span>
          <span className="flex items-center gap-4">
            <button onClick={reset} className="flex items-center gap-1.5 rounded px-1 font-medium text-muted hover:text-ink">
              <RotateCcw className="size-3.5" strokeWidth={2} />
              Demo zurücksetzen
            </button>
            <LegalLinks className="text-faint" />
          </span>
        </div>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

function RoleSwitch({ role, className }: { role: Role; className?: string }) {
  const admin = role === "admin";
  return (
    <div
      role="group"
      aria-label="Sicht wechseln"
      className={cx("grid grid-cols-2 rounded-lg p-0.5 text-[12px] font-medium", admin ? "bg-white/8" : "bg-sunken ring-1 ring-line", className)}
    >
      {(["kunde", "admin"] as const).map((r) => (
        <Link
          key={r}
          href={`/${r}`}
          aria-current={r === role ? "page" : undefined}
          className={cx(
            "rounded-md px-2.5 py-1 text-center transition-colors",
            r === role
              ? admin ? "bg-white text-admin" : "bg-surface text-ink shadow-(--shadow-card)"
              : admin ? "text-admin-muted hover:text-white" : "text-muted hover:text-ink",
          )}
        >
          {r === "kunde" ? "Kunde" : "Admin"}
        </Link>
      ))}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cx("rounded-xl border border-line bg-surface shadow-(--shadow-card)", className)} {...props} />;
}

export function CardHeader({ title, meta, action, icon }: { title: string; meta?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon && <span className="mt-0.5 text-muted">{icon}</span>}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
          {meta && <p className="mt-0.5 text-[13px] text-muted">{meta}</p>}
        </div>
      </div>
      {action}
    </header>
  );
}

export type Tone = "ok" | "warn" | "bad" | "accent" | "muted";

const toneClass: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  accent: "bg-accent-soft text-accent-ink",
  muted: "bg-sunken text-muted ring-1 ring-inset ring-line",
};

export function Badge({ tone = "muted", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-medium whitespace-nowrap", toneClass[tone], className)}>
      {children}
    </span>
  );
}

const dotClass: Record<Tone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  accent: "bg-accent",
  muted: "bg-faint",
};

export function Dot({ tone, pulse }: { tone: Tone; pulse?: boolean }) {
  return (
    <span
      aria-hidden
      className={cx("inline-block size-2 shrink-0 rounded-full", dotClass[tone], pulse && "animate-[pulse-dot_1.6s_ease-in-out_infinite]")}
    />
  );
}

type ButtonProps = ComponentProps<"button"> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" };

export function Button({ variant = "secondary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
        size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm",
        variant === "primary" && "bg-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-accent-ink",
        variant === "secondary" && "border border-line-strong bg-surface text-ink hover:bg-sunken",
        variant === "ghost" && "text-muted hover:bg-sunken hover:text-ink",
        variant === "danger" && "border border-line-strong bg-surface text-bad hover:bg-bad-soft",
        className,
      )}
      {...props}
    />
  );
}

export function Progress({ value, tone = "accent", className, label }: { value: number; tone?: Tone; className?: string; label?: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cx("h-1.5 overflow-hidden rounded-full bg-line", className)}
    >
      <motion.div
        className={cx("h-full rounded-full", dotClass[tone])}
        initial={false}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ type: "spring", stiffness: 140, damping: 24 }}
      />
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-[13px] font-medium text-muted">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-balance text-ink">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Empty({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-3 grid size-10 place-items-center rounded-full bg-sunken text-faint">{icon}</span>
      <p className="text-sm font-medium text-ink">{title}</p>
      {text && <p className="mt-1 max-w-xs text-[13px] text-pretty text-muted">{text}</p>}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3.5 shadow-(--shadow-card)">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="tabular mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-ink">
        {tone && <Dot tone={tone} />}
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[12px] text-faint">{hint}</p>}
    </div>
  );
}

import type { ReactNode } from "react";
import { m } from "framer-motion";
import { ProgressBar } from "./ProgressBar";

export function StepShell({
  step,
  total,
  title,
  subtitle,
  children,
  footer,
}: {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="glass-card w-full max-w-md p-6 sm:p-8">
      <ProgressBar step={step} total={total} />
      <div className="mt-6">
        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-white/60">{subtitle}</p>}
      </div>
      <div className="mt-6">{children}</div>
      <div className="mt-8">{footer}</div>
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <m.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={disabled || loading ? undefined : { scale: 1.015 }}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 cursor-pointer"
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </m.button>
  );
}

export function BackLink({ onClick, label = "Voltar" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 w-full text-center text-sm font-medium text-white/50 transition-colors hover:text-white/80 cursor-pointer"
    >
      {label}
    </button>
  );
}

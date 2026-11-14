import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function Card({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl bg-white shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06] ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="text-sm font-semibold text-[#303030]">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

type Variant = "primary" | "secondary" | "critical" | "plain";

const variants: Record<Variant, string> = {
  primary: "bg-[#303030] text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.18)] hover:bg-[#1a1a1a]",
  secondary: "bg-white text-[#303030] ring-1 ring-black/[0.12] shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#f7f7f7]",
  critical: "bg-[#C70A24] text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.4)] hover:bg-[#a30a1f]",
  plain: "text-[#005BD3] hover:underline",
};

export function Button({
  variant = "secondary",
  loading = false,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

const badgeTones: Record<string, string> = {
  active: "bg-[#CDFEE1] text-[#0C5132]",
  draft: "bg-[#EBEBEB] text-[#4A4A4A]",
  Pending: "bg-[#FFEB78] text-[#4F4700]",
  Processing: "bg-[#E0F0FF] text-[#00527C]",
  Shipped: "bg-[#E0F0FF] text-[#00527C]",
  Delivered: "bg-[#CDFEE1] text-[#0C5132]",
  Cancelled: "bg-[#FEE8EB] text-[#8E0B21]",
  warning: "bg-[#FFEB78] text-[#4F4700]",
};

export function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${badgeTones[tone] ?? badgeTones.draft}`}>
      {children}
    </span>
  );
}

export function PageHeader({ title, back, actions }: { title: string; back?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {back}
        <h1 className="truncate text-xl font-bold text-[#303030]">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Field({ label, help, children }: { label: string; help?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] font-medium text-[#303030]">{label}</span>
      {children}
      {help && <span className="mt-1 block text-xs text-[#616161]">{help}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-[#8A8A8A] bg-white px-3 py-1.5 text-[16px] text-[#303030] outline-none transition-shadow placeholder:text-[#8A8A8A] focus:border-[#005BD3] focus:ring-2 focus:ring-[#005BD3]/30 sm:text-[13px]";

export function Thumb({ src, alt, size = 40 }: { src?: string | null; alt: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F7F7F7] ring-1 ring-black/[0.08]"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
    </span>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm font-semibold text-[#303030]">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#616161]">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-t-xl bg-white shadow-xl sm:rounded-xl">
        <div className="border-b border-[#E3E3E3] px-4 py-3">
          <h2 className="text-sm font-semibold text-[#303030]">{title}</h2>
        </div>
        <div className="max-h-[70svh] overflow-y-auto p-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-[#E3E3E3] bg-[#F7F7F7] px-4 py-3">{footer}</div>
      </div>
    </div>
  );
}

export function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong";
}

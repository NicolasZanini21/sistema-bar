"use client";

import { useFormStatus } from "react-dom";

const VARIANTES = {
  primary:
    "bg-neutral-100 text-neutral-900 hover:bg-white shadow-sm hover:shadow-md",
  accent:
    "bg-violet-600 text-white font-semibold hover:bg-violet-500 shadow-sm shadow-violet-950 hover:shadow-md",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm hover:shadow-md",
  ghost: "border border-neutral-700 hover:bg-neutral-900 hover:border-neutral-600",
  danger: "text-neutral-500 hover:text-rose-400",
};

export function BotonAccion({
  children,
  className,
  confirmMessage,
  pendingText,
  variant = "ghost",
}: {
  children: React.ReactNode;
  className?: string;
  confirmMessage?: string;
  pendingText?: string;
  variant?: keyof typeof VARIANTES;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-md text-sm font-medium px-3 py-1.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-wait ${VARIANTES[variant]} ${className ?? ""}`}
      onClick={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {pending ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
          {pendingText ?? "Guardando…"}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

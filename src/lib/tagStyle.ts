const STATUS_TONES: Record<string, string> = {
  production: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
  prod: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
  online: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
  healthy: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
  critical: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
};

export const TAG_PILL_BASE =
  "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors";

export function tagTone(tag: string): string {
  return STATUS_TONES[tag.toLowerCase()] ?? "text-slate-500 bg-slate-900/[0.04] dark:text-slate-400 dark:bg-white/[0.05]";
}

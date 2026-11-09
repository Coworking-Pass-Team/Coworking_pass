'use client';

/** Shimmer placeholders shaped like list cards, shown while a list loads instead of a blank or a spinner. */
export default function ListSkeleton({ rows = 3, label, compact = false }: { rows?: number; label: string; compact?: boolean }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label={label} role="status">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className={`bg-white dark:bg-[#202627] border border-soot/8 dark:border-white/10 flex items-center gap-4 ${compact ? 'rounded-xl p-3.5' : 'rounded-3xl p-5'}`}
        >
          <div className={`ui-skeleton shrink-0 ${compact ? 'w-9 h-9 rounded-xl' : 'w-16 h-16 rounded-2xl'}`} />
          <div className="flex-1 space-y-2">
            <div className="ui-skeleton h-3.5 w-2/5 rounded-lg" />
            <div className="ui-skeleton h-3 w-3/5 rounded-lg" />
          </div>
          <div className={`ui-skeleton rounded-lg ${compact ? 'h-4 w-14' : 'h-6 w-20'}`} />
        </div>
      ))}
    </div>
  );
}

"use client";

import { monthLabel, shiftMonth } from "@/lib/date";

export default function MonthPicker({
  month,
  year,
  onChange,
}: {
  month: number;
  year: number;
  onChange: (m: number, y: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          const p = shiftMonth(month, year, -1);
          onChange(p.month, p.year);
        }}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        aria-label="Mês anterior"
      >
        ‹
      </button>
      <span className="min-w-[10rem] text-center text-sm font-medium capitalize">
        {monthLabel(month, year)}
      </span>
      <button
        onClick={() => {
          const n = shiftMonth(month, year, 1);
          onChange(n.month, n.year);
        }}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        aria-label="Próximo mês"
      >
        ›
      </button>
    </div>
  );
}

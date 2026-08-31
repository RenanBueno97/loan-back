"use client";

import { monthLabel, shiftMonth } from "@/lib/date";
import Icon from "@/components/Icon";

export default function MonthPicker({
  month,
  year,
  onChange,
}: {
  month: number;
  year: number;
  onChange: (m: number, y: number) => void;
}) {
  const btn =
    "flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink";
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
      <button
        onClick={() => {
          const p = shiftMonth(month, year, -1);
          onChange(p.month, p.year);
        }}
        className={btn}
        aria-label="Mês anterior"
      >
        <Icon name="chevronLeft" size={18} />
      </button>
      <span className="min-w-[10.5rem] text-center text-sm font-medium capitalize text-ink">
        {monthLabel(month, year)}
      </span>
      <button
        onClick={() => {
          const n = shiftMonth(month, year, 1);
          onChange(n.month, n.year);
        }}
        className={btn}
        aria-label="Próximo mês"
      >
        <Icon name="chevronRight" size={18} />
      </button>
    </div>
  );
}

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function monthLabel(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} de ${year}`;
}

export function currentMonthYear(): { month: number; year: number } {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export function shiftMonth(month: number, year: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

/**
 * Avança `count` meses a partir de uma data, preservando o dia quando possível.
 * Se o mês de destino não tiver o dia (ex.: 31/01 + 1 mês), usa o último dia
 * do mês de destino.
 */
export function addMonths(date: Date, count: number): Date {
  const y = date.getFullYear();
  const m = date.getMonth();
  const day = date.getDate();
  const target = new Date(y, m + count, 1, date.getHours(), date.getMinutes());
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return target;
}

/** Retorna "YYYY-MM-DD" a partir de um Date, em horário local. */
export function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Formata uma data ISO como "31/08/2026". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

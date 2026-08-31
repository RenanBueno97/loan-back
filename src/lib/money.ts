// Utilidades de dinheiro. Internamente tudo é armazenado em centavos (Int).

/** Formata centavos como moeda BRL, ex: 123456 -> "R$ 1.234,56". */
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/** Converte um valor em reais (número ou string "1.234,56") para centavos. */
export function toCents(value: number | string): number {
  if (typeof value === "number") return Math.round(value * 100);
  const normalized = value
    .replace(/\s|R\$/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return Math.round(parseFloat(normalized) * 100);
}

/** Converte centavos para reais (número). */
export function toReais(cents: number): number {
  return cents / 100;
}

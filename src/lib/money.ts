// Utilidades de dinheiro. Internamente tudo é armazenado em centavos (Int).

/** Formata centavos como moeda BRL, ex: 123456 -> "R$ 1.234,56". */
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/**
 * Converte um valor em reais para centavos. Aceita número ou string em formato
 * brasileiro ("1.234,56") ou decimal com ponto ("1234.56", como vem de inputs
 * `type="number"`). Retorna NaN se não for um número válido.
 */
export function toCents(value: number | string): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value * 100) : NaN;
  }

  let s = value.trim().replace(/\s|R\$/gi, "");
  if (!s) return NaN;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    // Ambos presentes: o último separador é o decimal; o outro é de milhar.
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", "."); // BR: 1.234,56
    } else {
      s = s.replace(/,/g, ""); // US: 1,234.56
    }
  } else if (hasComma) {
    // Só vírgula: separador decimal brasileiro.
    s = s.replace(",", ".");
  }
  // Só ponto (ou nenhum separador): já está em decimal com ponto.

  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

/** Converte centavos para reais (número). */
export function toReais(cents: number): number {
  return cents / 100;
}

/**
 * Divide um total em `parts` parcelas de centavos cujo somatório é exatamente
 * `totalCents`. O resto (em centavos) é distribuído nas primeiras parcelas, de
 * modo que nenhuma diferença de arredondamento se perca.
 * Ex.: splitCents(10000, 3) -> [3334, 3333, 3333]
 */
export function splitCents(totalCents: number, parts: number): number[] {
  const base = Math.floor(totalCents / parts);
  let remainder = totalCents - base * parts;
  return Array.from({ length: parts }, () => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    return base + extra;
  });
}

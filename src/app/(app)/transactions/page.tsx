"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/api";
import { formatBRL, toCents, toReais } from "@/lib/money";
import { currentMonthYear, formatDate, toDateInput } from "@/lib/date";
import type { Category, Transaction, TransactionType } from "@/lib/types";
import Modal from "@/components/Modal";
import MonthPicker from "@/components/MonthPicker";

export default function TransactionsPage() {
  const [{ month, year }, setPeriod] = useState(currentMonthYear());
  const [typeFilter, setTypeFilter] = useState<"" | TransactionType>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month: String(month), year: String(year) });
    if (typeFilter) params.set("type", typeFilter);
    const [tx, cats] = await Promise.all([
      apiGet<Transaction[]>(`/api/transactions?${params}`),
      apiGet<Category[]>("/api/categories"),
    ]);
    setTransactions(tx);
    setCategories(cats);
    setLoading(false);
  }, [month, year, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Excluir esta transação?")) return;
    await apiSend(`/api/transactions/${id}`, "DELETE");
    load();
  }

  function openNew() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(t: Transaction) {
    setEditing(t);
    setShowForm(true);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Transações</h1>
        <button
          onClick={openNew}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
        >
          + Nova transação
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <MonthPicker
          month={month}
          year={year}
          onChange={(m, y) => setPeriod({ month: m, year: y })}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "" | TransactionType)}
          className="rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700"
        >
          <option value="">Todos os tipos</option>
          <option value="EXPENSE">Gastos</option>
          <option value="INCOME">Receitas</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">Carregando…</p>
        ) : transactions.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Nenhuma transação neste período.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {formatDate(t.date)}
                  </td>
                  <td className="px-4 py-3">{t.description}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs"
                      style={{ backgroundColor: `${t.category.color}22` }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: t.category.color }}
                      />
                      {t.category.name}
                    </span>
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 text-right font-medium ${
                      t.type === "INCOME" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {t.type === "INCOME" ? "+" : "−"} {formatBRL(t.amountCents)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(t)}
                      className="mr-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => remove(t.id)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <TransactionForm
          categories={categories}
          transaction={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function TransactionForm({
  categories,
  transaction,
  onClose,
  onSaved,
}: {
  categories: Category[];
  transaction: Transaction | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "EXPENSE");
  const [amount, setAmount] = useState(
    transaction ? String(toReais(transaction.amountCents)) : "",
  );
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [date, setDate] = useState(
    transaction ? toDateInput(new Date(transaction.date)) : toDateInput(new Date()),
  );
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const options = categories.filter((c) => c.type === type);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const cents = toCents(amount);
    if (!cents || cents <= 0) return setError("Informe um valor válido.");
    if (!categoryId) return setError("Selecione uma categoria.");

    setSaving(true);
    const payload = {
      type,
      amountCents: cents,
      description,
      date: new Date(`${date}T12:00:00`).toISOString(),
      categoryId,
    };
    try {
      if (transaction) {
        await apiSend(`/api/transactions/${transaction.id}`, "PATCH", payload);
      } else {
        await apiSend("/api/transactions", "POST", payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={transaction ? "Editar transação" : "Nova transação"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(["EXPENSE", "INCOME"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                setCategoryId("");
              }}
              className={`rounded-lg border py-2 text-sm font-medium ${
                type === t
                  ? t === "EXPENSE"
                    ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950"
                    : "border-green-500 bg-green-50 text-green-700 dark:bg-green-950"
                  : "border-slate-200 text-slate-500 dark:border-slate-700"
              }`}
            >
              {t === "EXPENSE" ? "Gasto" : "Receita"}
            </button>
          ))}
        </div>

        <Field label="Valor (R$)">
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
            autoFocus
          />
        </Field>

        <Field label="Descrição">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Categoria">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione…</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Data">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </Field>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:border-slate-900 dark:border-slate-700 dark:focus:border-slate-300";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

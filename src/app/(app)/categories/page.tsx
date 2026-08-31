"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/api";
import type { Category, TransactionType } from "@/lib/types";
import Modal from "@/components/Modal";

const PALETTE = [
  "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#10b981",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b", "#94a3b8",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  async function load() {
    setLoading(true);
    setCategories(await apiGet<Category[]>("/api/categories"));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(c: Category) {
    if (!confirm(`Excluir a categoria "${c.name}"?`)) return;
    try {
      await apiSend(`/api/categories/${c.id}`, "DELETE");
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir");
    }
  }

  async function seedDefaults() {
    await apiSend("/api/categories/defaults", "POST");
    load();
  }

  const expenses = categories.filter((c) => c.type === "EXPENSE");
  const incomes = categories.filter((c) => c.type === "INCOME");
  const isEmpty = !loading && categories.length === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
        >
          + Nova categoria
        </button>
      </div>

      {isEmpty && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-4 text-sm text-slate-500">
            Você ainda não tem categorias. Comece com um conjunto padrão.
          </p>
          <button
            onClick={seedDefaults}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
          >
            Criar categorias padrão
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Carregando…</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <CategoryList
            title="Gastos"
            items={expenses}
            onEdit={(c) => {
              setEditing(c);
              setShowForm(true);
            }}
            onRemove={remove}
          />
          <CategoryList
            title="Receitas"
            items={incomes}
            onEdit={(c) => {
              setEditing(c);
              setShowForm(true);
            }}
            onRemove={remove}
          />
        </div>
      )}

      {showForm && (
        <CategoryForm
          category={editing}
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

function CategoryList({
  title,
  items,
  onEdit,
  onRemove,
}: {
  title: string;
  items: Category[];
  onEdit: (c: Category) => void;
  onRemove: (c: Category) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma categoria.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((c) => (
            <li
              key={c.id}
              className="group flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                {c.name}
              </span>
              <span className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => onEdit(c)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  ✎
                </button>
                <button
                  onClick={() => onRemove(c)}
                  className="text-slate-400 hover:text-red-600"
                >
                  🗑
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryForm({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState<TransactionType>(category?.type ?? "EXPENSE");
  const [color, setColor] = useState(category?.color ?? PALETTE[0]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Informe um nome.");
    setSaving(true);
    setError("");
    try {
      if (category) {
        await apiSend(`/api/categories/${category.id}`, "PATCH", { name, type, color });
      } else {
        await apiSend("/api/categories", "POST", { name, type, color });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={category ? "Editar categoria" : "Nova categoria"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:border-slate-900 dark:border-slate-700 dark:focus:border-slate-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["EXPENSE", "INCOME"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg border py-2 text-sm font-medium ${
                type === t
                  ? "border-slate-900 bg-slate-100 dark:border-slate-300 dark:bg-slate-800"
                  : "border-slate-200 text-slate-500 dark:border-slate-700"
              }`}
            >
              {t === "EXPENSE" ? "Gasto" : "Receita"}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Cor</label>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full ${
                  color === c ? "ring-2 ring-slate-900 ring-offset-2 dark:ring-slate-100" : ""
                }`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

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

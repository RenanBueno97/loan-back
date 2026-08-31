"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/api";
import type { Category, TransactionType } from "@/lib/types";
import Modal from "@/components/Modal";
import Icon from "@/components/Icon";
import { Button, Field, inputClass } from "@/components/ui";

const PALETTE = [
  "#c2410c", "#ea580c", "#d97706", "#65a30d", "#059669", "#0d9488",
  "#0891b2", "#2563eb", "#7c3aed", "#c026d3", "#e11d48", "#64748b",
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
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Categorias</h1>
          <p className="mt-0.5 text-sm text-muted">Organize para onde o dinheiro vai.</p>
        </div>
        {!isEmpty && (
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <Icon name="plus" size={17} /> Nova
          </Button>
        )}
      </header>

      {isEmpty && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Icon name="categories" size={24} />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">Comece com um conjunto pronto</p>
            <p className="mt-1 text-sm text-muted">
              Criamos as categorias mais comuns para você começar rápido.
            </p>
          </div>
          <Button onClick={seedDefaults}>Criar categorias padrão</Button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface-2" />
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface-2" />
        </div>
      ) : !isEmpty ? (
        <div className="grid gap-4 sm:grid-cols-2">
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
      ) : null}

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
    <div className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
        {title} · {items.length}
      </h2>
      {items.length === 0 ? (
        <p className="px-1 py-3 text-sm text-faint">Nenhuma categoria.</p>
      ) : (
        <ul className="space-y-0.5">
          {items.map((c) => (
            <li
              key={c.id}
              className="group flex items-center justify-between rounded-xl px-2.5 py-2 hover:bg-surface-2"
            >
              <span className="flex items-center gap-2.5 text-sm text-ink">
                <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </span>
              <span className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => onEdit(c)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink"
                  aria-label="Editar"
                >
                  <Icon name="pencil" size={14} />
                </button>
                <button
                  onClick={() => onRemove(c)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-expense/10 hover:text-expense"
                  aria-label="Excluir"
                >
                  <Icon name="trash" size={14} />
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
      if (category) await apiSend(`/api/categories/${category.id}`, "PATCH", { name, type, color });
      else await apiSend("/api/categories", "POST", { name, type, color });
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
        <Field label="Nome">
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus className={inputClass} placeholder="Ex.: Assinaturas" />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          {(["EXPENSE", "INCOME"] as const).map((t) => {
            const on = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className="rounded-xl border py-2.5 text-sm font-medium transition-colors"
                style={{
                  borderColor: on ? "var(--accent)" : "var(--border)",
                  color: on ? "var(--accent)" : "var(--muted)",
                  background: on ? "var(--accent-soft)" : "transparent",
                }}
              >
                {t === "EXPENSE" ? "Gasto" : "Receita"}
              </button>
            );
          })}
        </div>

        <div>
          <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted">Cor</span>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-8 w-8 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  outline: color === c ? "2px solid var(--ink)" : "none",
                  outlineOffset: 2,
                }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-expense">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

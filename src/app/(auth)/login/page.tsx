"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiSend } from "@/lib/api";
import Icon from "@/components/Icon";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiSend("/api/login", "POST", { password });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4">
      {/* brilho de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #34d399, transparent 70%)" }}
      />

      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(0,0,0,0.25)]"
      >
        <div className="mb-7 flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
            style={{ background: "linear-gradient(140deg, #34d399, #067a5b)" }}
          >
            <Icon name="wallet" size={22} />
          </span>
          <div className="leading-tight">
            <h1 className="text-xl font-semibold tracking-tight text-ink">Grana</h1>
            <p className="text-xs text-muted">controle de gastos</p>
          </div>
        </div>

        <p className="mb-5 text-sm text-muted">
          Bem-vindo de volta. Entre para ver suas finanças.
        </p>

        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
          Senha
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          placeholder="••••••••"
        />

        {error && <p className="mt-3 text-sm text-expense">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-6 w-full py-2.5">
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </main>
  );
}

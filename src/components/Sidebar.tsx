"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiSend } from "@/lib/api";

const NAV = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/transactions", label: "Transações", icon: "💸" },
  { href: "/categories", label: "Categorias", icon: "🏷️" },
  { href: "/budgets", label: "Orçamentos", icon: "🎯" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await apiSend("/api/logout", "POST");
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex shrink-0 flex-row gap-1 border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:w-60 sm:flex-col sm:gap-1 sm:border-r sm:p-4">
      <div className="hidden px-2 pb-6 pt-2 sm:block">
        <h1 className="text-lg font-bold">💰 Controle de Gastos</h1>
      </div>
      <nav className="flex flex-1 flex-row gap-1 sm:flex-col">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:justify-start ${
                active
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <span>{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <button
        onClick={logout}
        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <span className="sm:hidden">🚪</span>
        <span className="hidden sm:inline">Sair</span>
      </button>
    </aside>
  );
}

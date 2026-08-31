"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiSend } from "@/lib/api";
import Icon, { type IconName } from "@/components/Icon";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/transactions", label: "Transações", icon: "transactions" },
  { href: "/categories", label: "Categorias", icon: "categories" },
  { href: "/budgets", label: "Orçamentos", icon: "budgets" },
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
    <aside
      className="flex shrink-0 items-center gap-1 px-3 py-2 sm:w-64 sm:flex-col sm:items-stretch sm:gap-1 sm:px-4 sm:py-6"
      style={{ background: "var(--side-bg)", color: "var(--side-fg)" }}
    >
      {/* Marca */}
      <div className="hidden items-center gap-2.5 px-2 pb-8 sm:flex">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
          style={{
            background: "linear-gradient(140deg, #34d399, #067a5b)",
          }}
        >
          <Icon name="wallet" size={19} />
        </span>
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight text-white">
            Grana
          </p>
          <p className="text-[11px]" style={{ color: "var(--side-muted)" }}>
            controle de gastos
          </p>
        </div>
      </div>

      <nav className="flex flex-1 items-center gap-1 sm:flex-col sm:items-stretch">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 items-center justify-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors sm:flex-none sm:justify-start"
              style={
                active
                  ? {
                      background: "var(--side-active-bg)",
                      color: "var(--side-active-fg)",
                    }
                  : { color: "var(--side-fg)" }
              }
            >
              <Icon name={item.icon} size={19} />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="flex items-center justify-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/5 sm:justify-start"
        style={{ color: "var(--side-muted)" }}
      >
        <Icon name="logout" size={19} />
        <span className="hidden sm:inline">Sair</span>
      </button>
    </aside>
  );
}

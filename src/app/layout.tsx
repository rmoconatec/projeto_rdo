import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diário de Obras — Sistema de RDO",
  description:
    "Sistema web para gestão de obras e Relatórios Diários de Obra (RDO).",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-lg">
                🏗️
              </span>
              <div className="leading-tight">
                <p className="text-base font-bold text-slate-900">
                  Diário de Obras
                </p>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Sistema de RDO
                </p>
              </div>
            </Link>
            <nav className="flex items-center gap-1 text-sm font-medium">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
              >
                Painel
              </Link>
              <Link
                href="/obras"
                className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
              >
                Obras
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          Sistema de Diário de Obras (RDO) — desenvolvido com Next.js
        </footer>
      </body>
    </html>
  );
}

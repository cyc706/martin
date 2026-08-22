import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, ChevronLeft, Tags } from "lucide-react";

import { TickerManager } from "@/components/ticker-manager";

export const metadata: Metadata = {
  title: "Ticker 管理 | Martin",
  description: "管理 Martin 金融行情查看系统的交易标的。",
};

export default function TickersPage() {
  return (
    <main id="ticker-management-page" className="min-h-dvh bg-background p-1">
      <header id="ticker-management-navbar" className="flex h-14 items-center justify-between rounded-md border bg-card px-4">
        <div id="ticker-management-brand" className="flex items-center gap-2.5"><div id="ticker-management-logo" className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground"><BarChart3 className="size-4" /></div><div><p className="text-sm font-semibold">Martin</p><p className="text-[10px] text-muted-foreground">Ticker 管理</p></div></div>
        <div id="ticker-management-navigation" className="flex items-center gap-1"><Link id="ticker-exchange-manager-link" href="/exchanges" className="hidden h-8 items-center rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex">交易所管理</Link><Link id="ticker-back-home" href="/" className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><ChevronLeft className="size-4" />返回行情</Link></div>
      </header>
      <section id="ticker-management-body" className="w-full p-4 sm:p-6">
        <div id="ticker-management-intro" className="mb-5 flex items-start gap-3"><div id="ticker-management-icon" className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted"><Tags className="size-4" /></div><div><h1 className="text-xl font-semibold tracking-tight">Ticker 管理</h1><p className="mt-1 text-sm text-muted-foreground">维护中、美、港与加密市场的资产代码、中文名、交易所、类型和简介。</p></div></div>
        <TickerManager />
      </section>
    </main>
  );
}

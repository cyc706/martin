import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, ChevronLeft, Landmark } from "lucide-react";

import { ExchangeManager } from "@/components/exchange-manager";

export const metadata: Metadata = { title: "交易所管理 | Martin", description: "管理 Martin 的交易所主数据。" };

export default function ExchangesPage() {
  return <main id="exchange-management-page" className="min-h-dvh bg-background p-1"><header id="exchange-management-navbar" className="flex h-14 items-center justify-between rounded-md border bg-card px-4"><div id="exchange-management-brand" className="flex items-center gap-2.5"><div id="exchange-management-logo" className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground"><BarChart3 className="size-4" /></div><div><p className="text-sm font-semibold">Martin</p><p className="text-[10px] text-muted-foreground">交易所管理</p></div></div><Link id="exchange-back-home" href="/" className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><ChevronLeft className="size-4" />返回行情</Link></header><section id="exchange-management-body" className="w-full p-4 sm:p-6"><div id="exchange-management-intro" className="mb-5 flex items-start gap-3"><div id="exchange-management-icon" className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted"><Landmark className="size-4" /></div><div><h1 className="text-xl font-semibold tracking-tight">交易所管理</h1><p className="mt-1 text-sm text-muted-foreground">维护中、美、港和 Crypto 市场的交易所主数据与 TradingView 映射。</p></div></div><ExchangeManager /></section></main>;
}

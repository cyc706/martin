import { MarketWorkspace } from "@/components/market-workspace";
import { Activity, BarChart3, Settings2 } from "lucide-react";

export default function Home() {
  return (
    <main className="flex h-dvh min-h-[560px] flex-col overflow-hidden bg-background">
      <header
        aria-label="导航栏"
        className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4"
      >
        <div className="flex min-w-0 items-center gap-6">
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BarChart3 className="size-4" />
            </div>
            <div className="leading-none">
              <p className="text-sm font-semibold tracking-tight">Martin</p>
              <p className="mt-1 text-[10px] text-muted-foreground">金融数据分析工具</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
            <Activity className="size-3.5 text-emerald-600" />
            数据连接正常
          </div>
          <button
            type="button"
            aria-label="打开设置"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings2 className="size-4" />
          </button>
        </div>
      </header>

      <section id="market" className="min-h-0 flex-1 p-1">
        <MarketWorkspace />
      </section>
    </main>
  );
}

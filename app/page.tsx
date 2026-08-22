import {
  Activity,
  BarChart3,
  Bell,
  ChevronDown,
  Search,
  Settings2,
  Star,
} from "lucide-react";
import Link from "next/link";

const tickerTape = [
  ["BTC", "+1.82%", "up"],
  ["ETH", "+0.64%", "up"],
  ["NVDA", "-0.95%", "down"],
  ["SPCX", "+1.26%", "up"],
  ["AAPL", "-0.61%", "down"],
] as const;

const watchlistRows = ["贵州茅台", "比亚迪", "宁德时代", "腾讯控股", "Bitcoin"];

export default function Home() {
  return (
    <main
      id="trading-terminal-page"
      className="flex min-h-dvh flex-col overflow-x-hidden bg-[#090c10] text-[#e8ebef] lg:h-dvh lg:min-h-[640px] lg:overflow-hidden"
    >
      <header
        id="trading-terminal-navbar"
        aria-label="导航栏"
        className="flex h-11 shrink-0 items-center gap-4 bg-[#0b0f14] px-3"
      >
        <div id="navbar-brand-group" className="flex shrink-0 items-center gap-7">
          <Link id="navbar-brand-link" href="/" className="flex items-center gap-2.5">
            <span
              id="navbar-brand-mark"
              className="flex size-7 items-center justify-center rounded-sm border border-amber-300/30 bg-amber-300/10 text-amber-300"
            >
              <BarChart3 className="size-4" />
            </span>
            <span id="navbar-brand-name" className="font-mono text-sm font-semibold tracking-[0.18em]">
              MARTIN
            </span>
          </Link>

          <nav id="navbar-primary-navigation" className="hidden items-center gap-5 text-xs text-[#8b949f] md:flex">
            <Link id="navbar-market-link" href="/" className="text-amber-300">
              市场
            </Link>
            <Link id="navbar-exchanges-link" href="/exchanges" className="transition-colors hover:text-white">
              交易所
            </Link>
            <Link id="navbar-tickers-link" href="/tickers" className="transition-colors hover:text-white">
              Ticker
            </Link>
          </nav>
        </div>

        <div id="navbar-ticker-tape" className="hidden min-w-0 flex-1 items-center gap-7 overflow-hidden border-x border-white/6 px-4 lg:flex">
          {tickerTape.map(([symbol, change, direction]) => (
            <div id={`ticker-tape-${symbol.toLowerCase()}`} key={symbol} className="flex shrink-0 items-center gap-2 font-mono text-[11px]">
              <span className="text-[#7e8792]">{symbol}</span>
              <span className={direction === "up" ? "text-emerald-400" : "text-rose-400"}>{change}</span>
            </div>
          ))}
        </div>

        <div id="navbar-action-group" className="ml-auto flex shrink-0 items-center gap-1.5">
          <div id="navbar-live-status" className="mr-2 hidden items-center gap-2 text-[11px] text-[#77818c] sm:flex">
            <Activity className="size-3 text-emerald-400" />
            市场在线
          </div>
          <button id="navbar-notification-button" type="button" aria-label="通知" className="flex size-8 items-center justify-center rounded border border-white/8 text-[#8b949f]">
            <Bell className="size-3.5" />
          </button>
          <button id="navbar-settings-button" type="button" aria-label="设置" className="flex size-8 items-center justify-center rounded border border-white/8 text-[#8b949f]">
            <Settings2 className="size-3.5" />
          </button>
        </div>
      </header>

      <section
        id="trading-terminal-body"
        className="grid min-h-0 flex-1 grid-cols-1 gap-1 p-1 lg:grid-cols-[minmax(0,1fr)_300px]"
      >
        <section
          id="asset-detail-panel"
          aria-label="资产详情区"
          className="flex min-h-[560px] min-w-0 flex-col overflow-hidden rounded border border-white/8 bg-[#0d1218] lg:min-h-0"
        >
          <section
            id="asset-info-card"
            aria-label="资产信息"
            className="flex h-14 shrink-0 items-center justify-between overflow-hidden border-b border-white/8 px-3"
          >
            <div id="asset-info-identity" className="flex min-w-0 items-center gap-3">
              <div id="asset-info-symbol" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#202832] font-mono text-[10px] text-amber-300">
                BTC
              </div>
              <div id="asset-info-name" className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">Bitcoin / USDT</span>
                  <span className="rounded bg-white/6 px-1.5 py-0.5 font-mono text-[9px] text-[#8d97a3]">PERP</span>
                  <ChevronDown className="size-3 text-[#69727d]" />
                </div>
                <p className="mt-1 truncate font-mono text-[10px] text-[#68727d]">BINANCE · CRYPTO</p>
              </div>
            </div>

            <div id="asset-info-metrics" className="hidden items-center gap-8 sm:flex">
              <div id="asset-info-price" className="text-right">
                <p className="font-mono text-sm text-emerald-400">67,248.40</p>
                <p className="mt-1 font-mono text-[10px] text-emerald-400/80">+1.82%</p>
              </div>
              <div id="asset-info-volume" className="hidden text-right md:block">
                <p className="text-[9px] uppercase tracking-widest text-[#606a75]">24h Volume</p>
                <p className="mt-1 font-mono text-[11px] text-[#a5adb7]">2.48B</p>
              </div>
            </div>
          </section>

          <section
            id="asset-chart-card"
            aria-label="TradingView 图表区域"
            className="relative min-h-[500px] flex-1 overflow-hidden lg:min-h-0"
          >
            <header id="asset-chart-toolbar" className="flex h-10 items-center justify-between border-b border-white/7 px-3">
              <div id="chart-timeframe-tabs" className="flex items-center gap-4 font-mono text-[10px] text-[#67717c]">
                <span className="text-amber-300">1H</span>
                <span>4H</span>
                <span>1D</span>
                <span>1W</span>
              </div>
              <div id="chart-toolbar-label" className="text-[10px] uppercase tracking-[0.18em] text-[#515b66]">
                TradingView
              </div>
            </header>

            <div id="chart-placeholder-canvas" className="absolute inset-x-0 bottom-0 top-10 overflow-hidden">
              <div id="chart-grid-background" className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:80px_64px]" />
              <div id="chart-price-guide" className="absolute left-[7%] right-[7%] top-[43%] border-t border-dashed border-emerald-400/25" />
              <div id="chart-empty-state" className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.02] text-[#59636f]">
                    <BarChart3 className="size-4" />
                  </div>
                  <p className="text-xs text-[#626c77]">图表内容区域</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[#404954]">Chart Placeholder</p>
                </div>
              </div>
            </div>
          </section>
        </section>

        <aside
          id="favorites-panel"
          aria-label="收藏区"
          className="flex min-h-[520px] flex-col overflow-hidden rounded border border-white/8 bg-[#0d1218] lg:min-h-0 lg:w-[300px]"
        >
          <header id="favorites-header" className="flex h-14 shrink-0 items-center justify-between border-b border-white/8 px-3">
            <div id="favorites-title-group" className="flex items-center gap-2">
              <Star className="size-3.5 text-amber-300" />
              <h2 id="favorites-title" className="text-xs font-medium">收藏</h2>
              <span id="favorites-count" className="font-mono text-[9px] text-[#59636e]">05</span>
            </div>
            <button id="favorites-filter-button" type="button" aria-label="收藏筛选" className="flex size-7 items-center justify-center rounded border border-white/8 text-[#75808b]">
              <Settings2 className="size-3" />
            </button>
          </header>

          <div id="favorites-search-area" className="shrink-0 border-b border-white/7 p-2">
            <div id="favorites-search-field" className="flex h-8 items-center gap-2 rounded border border-white/8 bg-black/15 px-2.5 text-[#66717c]">
              <Search className="size-3" />
              <span className="text-[10px]">搜索资产</span>
            </div>
          </div>

          <div id="favorites-list" className="min-h-0 flex-1 overflow-hidden">
            {watchlistRows.map((name, index) => (
              <article
                id={`favorite-row-${index + 1}`}
                key={name}
                className="flex h-14 items-center justify-between border-b border-white/6 px-3"
              >
                <div id={`favorite-row-${index + 1}-identity`} className="min-w-0">
                  <p className="truncate text-[11px] text-[#c7ccd2]">{name}</p>
                  <p className="mt-1 font-mono text-[9px] text-[#525c67]">MARKET · LIVE</p>
                </div>
                <div id={`favorite-row-${index + 1}-quote`} className="text-right">
                  <div className="h-2 w-14 rounded-sm bg-white/[0.055]" />
                  <div className="mt-2 ml-auto h-1.5 w-9 rounded-sm bg-emerald-400/15" />
                </div>
              </article>
            ))}
          </div>

          <footer id="favorites-footer" className="mt-auto flex h-10 shrink-0 items-center gap-2 border-t border-white/7 px-3 text-[9px] uppercase tracking-[0.14em] text-[#535d68]">
            <Activity className="size-3 text-emerald-400" />
            Data connected
          </footer>
        </aside>
      </section>
    </main>
  );
}

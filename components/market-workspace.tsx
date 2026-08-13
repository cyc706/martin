"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Database,
  LoaderCircle,
  Search,
  Star,
  Trash2,
  TrendingUp,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { InputGroupAddon } from "@/components/ui/input-group";
import { TradingViewWidget } from "@/components/trading-view-widget";

type Stock = {
  ts_code: string;
  symbol: string;
  name: string;
  cnspell: string;
  area: string;
  industry: string;
  market: string;
  exchange: string;
};

type Quote = {
  ts_code: string;
  trade_date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  pct_chg: number | null;
};

type Status = "idle" | "loading" | "success" | "error";

const DEFAULT_FAVORITE: Stock = {
  ts_code: "600519.SH",
  symbol: "600519",
  name: "贵州茅台",
  cnspell: "gzmt",
  area: "贵州",
  industry: "白酒",
  market: "主板",
  exchange: "SSE",
};

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" ? value.toFixed(2) : "-";
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number") return "-";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function toTradingViewSymbol(stock: Stock) {
  const [code, suffix] = stock.ts_code.split(".");
  const exchange =
    suffix === "SH"
      ? "SSE"
      : suffix === "SZ"
        ? "SZSE"
        : suffix === "BJ"
          ? "BSE"
          : stock.exchange === "SSE" || stock.exchange === "SZSE"
            ? stock.exchange
            : null;

  return exchange ? `${exchange}:${code}` : null;
}

export function MarketWorkspace() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Stock[]>([]);
  const [searchStatus, setSearchStatus] = useState<Status>("idle");
  const [searchMessage, setSearchMessage] = useState("");
  const [favorites, setFavorites] = useState<Stock[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteStatus, setQuoteStatus] = useState<Status>("idle");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [selectedAssetCode, setSelectedAssetCode] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) return;

      try {
        const stored = window.localStorage.getItem("martin-favorites");
        if (stored) {
          const parsed = JSON.parse(stored);
          const nextFavorites =
            Array.isArray(parsed) && parsed.length > 0
              ? parsed
              : [DEFAULT_FAVORITE];
          setFavorites(nextFavorites);
          setSelectedAssetCode(nextFavorites[0].ts_code);
        } else {
          setFavorites([DEFAULT_FAVORITE]);
          setSelectedAssetCode(DEFAULT_FAVORITE.ts_code);
        }
      } catch {
        setFavorites([DEFAULT_FAVORITE]);
        setSelectedAssetCode(DEFAULT_FAVORITE.ts_code);
      } finally {
        setHydrated(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem("martin-favorites", JSON.stringify(favorites));
    }
  }, [favorites, hydrated]);

  useEffect(() => {
    const keyword = query.trim();
    if (!keyword) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearchStatus("loading");
      setSearchMessage("");

      fetch(`/api/tushare/stocks?q=${encodeURIComponent(keyword)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          const payload = (await response.json()) as {
            items?: Stock[];
            message?: string;
          };
          if (!response.ok) throw new Error(payload.message || "股票搜索失败");
          return payload.items ?? [];
        })
        .then((items) => {
          setResults(items);
          setSearchStatus("success");
        })
        .catch((error) => {
          if (error.name === "AbortError") return;
          setSearchMessage(error instanceof Error ? error.message : "股票搜索失败");
          setSearchStatus("error");
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!hydrated) return;

    if (favorites.length === 0) return;

    const controller = new AbortController();
    let active = true;

    queueMicrotask(() => {
      if (!active) return;

      setQuoteStatus("loading");
      setQuoteMessage("");

      fetch(
        `/api/tushare/quotes?codes=${encodeURIComponent(
          favorites.map((stock) => stock.ts_code).join(","),
        )}`,
        { signal: controller.signal },
      )
        .then(async (response) => {
          const payload = (await response.json()) as {
            items?: Quote[];
            message?: string;
          };
          if (!response.ok) throw new Error(payload.message || "行情获取失败");
          return payload.items ?? [];
        })
        .then((items) => {
          setQuotes(items);
          setQuoteStatus("success");
        })
        .catch((error) => {
          if (error.name === "AbortError") return;
          setQuoteMessage(error instanceof Error ? error.message : "行情获取失败");
          setQuoteStatus("error");
        });
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [favorites, hydrated]);

  function toggleFavorite(stock: Stock) {
    setFavorites((current) =>
      current.filter((item) => item.ts_code !== stock.ts_code),
    );
    setSelectedAssetCode((current) =>
      current === stock.ts_code ? null : current,
    );
  }

  function selectFavorite(stock: Stock) {
    setFavorites((current) =>
      current.some((item) => item.ts_code === stock.ts_code)
        ? current
        : [...current, stock],
    );
    setSelectedAssetCode(stock.ts_code);
    setQuery("");
    setResults([]);
    setSearchStatus("idle");
  }

  const quoteMap = new Map(quotes.map((quote) => [quote.ts_code, quote]));
  const favoriteCodes = new Set(favorites.map((stock) => stock.ts_code));
  const selectedAsset = favorites.find(
    (stock) => stock.ts_code === selectedAssetCode,
  );
  const tradingViewSymbol = selectedAsset
    ? toTradingViewSymbol(selectedAsset) ?? "BINANCE:BTCUSDT"
    : "BINANCE:BTCUSDT";
  const overviewName = selectedAsset?.name ?? "Bitcoin";
  const overviewCode = selectedAsset?.ts_code ?? "BTCUSDT";
  const overviewMarket = selectedAsset
    ? selectedAsset.exchange || selectedAsset.market || "A股"
    : "Binance";

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_300px] gap-1 max-lg:flex max-lg:h-auto max-lg:flex-col">
      <section
        id="asset-details"
        className="flex min-h-0 flex-col overflow-hidden rounded-md bg-card text-sm text-card-foreground"
      >
        <div
          id="asset-overview"
          className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4"
        >
          <div className="flex min-w-0 items-center">
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold">{overviewName}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {overviewCode} · {overviewMarket}
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-5 text-right sm:flex">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                资产类型
              </p>
              <p className="mt-0.5 text-xs font-medium">
                {selectedAsset ? "Stock" : "Crypto"}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                行情状态
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                实时
              </p>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <TradingViewWidget symbol={tradingViewSymbol} />
        </div>
      </section>

      <section
        id="favorites"
        className="flex min-h-0 flex-col overflow-hidden rounded-md bg-card text-sm text-card-foreground"
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-1">
          <div className="space-y-1">
            <Combobox<Stock>
              value={null}
              inputValue={query}
              onInputValueChange={(value) => {
                setQuery(value);
                if (!value.trim()) {
                  setResults([]);
                  setSearchStatus("idle");
                }
              }}
              onValueChange={(stock) => {
                if (stock) selectFavorite(stock);
              }}
              onOpenChange={(open) => {
                if (!open) setQuery("");
              }}
              autoHighlight
              itemToStringLabel={(stock) =>
                stock ? `${stock.name} ${stock.ts_code} ${stock.cnspell}` : ""
              }
              isItemEqualToValue={(first, second) =>
                first?.ts_code === second?.ts_code
              }
            >
              <ComboboxInput
                className="w-full"
                showTrigger={false}
                showClear
                placeholder="搜索并收藏资产"
              >
                <InputGroupAddon align="inline-start">
                  {searchStatus === "loading" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Search className="size-4" />
                  )}
                </InputGroupAddon>
              </ComboboxInput>
              <ComboboxContent>
                <ComboboxList>
                  <ComboboxEmpty>
                    {searchStatus === "error" ? searchMessage : "没有找到匹配的股票。"}
                  </ComboboxEmpty>
                  {results.map((stock) => (
                    <ComboboxItem
                      key={stock.ts_code}
                      value={stock}
                      className="py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{stock.name}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {stock.ts_code}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {stock.market || stock.exchange || "A股"}
                          {stock.industry ? ` · ${stock.industry}` : ""}
                        </p>
                      </div>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {favoriteCodes.has(stock.ts_code) ? "已收藏" : "回车收藏"}
                      </span>
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {favorites.length === 0 ? (
              <div className="rounded-md border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
                <Star className="mx-auto mb-2 size-5" />
                搜索股票后点击「收藏」，这里会显示资产。
              </div>
            ) : quoteStatus === "loading" ? (
              <div className="flex items-center justify-center gap-2 rounded-md border px-3 py-8 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                正在获取行情...
              </div>
            ) : quoteStatus === "error" ? (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 px-3 py-6 text-sm text-destructive">
                <XCircle className="size-4" />
                {quoteMessage}
              </div>
            ) : (
              <div className="space-y-1">
                {favorites.map((stock) => {
                  const quote = quoteMap.get(stock.ts_code);
                  const isPositive = (quote?.pct_chg ?? 0) > 0;
                  return (
                    <div
                      key={stock.ts_code}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedAssetCode(stock.ts_code)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedAssetCode(stock.ts_code);
                        }
                      }}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-3 transition-colors hover:bg-muted/60 ${
                        selectedAssetCode === stock.ts_code
                          ? "border-primary/40 bg-muted/40"
                          : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{stock.name}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {stock.ts_code}
                          </span>
                          <span className="text-xs text-muted-foreground">
                          {quote?.trade_date ? `${quote.trade_date} · ` : "暂无最新数据 · "}
                            收盘 {formatNumber(quote?.close)}
                          </span>
                        </div>
                      </div>
                      <div className={`text-right ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                        <div className="flex items-center justify-end gap-1 text-sm font-medium">
                          <TrendingUp className="size-3.5" />
                          {formatPercent(quote?.pct_chg)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          高 {formatNumber(quote?.high)} / 低 {formatNumber(quote?.low)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`取消收藏 ${stock.name}`}
                        onClick={() => toggleFavorite(stock)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Database className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">数据源</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                使用 Tushare Pro daily 接口获取最近交易日行情数据。
              </p>
            </div>
            <div className="rounded-md border border-dashed p-3 text-xs leading-5 text-muted-foreground">
              搜索股票后按回车即可加入收藏。行情数据仅作展示，不构成投资建议。
            </div>
          </div>
        </div>
        <footer className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
          <Activity className="size-3.5 text-emerald-600" />
          服务运行正常
        </footer>
      </section>
    </div>
  );
}

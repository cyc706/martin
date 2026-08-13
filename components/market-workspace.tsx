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

type Ticker = {
  market: "CN" | "US" | "HK" | "CRYPTO";
  assetType: "stock" | "crypto";
  exchange: string;
  symbol: string;
  name: string;
  nameEn?: string;
  currency: "CNY" | "USD" | "HKD" | "USDT" | "USDC";
  status: "active" | "inactive";
  tradingViewSymbol?: string;
  source?: {
    provider: string;
    symbol: string;
  };
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

const DEFAULT_FAVORITE: Ticker = {
  market: "CN",
  assetType: "stock",
  exchange: "SSE",
  symbol: "600519",
  name: "贵州茅台",
  nameEn: "Kweichow Moutai Co.,Ltd.",
  currency: "CNY",
  status: "active",
  tradingViewSymbol: "SSE:600519",
  source: { provider: "tushare", symbol: "600519.SH" },
};

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" ? value.toFixed(2) : "-";
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number") return "-";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function tickerKey(ticker: Ticker) {
  return `${ticker.exchange}:${ticker.symbol}`;
}

function toTradingViewSymbol(ticker: Ticker) {
  if (ticker.tradingViewSymbol) return ticker.tradingViewSymbol;

  const sourceSymbol = ticker.source?.symbol;
  if (sourceSymbol) {
    const [code, suffix] = sourceSymbol.split(".");
    const exchange =
      suffix === "SH"
        ? "SSE"
        : suffix === "SZ"
          ? "SZSE"
          : suffix === "BJ"
            ? "BSE"
            : null;
    if (exchange) return `${exchange}:${code}`;
  }

  return ticker.exchange && ticker.symbol
    ? `${ticker.exchange}:${ticker.symbol}`
    : null;
}

function quoteCode(ticker: Ticker) {
  const sourceSymbol = ticker.source?.symbol;
  return sourceSymbol && /\.(SH|SZ|BJ)$/.test(sourceSymbol)
    ? sourceSymbol
    : null;
}

function normalizeFavorite(value: unknown): Ticker | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Partial<Ticker> & { ts_code?: string };

  if (item.ts_code && item.name) {
    const [code, suffix] = item.ts_code.split(".");
    const exchange =
      suffix === "SH" ? "SSE" : suffix === "SZ" ? "SZSE" : "BSE";
    return {
      ...DEFAULT_FAVORITE,
      exchange,
      symbol: code,
      name: item.name,
      source: { provider: "tushare", symbol: item.ts_code },
      tradingViewSymbol: `${exchange}:${code}`,
    };
  }

  if (item.exchange && item.symbol && item.name) {
    return {
      market:
        item.market === "CN" ||
        item.market === "US" ||
        item.market === "HK" ||
        item.market === "CRYPTO"
          ? item.market
          : "CN",
      assetType: item.assetType === "crypto" ? "crypto" : "stock",
      exchange: item.exchange,
      symbol: item.symbol,
      name: item.name,
      nameEn: item.nameEn,
      currency: item.currency ?? "CNY",
      status: item.status ?? "active",
      tradingViewSymbol: item.tradingViewSymbol,
      source: item.source,
    };
  }

  return null;
}

export function MarketWorkspace() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Ticker[]>([]);
  const [searchStatus, setSearchStatus] = useState<Status>("idle");
  const [searchMessage, setSearchMessage] = useState("");
  const [favorites, setFavorites] = useState<Ticker[]>([]);
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
          const parsedFavorites = Array.isArray(parsed)
            ? parsed
                .map(normalizeFavorite)
                .filter((item): item is Ticker => item !== null)
            : [];
          const nextFavorites =
            parsedFavorites.length > 0 ? parsedFavorites : [DEFAULT_FAVORITE];
          setFavorites(nextFavorites);
          setSelectedAssetCode(tickerKey(nextFavorites[0]));
        } else {
          setFavorites([DEFAULT_FAVORITE]);
          setSelectedAssetCode(tickerKey(DEFAULT_FAVORITE));
        }
      } catch {
        setFavorites([DEFAULT_FAVORITE]);
        setSelectedAssetCode(tickerKey(DEFAULT_FAVORITE));
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

      fetch(`/api/tickers?q=${encodeURIComponent(keyword)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          const payload = (await response.json()) as {
            items?: Ticker[];
            message?: string;
          };
          if (!response.ok) throw new Error(payload.message || "资产搜索失败");
          return payload.items ?? [];
        })
        .then((items) => {
          setResults(items);
          setSearchStatus("success");
        })
        .catch((error) => {
          if (error.name === "AbortError") return;
          setSearchMessage(error instanceof Error ? error.message : "资产搜索失败");
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

    const quoteCodes = favorites
      .map(quoteCode)
      .filter((code): code is string => code !== null);

    if (quoteCodes.length === 0) {
      let active = true;
      queueMicrotask(() => {
        if (!active) return;
        setQuotes([]);
        setQuoteStatus("success");
        setQuoteMessage("");
      });
      return () => {
        active = false;
      };
    }

    const controller = new AbortController();
    let active = true;

    queueMicrotask(() => {
      if (!active) return;

      setQuoteStatus("loading");
      setQuoteMessage("");

      fetch(
        `/api/tushare/quotes?codes=${encodeURIComponent(
          quoteCodes.join(","),
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

  function toggleFavorite(stock: Ticker) {
    setFavorites((current) =>
      current.filter((item) => tickerKey(item) !== tickerKey(stock)),
    );
    setSelectedAssetCode((current) =>
      current === tickerKey(stock) ? null : current,
    );
  }

  function selectFavorite(stock: Ticker) {
    setFavorites((current) =>
      current.some((item) => tickerKey(item) === tickerKey(stock))
        ? current
        : [...current, stock],
    );
    setSelectedAssetCode(tickerKey(stock));
    setQuery("");
    setResults([]);
    setSearchStatus("idle");
  }

  const quoteMap = new Map(quotes.map((quote) => [quote.ts_code, quote]));
  const favoriteCodes = new Set(favorites.map(tickerKey));
  const selectedAsset = favorites.find(
    (stock) => tickerKey(stock) === selectedAssetCode,
  );
  const tradingViewSymbol = selectedAsset
    ? toTradingViewSymbol(selectedAsset) ?? "BINANCE:BTCUSDT"
    : "BINANCE:BTCUSDT";
  const overviewName = selectedAsset?.name ?? "Bitcoin";
  const overviewCode = selectedAsset?.symbol ?? "BTCUSDT";
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
                {selectedAsset?.assetType === "crypto" ? "Crypto" : "Stock"}
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
            <Combobox<Ticker>
              items={results}
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
              filter={null}
              itemToStringLabel={(stock) =>
                stock ? `${stock.name} ${stock.symbol} ${stock.exchange}` : ""
              }
              isItemEqualToValue={(first, second) =>
                first && second ? tickerKey(first) === tickerKey(second) : first === second
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
                    {searchStatus === "error" ? searchMessage : "没有找到匹配的资产。"}
                  </ComboboxEmpty>
                  {results.map((stock) => (
                    <ComboboxItem
                      key={tickerKey(stock)}
                      value={stock}
                      className="py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{stock.name}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {stock.exchange}:{stock.symbol}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {stock.market} · {stock.assetType === "crypto" ? "加密货币" : "股票"}
                          {stock.nameEn && stock.nameEn !== stock.name ? ` · ${stock.nameEn}` : ""}
                        </p>
                      </div>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {favoriteCodes.has(tickerKey(stock)) ? "已收藏" : "回车收藏"}
                      </span>
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {favorites.length === 0 ? (
              <div className="rounded-md border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
                <Star className="mx-auto mb-2 size-5" />
                搜索资产后点击「收藏」，这里会显示资产。
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
                  const quote = quoteMap.get(quoteCode(stock) ?? "");
                  const isPositive = (quote?.pct_chg ?? 0) > 0;
                  return (
                    <div
                      key={tickerKey(stock)}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedAssetCode(tickerKey(stock))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedAssetCode(tickerKey(stock));
                        }
                      }}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-3 transition-colors hover:bg-muted/60 ${
                        selectedAssetCode === tickerKey(stock)
                          ? "border-primary/40 bg-muted/40"
                          : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{stock.name}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {stock.source?.symbol ?? stock.symbol}
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
                资产搜索来自 MongoDB tickers；A 股行情使用 Tushare Pro daily 接口。
              </p>
            </div>
            <div className="rounded-md border border-dashed p-3 text-xs leading-5 text-muted-foreground">
              搜索资产后按回车即可加入收藏。行情数据仅作展示，不构成投资建议。
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

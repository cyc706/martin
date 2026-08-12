"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Search, Star, Trash2, TrendingUp, XCircle } from "lucide-react";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" ? value.toFixed(2) : "-";
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number") return "-";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
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

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) return;

      try {
        const stored = window.localStorage.getItem("martin-favorites");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setFavorites(parsed);
        }
      } catch {
        // Ignore malformed local storage and start with an empty list.
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
    if (!hydrated || favorites.length === 0) return;

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

  function toggleFavorite(stock: Stock) {
    setFavorites((current) =>
      current.some((item) => item.ts_code === stock.ts_code)
        ? current.filter((item) => item.ts_code !== stock.ts_code)
        : [...current, stock],
    );
  }

  const favoriteCodes = new Set(favorites.map((stock) => stock.ts_code));
  const quoteMap = new Map(quotes.map((quote) => [quote.ts_code, quote]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>股票搜索与自选</CardTitle>
        <CardDescription>
          按股票代码、名称或拼音搜索，收藏后在下方查看最近交易日行情。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
            if (!stock) return;
            if (!favoriteCodes.has(stock.ts_code)) toggleFavorite(stock);
            setQuery("");
            setResults([]);
            setSearchStatus("idle");
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
            showTrigger={false}
            showClear
            placeholder="搜索股票名称、代码或拼音，例如：平安银行 / 000001"
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
              {results.map((stock) => {
                const isFavorite = favoriteCodes.has(stock.ts_code);
                return (
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
                      {isFavorite ? "已收藏" : "回车收藏"}
                    </span>
                  </ComboboxItem>
                );
              })}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <div className="border-t pt-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">我的自选</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                收藏保存在当前浏览器中
              </p>
            </div>
            <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
              {favorites.length} 只
            </span>
          </div>

          {favorites.length === 0 ? (
            <div className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
              <Star className="mx-auto mb-2 size-5" />
              搜索股票后点击「收藏」，这里会显示行情。
            </div>
          ) : quoteStatus === "loading" ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border px-3 py-8 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              正在获取行情...
            </div>
          ) : quoteStatus === "error" ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-6 text-sm text-destructive">
              <XCircle className="size-4" />
              {quoteMessage}
            </div>
          ) : (
            <div className="space-y-2">
              {favorites.map((stock) => {
                const quote = quoteMap.get(stock.ts_code);
                const isPositive = (quote?.pct_chg ?? 0) > 0;
                return (
                  <div
                    key={stock.ts_code}
                    className="flex items-center gap-3 rounded-lg border px-3 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{stock.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {stock.ts_code}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {quote?.trade_date ? `${quote.trade_date} · ` : "暂无最新数据 · "}
                        收盘 {formatNumber(quote?.close)}
                      </p>
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
        </div>
      </CardContent>
      <CardFooter className="justify-between gap-3 text-xs text-muted-foreground">
        <span>行情来自 Tushare Pro daily 接口</span>
        <span>仅作数据展示，不构成投资建议</span>
      </CardFooter>
    </Card>
  );
}

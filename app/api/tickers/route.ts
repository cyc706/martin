import { NextResponse } from "next/server";

import {
  ensureDefaultTickers,
  listTickers,
  type TickerAssetType,
  type TickerListFilters,
  type TickerMarket,
  type TickerStatus,
} from "@/lib/tickers";

const MARKETS = new Set<TickerMarket>(["CN", "US", "HK", "CRYPTO"]);
const ASSET_TYPES = new Set<TickerAssetType>(["index", "stock", "crypto"]);
const STATUSES = new Set<TickerStatus>(["active", "inactive"]);

function getEnumValue<T extends string>(
  value: string | null,
  values: Set<T>,
  normalize: (value: string) => string = (item) => item,
): T | undefined | null {
  if (!value) return undefined;
  const normalized = normalize(value.trim()) as T;
  return values.has(normalized) ? normalized : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const market = getEnumValue(searchParams.get("market"), MARKETS, (value) =>
    value.toUpperCase(),
  );
  const assetType = getEnumValue(searchParams.get("assetType"), ASSET_TYPES, (
    value,
  ) => value.toLowerCase());
  const status = getEnumValue(searchParams.get("status"), STATUSES, (value) =>
    value.toLowerCase(),
  );
  const exchangeCode = searchParams.get("exchange")?.trim();
  const requestedLimit = Number(searchParams.get("limit") ?? 20);

  if (market === null || assetType === null || status === null) {
    return NextResponse.json({ message: "筛选条件无效" }, { status: 400 });
  }

  if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
    return NextResponse.json({ message: "limit 必须是正整数" }, { status: 400 });
  }

  if (!query) {
    return NextResponse.json({ items: [] });
  }

  const filters: TickerListFilters = {
    query,
    market,
    assetType,
    status: status ?? "active",
    exchangeCode: exchangeCode || undefined,
    limit: Math.min(requestedLimit, 50),
  };

  try {
    await ensureDefaultTickers();
    const tickers = await listTickers(filters);
    const items = tickers.map((ticker) => ({
      market: ticker.market,
      assetType: ticker.assetType,
      exchange: ticker.exchangeCode,
      symbol: ticker.symbol,
      name: ticker.name,
      nameEn: ticker.nameEn,
      description: ticker.description,
      currency: ticker.currency,
      status: ticker.status,
      tradingViewSymbol: ticker.tradingViewSymbol,
      source: ticker.source,
    }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { message: "Ticker 搜索失败，请检查数据库连接。" },
      { status: 503 },
    );
  }
}

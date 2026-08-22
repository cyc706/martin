import type {
  Ticker,
  TickerAssetType,
  TickerCurrency,
  TickerInput,
  TickerMarket,
  TickerStatus,
} from "@/lib/tickers";

const MARKETS = new Set<TickerMarket>(["CN", "US", "HK", "CRYPTO"]);
const ASSET_TYPES = new Set<TickerAssetType>(["index", "stock", "crypto"]);
const CURRENCIES = new Set<TickerCurrency>([
  "CNY",
  "USD",
  "HKD",
  "USDT",
  "USDC",
]);
const STATUSES = new Set<TickerStatus>(["active", "inactive"]);

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function enumValue<T extends string>(value: unknown, values: Set<T>): T | null {
  return typeof value === "string" && values.has(value as T)
    ? (value as T)
    : null;
}

export function serializeTicker(ticker: Ticker) {
  return {
    id: ticker._id.toString(),
    market: ticker.market,
    assetType: ticker.assetType,
    exchangeCode: ticker.exchangeCode,
    symbol: ticker.symbol,
    name: ticker.name,
    nameEn: ticker.nameEn,
    description: ticker.description,
    currency: ticker.currency,
    status: ticker.status,
    tradingViewSymbol: ticker.tradingViewSymbol,
    source: ticker.source,
    createdAt: ticker.createdAt.toISOString(),
    updatedAt: ticker.updatedAt.toISOString(),
  };
}

export function parseTickerInput(value: unknown): { input?: TickerInput; message?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { message: "请求内容必须是 JSON 对象" };
  }

  const body = value as Record<string, unknown>;
  const market = enumValue(body.market, MARKETS);
  const assetType = enumValue(body.assetType, ASSET_TYPES);
  const currency = enumValue(body.currency, CURRENCIES);
  const status = enumValue(body.status, STATUSES);
  const exchangeCode = text(body.exchangeCode);
  const symbol = text(body.symbol);
  const name = text(body.name);
  const description = text(body.description);

  if (!market || !assetType || !currency || !status) {
    return { message: "市场、类型、计价货币或状态无效" };
  }

  if (!exchangeCode || !symbol || !name || !description) {
    return { message: "交易所、Symbol、中文名和简介为必填项" };
  }

  const sourceValue = body.source;
  const source =
    sourceValue && typeof sourceValue === "object" && !Array.isArray(sourceValue)
      ? {
          provider: text((sourceValue as Record<string, unknown>).provider),
          symbol: text((sourceValue as Record<string, unknown>).symbol),
        }
      : undefined;

  if (source && (!source.provider || !source.symbol)) {
    return { message: "数据源需要同时填写供应商和代码" };
  }

  return {
    input: {
      market,
      assetType,
      exchangeCode,
      symbol,
      name,
      nameEn: text(body.nameEn) || undefined,
      description,
      currency,
      status,
      tradingViewSymbol: text(body.tradingViewSymbol) || undefined,
      source,
    },
  };
}

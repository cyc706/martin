import type {
  Exchange,
  ExchangeInput,
} from "@/lib/exchanges";
import type {
  TickerAssetType,
  TickerMarket,
  TickerStatus,
} from "@/lib/tickers";

const MARKETS = new Set<TickerMarket>(["CN", "US", "HK", "CRYPTO"]);
const ASSET_TYPES = new Set<TickerAssetType>(["index", "stock", "crypto"]);
const STATUSES = new Set<TickerStatus>(["active", "inactive"]);

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function enumValue<T extends string>(value: unknown, values: Set<T>): T | null {
  return typeof value === "string" && values.has(value as T)
    ? (value as T)
    : null;
}

export function serializeExchange(exchange: Exchange) {
  return {
    id: exchange._id.toString(), code: exchange.code, name: exchange.name,
    nameEn: exchange.nameEn, market: exchange.market,
    countryOrRegion: exchange.countryOrRegion, assetTypes: exchange.assetTypes,
    tradingViewPrefix: exchange.tradingViewPrefix, website: exchange.website,
    description: exchange.description, status: exchange.status,
  };
}

export function parseExchangeInput(value: unknown): { input?: ExchangeInput; message?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { message: "请求内容必须是 JSON 对象" };
  }
  const body = value as Record<string, unknown>;
  const assetTypes = Array.isArray(body.assetTypes)
    ? body.assetTypes.filter((item): item is TickerAssetType => enumValue(item, ASSET_TYPES) !== null)
    : [];
  const code = text(body.code);
  const name = text(body.name);
  const countryOrRegion = text(body.countryOrRegion);
  const description = text(body.description);
  const market = enumValue(body.market, MARKETS);
  const status = enumValue(body.status, STATUSES);

  if (!code || !name || !countryOrRegion || !description) {
    return { message: "代码、中文名、所属地区和简介为必填项" };
  }
  if (!market || !status || assetTypes.length === 0) {
    return { message: "市场、支持的资产类型或状态无效" };
  }

  return {
    input: {
      code, name, market, countryOrRegion, assetTypes, status,
      nameEn: text(body.nameEn) || undefined,
      tradingViewPrefix: text(body.tradingViewPrefix) || undefined,
      website: text(body.website) || undefined,
      description,
    },
  };
}

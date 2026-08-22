import {
  Collection,
  Filter,
  IndexDescription,
  ObjectId,
} from "mongodb";

import { getMongoDb } from "@/lib/mongodb";
import { ensureDefaultExchanges, getExchangeByCode } from "@/lib/exchanges";

export const TICKERS_COLLECTION = "tickers";

export class TickerReferenceError extends Error {}

export type TickerMarket = "CN" | "US" | "HK" | "CRYPTO";
export type TickerAssetType = "index" | "stock" | "crypto";
export type TickerStatus = "active" | "inactive";
export type TickerCurrency = "CNY" | "USD" | "HKD" | "USDT" | "USDC";

export type TickerSource = {
  provider: string;
  symbol: string;
};

export type Ticker = {
  _id: ObjectId;
  market: TickerMarket;
  assetType: TickerAssetType;
  exchangeCode: string;
  symbol: string;
  name: string;
  nameEn?: string;
  description: string;
  currency: TickerCurrency;
  status: TickerStatus;
  tradingViewSymbol?: string;
  source?: TickerSource;
  createdAt: Date;
  updatedAt: Date;
};

export type TickerListFilters = {
  market?: TickerMarket;
  assetType?: TickerAssetType;
  exchangeCode?: string;
  status?: TickerStatus;
  query?: string;
  limit?: number;
};

export type TickerInput = Omit<Ticker, "_id" | "createdAt" | "updatedAt">;

export const DEFAULT_TICKERS: TickerInput[] = [
  {
    market: "CRYPTO",
    assetType: "crypto",
    exchangeCode: "BINANCE",
    symbol: "BTC",
    name: "比特币",
    nameEn: "Bitcoin",
    description: "市值最大的加密资产，也是加密市场的基准资产。",
    currency: "USDT",
    status: "active",
    tradingViewSymbol: "BINANCE:BTCUSDT",
    source: { provider: "binance", symbol: "BTCUSDT" },
  },
  {
    market: "CRYPTO",
    assetType: "crypto",
    exchangeCode: "BINANCE",
    symbol: "ETH",
    name: "以太坊",
    nameEn: "Ethereum",
    description: "支持智能合约与去中心化应用的主流区块链原生资产。",
    currency: "USDT",
    status: "active",
    tradingViewSymbol: "BINANCE:ETHUSDT",
    source: { provider: "binance", symbol: "ETHUSDT" },
  },
  {
    market: "CRYPTO",
    assetType: "crypto",
    exchangeCode: "HYPERLIQUID",
    symbol: "HYPE",
    name: "Hype",
    nameEn: "Hyperliquid",
    description: "Hyperliquid Layer 1 及其去中心化永续合约交易平台的原生代币。",
    currency: "USDC",
    status: "active",
    tradingViewSymbol: "HYPERLIQUID:HYPEUSDC",
    source: { provider: "hyperliquid", symbol: "HYPE" },
  },
  {
    market: "HK",
    assetType: "stock",
    exchangeCode: "HKEX",
    symbol: "02513",
    name: "智谱",
    nameEn: "Zhipu AI",
    description: "人工智能公司，专注于大模型与 AI 原生产品服务。",
    currency: "HKD",
    status: "active",
    tradingViewSymbol: "HKEX:2513",
    source: { provider: "hkex", symbol: "02513" },
  },
  {
    market: "HK",
    assetType: "stock",
    exchangeCode: "HKEX",
    symbol: "00100",
    name: "MiniMax",
    nameEn: "MiniMax",
    description: "人工智能公司，提供多模态大模型与 AI 原生产品服务。",
    currency: "HKD",
    status: "active",
    tradingViewSymbol: "HKEX:100",
    source: { provider: "hkex", symbol: "00100" },
  },
  {
    market: "HK",
    assetType: "stock",
    exchangeCode: "HKEX",
    symbol: "00175",
    name: "吉利汽车",
    nameEn: "Geely Automobile Holdings",
    description: "中国汽车制造商，业务覆盖燃油车、新能源汽车与智能出行。",
    currency: "HKD",
    status: "active",
    tradingViewSymbol: "HKEX:175",
    source: { provider: "hkex", symbol: "00175" },
  },
  {
    market: "HK",
    assetType: "stock",
    exchangeCode: "HKEX",
    symbol: "00700",
    name: "腾讯控股",
    nameEn: "Tencent Holdings",
    description: "互联网与科技公司，业务包括社交、游戏、云服务及金融科技。",
    currency: "HKD",
    status: "active",
    tradingViewSymbol: "HKEX:700",
    source: { provider: "hkex", symbol: "00700" },
  },
  {
    market: "HK",
    assetType: "stock",
    exchangeCode: "HKEX",
    symbol: "09988",
    name: "阿里巴巴-W",
    nameEn: "Alibaba Group Holding",
    description: "全球性科技企业，核心业务包括电商、云计算与数字服务。",
    currency: "HKD",
    status: "active",
    tradingViewSymbol: "HKEX:9988",
    source: { provider: "hkex", symbol: "09988" },
  },
  {
    market: "HK",
    assetType: "stock",
    exchangeCode: "HKEX",
    symbol: "02015",
    name: "理想汽车-W",
    nameEn: "Li Auto",
    description: "中国新能源汽车制造商，专注于智能电动汽车产品。",
    currency: "HKD",
    status: "active",
    tradingViewSymbol: "HKEX:2015",
    source: { provider: "hkex", symbol: "02015" },
  },
  {
    market: "HK",
    assetType: "stock",
    exchangeCode: "HKEX",
    symbol: "01810",
    name: "小米集团-W",
    nameEn: "Xiaomi Corporation",
    description: "消费电子与智能硬件公司，涵盖智能手机、IoT 和电动汽车业务。",
    currency: "HKD",
    status: "active",
    tradingViewSymbol: "HKEX:1810",
    source: { provider: "hkex", symbol: "01810" },
  },
  {
    market: "HK",
    assetType: "stock",
    exchangeCode: "HKEX",
    symbol: "09868",
    name: "小鹏汽车-W",
    nameEn: "XPeng",
    description: "中国智能电动汽车制造商。",
    currency: "HKD",
    status: "active",
    tradingViewSymbol: "HKEX:9868",
    source: { provider: "hkex", symbol: "09868" },
  },
  {
    market: "HK",
    assetType: "stock",
    exchangeCode: "HKEX",
    symbol: "09992",
    name: "泡泡玛特",
    nameEn: "Pop Mart International Group",
    description: "潮流玩具与文化娱乐消费品牌运营商。",
    currency: "HKD",
    status: "active",
    tradingViewSymbol: "HKEX:9992",
    source: { provider: "hkex", symbol: "09992" },
  },
  {
    market: "HK",
    assetType: "stock",
    exchangeCode: "HKEX",
    symbol: "03690",
    name: "美团-W",
    nameEn: "Meituan",
    description: "本地生活服务科技平台，覆盖餐饮外卖、到店及即时零售服务。",
    currency: "HKD",
    status: "active",
    tradingViewSymbol: "HKEX:3690",
    source: { provider: "hkex", symbol: "03690" },
  },
  {
    market: "HK",
    assetType: "stock",
    exchangeCode: "HKEX",
    symbol: "09866",
    name: "蔚来-SW",
    nameEn: "NIO",
    description: "中国智能电动汽车制造商及相关能源服务运营商。",
    currency: "HKD",
    status: "active",
    tradingViewSymbol: "HKEX:9866",
    source: { provider: "hkex", symbol: "09866" },
  },
  {
    market: "HK",
    assetType: "stock",
    exchangeCode: "HKEX",
    symbol: "09863",
    name: "零跑汽车",
    nameEn: "Leapmotor",
    description: "中国新能源汽车制造商，聚焦智能电动汽车研发与销售。",
    currency: "HKD",
    status: "active",
    tradingViewSymbol: "HKEX:9863",
    source: { provider: "hkex", symbol: "09863" },
  },
];

const TICKER_INDEXES: IndexDescription[] = [
  {
    key: { exchangeCode: 1, symbol: 1 },
    name: "ticker_exchange_code_symbol_unique",
    unique: true,
  },
  {
    key: { market: 1, assetType: 1, status: 1 },
    name: "ticker_market_asset_type_status",
  },
  {
    key: { name: 1 },
    name: "ticker_name",
  },
];

function normalizeIdentifier(value: string) {
  return value.trim().toUpperCase();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getTickersCollection(): Promise<Collection<Ticker>> {
  const database = await getMongoDb();
  return database.collection<Ticker>(TICKERS_COLLECTION);
}

export async function ensureTickerIndexes() {
  const collection = await getTickersCollection();
  await collection.createIndexes(TICKER_INDEXES);
}

export async function ensureDefaultTickers() {
  const collection = await getTickersCollection();
  const now = new Date();

  await ensureDefaultExchanges();
  await collection.updateMany(
    { exchangeCode: { $exists: false } },
    [{ $set: { exchangeCode: "$exchange" } }],
  );
  await collection.createIndexes(TICKER_INDEXES);
  await collection.bulkWrite(
    DEFAULT_TICKERS.map((ticker) => ({
      updateOne: {
        filter: { exchangeCode: ticker.exchangeCode, symbol: ticker.symbol },
        update: { $setOnInsert: { ...ticker, createdAt: now, updatedAt: now } },
        upsert: true,
      },
    })),
  );
  await collection.updateOne(
    { exchangeCode: "HKEX", symbol: "00100", name: "五矿资源" },
    {
      $set: {
        name: "MiniMax",
        nameEn: "MiniMax",
        description: "人工智能公司，提供多模态大模型与 AI 原生产品服务。",
        updatedAt: now,
      },
    },
  );
  await collection.updateOne(
    { exchangeCode: "HKEX", symbol: "02513", name: "知识图谱" },
    {
      $set: {
        name: "智谱",
        nameEn: "Zhipu AI",
        description: "人工智能公司，专注于大模型与 AI 原生产品服务。",
        updatedAt: now,
      },
    },
  );
}

export async function getTickerByExchangeSymbol(
  exchangeCode: string,
  symbol: string,
) {
  const collection = await getTickersCollection();
  const filter: Filter<Ticker> = {
    exchangeCode: normalizeIdentifier(exchangeCode),
    symbol: normalizeIdentifier(symbol),
  };

  return collection.findOne(filter);
}

export async function listTickers(filters: TickerListFilters = {}) {
  const collection = await getTickersCollection();
  const mongoFilter: Filter<Ticker> = {};

  if (filters.market) mongoFilter.market = filters.market;
  if (filters.assetType) mongoFilter.assetType = filters.assetType;
  if (filters.status) mongoFilter.status = filters.status;
  if (filters.exchangeCode) {
    mongoFilter.exchangeCode = normalizeIdentifier(filters.exchangeCode);
  }

  const query = filters.query?.trim();
  if (query) {
    const pattern = new RegExp(escapeRegex(query), "i");
    mongoFilter.$or = [
      { symbol: pattern },
      { name: pattern },
      { nameEn: pattern },
      { exchangeCode: pattern },
      { "source.symbol": pattern },
    ];
  }

  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 1000);

  return collection
    .find(mongoFilter)
    .sort({ name: 1, exchangeCode: 1, symbol: 1 })
    .limit(limit)
    .toArray();
}

export async function createTicker(input: TickerInput) {
  const collection = await getTickersCollection();
  const exchange = await getExchangeByCode(input.exchangeCode);
  if (!exchange) throw new TickerReferenceError("关联的交易所不存在");
  if (exchange.market !== input.market) {
    throw new TickerReferenceError("Ticker 市场必须与交易所市场一致");
  }
  if (!exchange.assetTypes.includes(input.assetType)) {
    throw new TickerReferenceError("该交易所不支持此资产类型");
  }
  const now = new Date();
  const ticker: Ticker = {
    _id: new ObjectId(),
    ...input,
    exchangeCode: normalizeIdentifier(input.exchangeCode),
    symbol: normalizeIdentifier(input.symbol),
    name: input.name.trim(),
    nameEn: input.nameEn?.trim() || undefined,
    description: input.description.trim(),
    tradingViewSymbol: input.tradingViewSymbol?.trim() || undefined,
    source: input.source
      ? {
          provider: input.source.provider.trim().toLowerCase(),
          symbol: input.source.symbol.trim().toUpperCase(),
        }
      : undefined,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(ticker);
  return ticker;
}

export async function updateTicker(id: string, input: TickerInput) {
  const collection = await getTickersCollection();
  const exchange = await getExchangeByCode(input.exchangeCode);
  if (!exchange) throw new TickerReferenceError("关联的交易所不存在");
  if (exchange.market !== input.market) {
    throw new TickerReferenceError("Ticker 市场必须与交易所市场一致");
  }
  if (!exchange.assetTypes.includes(input.assetType)) {
    throw new TickerReferenceError("该交易所不支持此资产类型");
  }
  return collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...input,
        exchangeCode: normalizeIdentifier(input.exchangeCode),
        symbol: normalizeIdentifier(input.symbol),
        name: input.name.trim(),
        nameEn: input.nameEn?.trim() || undefined,
        description: input.description.trim(),
        tradingViewSymbol: input.tradingViewSymbol?.trim() || undefined,
        source: input.source
          ? {
              provider: input.source.provider.trim().toLowerCase(),
              symbol: input.source.symbol.trim().toUpperCase(),
            }
          : undefined,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );
}

export async function deleteTicker(id: string) {
  const collection = await getTickersCollection();
  return collection.deleteOne({ _id: new ObjectId(id) });
}

export async function countTickersByExchangeCode(exchangeCode: string) {
  return (await getTickersCollection()).countDocuments({
    exchangeCode: normalizeIdentifier(exchangeCode),
  });
}

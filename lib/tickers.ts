import {
  Collection,
  Filter,
  IndexDescription,
  ObjectId,
} from "mongodb";

import { getMongoDb } from "@/lib/mongodb";

export const TICKERS_COLLECTION = "tickers";

export type TickerMarket = "CN" | "US" | "HK" | "CRYPTO";
export type TickerAssetType = "stock" | "crypto";
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
  exchange: string;
  symbol: string;
  name: string;
  nameEn?: string;
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
  exchange?: string;
  status?: TickerStatus;
  query?: string;
  limit?: number;
};

const TICKER_INDEXES: IndexDescription[] = [
  {
    key: { exchange: 1, symbol: 1 },
    name: "ticker_exchange_symbol_unique",
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

export async function getTickerByExchangeSymbol(
  exchange: string,
  symbol: string,
) {
  const collection = await getTickersCollection();
  const filter: Filter<Ticker> = {
    exchange: normalizeIdentifier(exchange),
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
  if (filters.exchange) {
    mongoFilter.exchange = normalizeIdentifier(filters.exchange);
  }

  const query = filters.query?.trim();
  if (query) {
    const pattern = new RegExp(escapeRegex(query), "i");
    mongoFilter.$or = [
      { symbol: pattern },
      { name: pattern },
      { nameEn: pattern },
      { exchange: pattern },
      { "source.symbol": pattern },
    ];
  }

  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 1000);

  return collection
    .find(mongoFilter)
    .sort({ name: 1, exchange: 1, symbol: 1 })
    .limit(limit)
    .toArray();
}

import { Collection, Filter, IndexDescription, ObjectId } from "mongodb";

import {
  type TickerAssetType,
  type TickerMarket,
  type TickerStatus,
} from "@/lib/tickers";
import { getMongoDb } from "@/lib/mongodb";

export const EXCHANGES_COLLECTION = "exchanges";

export type Exchange = {
  _id: ObjectId;
  code: string;
  name: string;
  nameEn?: string;
  market: TickerMarket;
  countryOrRegion: string;
  assetTypes: TickerAssetType[];
  tradingViewPrefix?: string;
  website?: string;
  description: string;
  status: TickerStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type ExchangeInput = Omit<Exchange, "_id" | "createdAt" | "updatedAt">;

const EXCHANGE_INDEXES: IndexDescription[] = [
  { key: { code: 1 }, name: "exchange_code_unique", unique: true },
  { key: { market: 1, status: 1 }, name: "exchange_market_status" },
  { key: { name: 1 }, name: "exchange_name" },
];

export const DEFAULT_EXCHANGES: ExchangeInput[] = [
  { code: "SSE", name: "上海证券交易所", nameEn: "Shanghai Stock Exchange", market: "CN", countryOrRegion: "CN", assetTypes: ["stock", "index"], tradingViewPrefix: "SSE", website: "https://www.sse.com.cn", description: "中国大陆证券交易所，主要服务上海市场上市证券。", status: "active" },
  { code: "SZSE", name: "深圳证券交易所", nameEn: "Shenzhen Stock Exchange", market: "CN", countryOrRegion: "CN", assetTypes: ["stock", "index"], tradingViewPrefix: "SZSE", website: "https://www.szse.cn", description: "中国大陆证券交易所，主要服务深圳市场上市证券。", status: "active" },
  { code: "BSE", name: "北京证券交易所", nameEn: "Beijing Stock Exchange", market: "CN", countryOrRegion: "CN", assetTypes: ["stock", "index"], tradingViewPrefix: "BSE", website: "https://www.bse.cn", description: "服务创新型中小企业的中国大陆证券交易所。", status: "active" },
  { code: "NASDAQ", name: "纳斯达克", nameEn: "Nasdaq", market: "US", countryOrRegion: "US", assetTypes: ["stock", "index"], tradingViewPrefix: "NASDAQ", website: "https://www.nasdaq.com", description: "美国主要证券交易市场，以科技公司上市交易活跃著称。", status: "active" },
  { code: "NYSE", name: "纽约证券交易所", nameEn: "New York Stock Exchange", market: "US", countryOrRegion: "US", assetTypes: ["stock", "index"], tradingViewPrefix: "NYSE", website: "https://www.nyse.com", description: "美国历史悠久的主要证券交易所。", status: "active" },
  { code: "HKEX", name: "香港交易所", nameEn: "Hong Kong Exchanges and Clearing", market: "HK", countryOrRegion: "HK", assetTypes: ["stock", "index"], tradingViewPrefix: "HKEX", website: "https://www.hkex.com.hk", description: "香港的证券及衍生品交易基础设施运营商。", status: "active" },
  { code: "BINANCE", name: "币安", nameEn: "Binance", market: "CRYPTO", countryOrRegion: "GLOBAL", assetTypes: ["crypto"], tradingViewPrefix: "BINANCE", website: "https://www.binance.com", description: "面向全球用户的加密资产交易平台。", status: "active" },
  { code: "OKX", name: "欧易", nameEn: "OKX", market: "CRYPTO", countryOrRegion: "GLOBAL", assetTypes: ["crypto"], tradingViewPrefix: "OKX", website: "https://www.okx.com", description: "提供现货及衍生品服务的加密资产交易平台。", status: "active" },
  { code: "HYPERLIQUID", name: "Hyperliquid", nameEn: "Hyperliquid", market: "CRYPTO", countryOrRegion: "GLOBAL", assetTypes: ["crypto"], tradingViewPrefix: "HYPERLIQUID", website: "https://hyperliquid.xyz", description: "去中心化永续合约交易平台及 Layer 1 网络。", status: "active" },
];

function normalize(value: string) {
  return value.trim().toUpperCase();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getExchangesCollection(): Promise<Collection<Exchange>> {
  return (await getMongoDb()).collection<Exchange>(EXCHANGES_COLLECTION);
}

export async function ensureDefaultExchanges() {
  const collection = await getExchangesCollection();
  const now = new Date();
  await collection.createIndexes(EXCHANGE_INDEXES);
  await collection.bulkWrite(DEFAULT_EXCHANGES.map((exchange) => ({
    updateOne: {
      filter: { code: exchange.code },
      update: { $setOnInsert: { ...exchange, createdAt: now, updatedAt: now } },
      upsert: true,
    },
  })));
}

export async function getExchangeByCode(code: string) {
  return (await getExchangesCollection()).findOne({ code: normalize(code) });
}

export async function getExchangeById(id: string) {
  return (await getExchangesCollection()).findOne({ _id: new ObjectId(id) });
}

export async function listExchanges(query?: string) {
  const collection = await getExchangesCollection();
  const filter: Filter<Exchange> = {};
  if (query?.trim()) {
    const pattern = new RegExp(escapeRegex(query.trim()), "i");
    filter.$or = [{ code: pattern }, { name: pattern }, { nameEn: pattern }, { countryOrRegion: pattern }];
  }
  return collection.find(filter).sort({ market: 1, code: 1 }).toArray();
}

export async function createExchange(input: ExchangeInput) {
  const now = new Date();
  const exchange: Exchange = { _id: new ObjectId(), ...input, code: normalize(input.code), name: input.name.trim(), nameEn: input.nameEn?.trim() || undefined, countryOrRegion: normalize(input.countryOrRegion), assetTypes: input.assetTypes, tradingViewPrefix: input.tradingViewPrefix?.trim().toUpperCase() || undefined, website: input.website?.trim() || undefined, description: input.description.trim(), createdAt: now, updatedAt: now };
  await (await getExchangesCollection()).insertOne(exchange);
  return exchange;
}

export async function updateExchange(id: string, input: ExchangeInput) {
  return (await getExchangesCollection()).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...input, code: normalize(input.code), name: input.name.trim(), nameEn: input.nameEn?.trim() || undefined, countryOrRegion: normalize(input.countryOrRegion), tradingViewPrefix: input.tradingViewPrefix?.trim().toUpperCase() || undefined, website: input.website?.trim() || undefined, description: input.description.trim(), updatedAt: new Date() } },
    { returnDocument: "after" },
  );
}

export async function deleteExchange(id: string) {
  return (await getExchangesCollection()).deleteOne({ _id: new ObjectId(id) });
}

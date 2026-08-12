import { NextResponse } from "next/server";

import {
  queryTushare,
  rowsToObjects,
  TushareError,
} from "@/lib/tushare";

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

let stockCache: { expiresAt: number; items: Stock[] } | null = null;

async function getStockList() {
  if (stockCache && stockCache.expiresAt > Date.now()) {
    return stockCache.items;
  }

  const table = await queryTushare(
    "stock_basic",
    { list_status: "L" },
    "ts_code,symbol,name,cnspell,area,industry,market,exchange",
  );
  const items = rowsToObjects<Stock>(table);

  stockCache = {
    items,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };

  return items;
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase();

  if (!query) {
    return NextResponse.json({ items: [] });
  }

  try {
    const stocks = await getStockList();
    const items = stocks
      .filter((stock) =>
        [stock.ts_code, stock.symbol, stock.name, stock.cnspell]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query)),
      )
      .slice(0, 20);

    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof TushareError) {
      return NextResponse.json(
        { message: error.message, code: error.code },
        { status: error.status },
      );
    }

    return NextResponse.json({ message: "股票搜索失败" }, { status: 500 });
  }
}

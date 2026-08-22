import { NextResponse } from "next/server";

import { parseTickerInput, serializeTicker } from "@/lib/ticker-api";
import {
  createTicker,
  ensureDefaultTickers,
  listTickers,
  TickerReferenceError,
} from "@/lib/tickers";

function databaseError(error: unknown, fallback: string) {
  if (error instanceof TickerReferenceError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
  if (typeof error === "object" && error && "code" in error && error.code === 11000) {
    return NextResponse.json(
      { message: "该交易所的 Symbol 已存在" },
      { status: 409 },
    );
  }

  return NextResponse.json({ message: fallback }, { status: 503 });
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();

  try {
    await ensureDefaultTickers();
    const tickers = await listTickers({ query: query || undefined, limit: 1000 });
    return NextResponse.json({ items: tickers.map(serializeTicker) });
  } catch (error) {
    return databaseError(error, "Ticker 列表读取失败，请检查数据库连接。");
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "请求内容不是有效 JSON" }, { status: 400 });
  }

  const parsed = parseTickerInput(payload);
  if (!parsed.input) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  try {
    await ensureDefaultTickers();
    const ticker = await createTicker(parsed.input);
    return NextResponse.json({ item: serializeTicker(ticker) }, { status: 201 });
  } catch (error) {
    return databaseError(error, "Ticker 创建失败，请检查数据库连接。");
  }
}

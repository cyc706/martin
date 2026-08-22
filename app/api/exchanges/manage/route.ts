import { NextResponse } from "next/server";

import { parseExchangeInput, serializeExchange } from "@/lib/exchange-api";
import { createExchange, ensureDefaultExchanges, listExchanges } from "@/lib/exchanges";

function databaseError(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "code" in error && error.code === 11000) {
    return NextResponse.json({ message: "交易所代码已存在" }, { status: 409 });
  }
  return NextResponse.json({ message: fallback }, { status: 503 });
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  try {
    await ensureDefaultExchanges();
    return NextResponse.json({ items: (await listExchanges(query)).map(serializeExchange) });
  } catch (error) {
    return databaseError(error, "交易所列表读取失败，请检查数据库连接。");
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ message: "请求内容不是有效 JSON" }, { status: 400 }); }
  const parsed = parseExchangeInput(payload);
  if (!parsed.input) return NextResponse.json({ message: parsed.message }, { status: 400 });
  try {
    await ensureDefaultExchanges();
    return NextResponse.json({ item: serializeExchange(await createExchange(parsed.input)) }, { status: 201 });
  } catch (error) {
    return databaseError(error, "交易所创建失败，请检查数据库连接。");
  }
}

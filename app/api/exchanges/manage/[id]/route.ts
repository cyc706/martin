import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import { parseExchangeInput, serializeExchange } from "@/lib/exchange-api";
import { deleteExchange, getExchangeById, updateExchange } from "@/lib/exchanges";
import { countTickersByExchangeCode } from "@/lib/tickers";

function invalidIdResponse(id: string) {
  return ObjectId.isValid(id) ? null : NextResponse.json({ message: "交易所 ID 无效" }, { status: 400 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const invalid = invalidIdResponse(id);
  if (invalid) return invalid;
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ message: "请求内容不是有效 JSON" }, { status: 400 }); }
  const parsed = parseExchangeInput(payload);
  if (!parsed.input) return NextResponse.json({ message: parsed.message }, { status: 400 });
  try {
    const current = await getExchangeById(id);
    if (!current) return NextResponse.json({ message: "交易所不存在" }, { status: 404 });
    if (
      current.code !== parsed.input.code.trim().toUpperCase() &&
      (await countTickersByExchangeCode(current.code))
    ) {
      return NextResponse.json(
        { message: "该交易所仍有关联 Ticker，不能修改交易所代码" },
        { status: 409 },
      );
    }
    const exchange = await updateExchange(id, parsed.input);
    return exchange ? NextResponse.json({ item: serializeExchange(exchange) }) : NextResponse.json({ message: "交易所不存在" }, { status: 404 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === 11000) return NextResponse.json({ message: "交易所代码已存在" }, { status: 409 });
    return NextResponse.json({ message: "交易所更新失败，请检查数据库连接。" }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const invalid = invalidIdResponse(id);
  if (invalid) return invalid;
  try {
    const exchange = await getExchangeById(id);
    if (!exchange) return NextResponse.json({ message: "交易所不存在" }, { status: 404 });
    if (await countTickersByExchangeCode(exchange.code)) {
      return NextResponse.json({ message: "该交易所仍有关联 Ticker，无法删除" }, { status: 409 });
    }
    await deleteExchange(id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ message: "交易所删除失败，请检查数据库连接。" }, { status: 503 });
  }
}

import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import { parseTickerInput, serializeTicker } from "@/lib/ticker-api";
import { deleteTicker, TickerReferenceError, updateTicker } from "@/lib/tickers";

function invalidIdResponse(id: string) {
  return !ObjectId.isValid(id)
    ? NextResponse.json({ message: "Ticker ID 无效" }, { status: 400 })
    : null;
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/tickers/manage/[id]">,
) {
  const { id } = await context.params;
  const invalidResponse = invalidIdResponse(id);
  if (invalidResponse) return invalidResponse;

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
    const ticker = await updateTicker(id, parsed.input);
    if (!ticker) {
      return NextResponse.json({ message: "Ticker 不存在" }, { status: 404 });
    }
    return NextResponse.json({ item: serializeTicker(ticker) });
  } catch (error) {
    if (error instanceof TickerReferenceError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (typeof error === "object" && error && "code" in error && error.code === 11000) {
      return NextResponse.json(
        { message: "该交易所的 Symbol 已存在" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { message: "Ticker 更新失败，请检查数据库连接。" },
      { status: 503 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/tickers/manage/[id]">,
) {
  const { id } = await context.params;
  const invalidResponse = invalidIdResponse(id);
  if (invalidResponse) return invalidResponse;

  try {
    const result = await deleteTicker(id);
    if (!result.deletedCount) {
      return NextResponse.json({ message: "Ticker 不存在" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { message: "Ticker 删除失败，请检查数据库连接。" },
      { status: 503 },
    );
  }
}

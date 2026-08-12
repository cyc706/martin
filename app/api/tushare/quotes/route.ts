import { NextResponse } from "next/server";

import {
  queryTushare,
  rowsToObjects,
  TushareError,
} from "@/lib/tushare";

type DailyQuote = {
  ts_code: string;
  trade_date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  pre_close: number | null;
  change: number | null;
  pct_chg: number | null;
  vol: number | null;
  amount: number | null;
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

export async function GET(request: Request) {
  const codes = Array.from(
    new Set(
      new URL(request.url).searchParams
        .get("codes")
        ?.split(",")
        .map((code) => code.trim().toUpperCase())
        .filter(Boolean) ?? [],
    ),
  ).slice(0, 50);

  if (!codes.length) {
    return NextResponse.json({ items: [] });
  }

  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 14);

  try {
    const table = await queryTushare(
      "daily",
      {
        ts_code: codes.join(","),
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
      },
      "ts_code,trade_date,open,high,low,close,pre_close,change,pct_chg,vol,amount",
    );
    const rows = rowsToObjects<DailyQuote>(table);
    const latest = new Map<string, DailyQuote>();

    for (const row of rows) {
      const current = latest.get(row.ts_code);
      if (!current || row.trade_date > current.trade_date) {
        latest.set(row.ts_code, row);
      }
    }

    return NextResponse.json({ items: Array.from(latest.values()) });
  } catch (error) {
    if (error instanceof TushareError) {
      return NextResponse.json(
        { message: error.message, code: error.code },
        { status: error.status },
      );
    }

    return NextResponse.json({ message: "行情获取失败" }, { status: 500 });
  }
}

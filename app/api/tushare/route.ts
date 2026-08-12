import { NextResponse } from "next/server";

const TUSHARE_API_URL = "https://api.tushare.pro";

type TushareResponse = {
  code: number;
  msg: string | null;
  data?: {
    fields: string[];
    items: unknown[][];
  };
};

export async function POST() {
  const token = process.env.TUSHARE_TOKEN;

  if (!token) {
    return NextResponse.json(
      {
        message: "未配置 TUSHARE_TOKEN，请先在 .env.local 中填写 Token。",
      },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(TUSHARE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_name: "stock_basic",
        token,
        params: { list_status: "L" },
        fields: "ts_code,name,area,industry,list_date",
      }),
      cache: "no-store",
    });

    const result = (await response.json()) as TushareResponse;

    if (!response.ok || result.code !== 0) {
      return NextResponse.json(
        {
          message: result.msg || `Tushare 请求失败（HTTP ${response.status}）`,
          code: result.code,
        },
        { status: 502 },
      );
    }

    const fields = result.data?.fields ?? [];
    const items = result.data?.items ?? [];

    return NextResponse.json({
      api: "stock_basic",
      fields,
      items: items.slice(0, 10),
      total: items.length,
    });
  } catch {
    return NextResponse.json(
      { message: "无法连接 Tushare API，请检查网络连接。" },
      { status: 502 },
    );
  }
}

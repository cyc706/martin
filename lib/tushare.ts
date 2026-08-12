const TUSHARE_API_URL = "https://api.tushare.pro";

export type TushareTable = {
  fields: string[];
  items: unknown[][];
};

export class TushareError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
    public readonly code?: number,
  ) {
    super(message);
    this.name = "TushareError";
  }
}

export async function queryTushare(
  apiName: string,
  params: Record<string, string>,
  fields: string,
): Promise<TushareTable> {
  const token = process.env.TUSHARE_TOKEN;

  if (!token) {
    throw new TushareError(
      "未配置 TUSHARE_TOKEN，请先在 .env.local 中填写 Token。",
      400,
    );
  }

  try {
    const response = await fetch(TUSHARE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_name: apiName,
        token,
        params,
        fields,
      }),
      cache: "no-store",
    });

    const result = (await response.json()) as {
      code: number;
      msg: string | null;
      data?: TushareTable;
    };

    if (!response.ok || result.code !== 0) {
      throw new TushareError(
        result.msg || `Tushare 请求失败（HTTP ${response.status}）`,
        502,
        result.code,
      );
    }

    return result.data ?? { fields: [], items: [] };
  } catch (error) {
    if (error instanceof TushareError) {
      throw error;
    }

    throw new TushareError("无法连接 Tushare API，请检查网络连接。", 502);
  }
}

export function rowsToObjects<T extends Record<string, unknown>>(
  table: TushareTable,
): T[] {
  return table.items.map((item) =>
    Object.fromEntries(
      table.fields.map((field, index) => [field, item[index] ?? null]),
    ),
  ) as T[];
}

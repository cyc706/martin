# Martin - 金融行情查看系统

基于 Next.js、Tailwind CSS 和 shadcn/ui 的金融行情查看系统。目前已接入 Tushare Pro 的最小验证接口。

## 启动项目

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## Tushare 最小验证

Tushare Pro 调用需要注册账号并获取 Token：[获取 Token 的官方说明](https://tushare.pro/document/1?doc_id=39)。

复制环境变量示例并填入自己的 Token：

```bash
cp .env.example .env.local
```

然后编辑 `.env.local`：

```env
TUSHARE_TOKEN=你的_tushare_token
```

启动项目后，可以在首页：

- 按股票代码、名称或拼音搜索股票；
- 将股票收藏到浏览器本地的自选列表；
- 查看自选股最近交易日的收盘价、涨跌幅、最高价和最低价。

搜索由服务端调用 `stock_basic` 接口并缓存股票列表，行情由服务端调用 `daily` 接口。Token 只在服务端使用，不会发送到浏览器。

接口请求格式参考 [Tushare HTTP API 文档](https://tushare.pro/document/1?doc_id=130)。

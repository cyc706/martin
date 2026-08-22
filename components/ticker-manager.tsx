"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type TickerMarket = "CN" | "US" | "HK" | "CRYPTO";
type TickerAssetType = "index" | "stock" | "crypto";
type TickerCurrency = "CNY" | "USD" | "HKD" | "USDT" | "USDC";
type TickerStatus = "active" | "inactive";
type ManagedTicker = { id: string; market: TickerMarket; assetType: TickerAssetType; exchangeCode: string; symbol: string; name: string; nameEn?: string; description: string; currency: TickerCurrency; status: TickerStatus; tradingViewSymbol?: string; source?: { provider: string; symbol: string } };
type ExchangeOption = { code: string; name: string; market: TickerMarket; assetTypes: TickerAssetType[]; tradingViewPrefix?: string };
type TickerForm = Omit<ManagedTicker, "id">;

const EMPTY_FORM: TickerForm = { market: "CRYPTO", assetType: "crypto", exchangeCode: "", symbol: "", name: "", nameEn: "", description: "", currency: "USDT", status: "active", tradingViewSymbol: "", source: { provider: "", symbol: "" } };
const marketLabels: Record<TickerMarket, string> = { CN: "中国大陆", US: "美国", HK: "香港", CRYPTO: "Crypto" };
const typeLabels: Record<TickerAssetType, string> = { index: "指数", stock: "股票", crypto: "Crypto" };

function toForm(ticker: ManagedTicker): TickerForm {
  return { market: ticker.market, assetType: ticker.assetType, exchangeCode: ticker.exchangeCode, symbol: ticker.symbol, name: ticker.name, nameEn: ticker.nameEn ?? "", description: ticker.description, currency: ticker.currency, status: ticker.status, tradingViewSymbol: ticker.tradingViewSymbol ?? "", source: ticker.source ?? { provider: "", symbol: "" } };
}

function requestPayload(form: TickerForm) {
  const hasSource = Boolean(form.source?.provider || form.source?.symbol);
  return { ...form, nameEn: form.nameEn || undefined, tradingViewSymbol: form.tradingViewSymbol || undefined, source: hasSource ? form.source : undefined };
}

export function TickerManager() {
  const [tickers, setTickers] = useState<ManagedTicker[]>([]);
  const [form, setForm] = useState<TickerForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickExchangeCode, setQuickExchangeCode] = useState("");
  const [quickSymbol, setQuickSymbol] = useState("");
  const [exchanges, setExchanges] = useState<ExchangeOption[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadTickers = useCallback(async (search = "") => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tickers/manage${search ? `?q=${encodeURIComponent(search)}` : ""}`);
      const payload = (await response.json()) as { items?: ManagedTicker[]; message?: string };
      if (!response.ok) throw new Error(payload.message || "Ticker 读取失败");
      setTickers(payload.items ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ticker 读取失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadTickers(query.trim()), 200);
    return () => window.clearTimeout(timer);
  }, [loadTickers, query]);

  useEffect(() => {
    void fetch("/api/exchanges/manage")
      .then(async (response) => {
        const payload = (await response.json()) as { items?: ExchangeOption[] };
        if (response.ok) setExchanges(payload.items ?? []);
      })
      .catch(() => undefined);
  }, []);

  function updateField<Key extends keyof TickerForm>(key: Key, value: TickerForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function closeEditor() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsEditorOpen(false);
    setMessage("");
  }

  function openCreateEditor() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setMessage("");
    setIsEditorOpen(true);
  }

  function openQuickAdd() {
    setQuickExchangeCode(exchanges[0]?.code ?? "");
    setQuickSymbol("");
    setMessage("");
    setIsQuickAddOpen(true);
  }

  function continueQuickAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const exchange = exchanges.find((item) => item.code === quickExchangeCode);
    const symbol = quickSymbol.trim().toUpperCase();
    if (!exchange || !symbol) {
      setMessage("请选择交易所并填写 Symbol");
      return;
    }
    const assetType = exchange.assetTypes.includes("stock")
      ? "stock"
      : exchange.assetTypes[0];
    const currency: TickerCurrency = exchange.market === "CN" ? "CNY" : exchange.market === "US" ? "USD" : exchange.market === "HK" ? "HKD" : exchange.code === "HYPERLIQUID" ? "USDC" : "USDT";
    const tradingSymbol = exchange.market === "HK" ? symbol.replace(/^0+/, "") || "0" : symbol;
    setMessage("");
    setForm({ ...EMPTY_FORM, market: exchange.market, assetType, exchangeCode: exchange.code, symbol, currency, tradingViewSymbol: exchange.tradingViewPrefix ? `${exchange.tradingViewPrefix}:${tradingSymbol}` : "", source: { provider: exchange.code.toLowerCase(), symbol } });
    setEditingId(null);
    setIsQuickAddOpen(false);
    setIsEditorOpen(true);
  }

  function startEdit(ticker: ManagedTicker) {
    setForm(toForm(ticker));
    setEditingId(ticker.id);
    setMessage("");
    setIsEditorOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(editingId ? `/api/tickers/manage/${editingId}` : "/api/tickers/manage", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestPayload(form)) });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "Ticker 保存失败");
      closeEditor();
      await loadTickers(query.trim());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ticker 保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function removeTicker(ticker: ManagedTicker) {
    if (!window.confirm(`确定删除 ${ticker.exchangeCode}:${ticker.symbol} 吗？`)) return;
    setMessage("");
    try {
      const response = await fetch(`/api/tickers/manage/${ticker.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message || "Ticker 删除失败");
      }
      if (editingId === ticker.id) closeEditor();
      await loadTickers(query.trim());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ticker 删除失败");
    }
  }

  return (
    <div id="ticker-manager" className="min-h-0">
      <section id="ticker-list" className="min-w-0 rounded-lg border bg-card shadow-sm">
        <div id="ticker-list-toolbar" className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div id="ticker-list-heading"><h2 className="text-base font-semibold">Ticker 列表</h2><p className="mt-1 text-xs text-muted-foreground">每个字段独立展示；首次打开会自动写入 BTC、ETH 和 HYPE。</p></div>
          <div id="ticker-list-actions" className="flex items-center gap-2"><div id="ticker-search" className="relative w-64 max-w-[50vw]"><Search className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" /><Input id="ticker-search-input" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-8" placeholder="搜索代码、名称、交易所" /></div><Button id="ticker-quick-add-button" type="button" variant="outline" onClick={openQuickAdd}><Plus />按 Symbol 新建</Button><Button id="ticker-create-button" type="button" onClick={openCreateEditor}><Plus />新增 Ticker</Button></div>
        </div>
        {message && !isEditorOpen && <p id="ticker-list-message" className="mx-4 mt-4 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{message}</p>}
        <div id="ticker-table-container" className="overflow-x-auto">
          <table id="ticker-table" className="w-full min-w-[1680px] whitespace-nowrap text-left text-sm">
            <thead id="ticker-table-header" className="border-b bg-muted/40 text-xs text-muted-foreground"><tr id="ticker-table-header-row"><th id="ticker-column-market" className="px-4 py-3 font-medium">市场</th><th id="ticker-column-asset-type" className="px-4 py-3 font-medium">类型</th><th id="ticker-column-exchange" className="px-4 py-3 font-medium">交易所</th><th id="ticker-column-symbol" className="px-4 py-3 font-medium">Symbol</th><th id="ticker-column-name" className="px-4 py-3 font-medium">中文名</th><th id="ticker-column-name-en" className="px-4 py-3 font-medium">英文名</th><th id="ticker-column-description" className="px-4 py-3 font-medium">简介</th><th id="ticker-column-currency" className="px-4 py-3 font-medium">计价货币</th><th id="ticker-column-status" className="px-4 py-3 font-medium">状态</th><th id="ticker-column-trading-view" className="px-4 py-3 font-medium">TradingView</th><th id="ticker-column-source-provider" className="px-4 py-3 font-medium">数据源</th><th id="ticker-column-source-symbol" className="px-4 py-3 font-medium">数据源代码</th><th id="ticker-column-actions" className="sticky right-0 bg-muted/40 px-4 py-3 font-medium">操作</th></tr></thead>
            <tbody id="ticker-table-body">
              {loading ? <tr id="ticker-loading-row"><td className="px-4 py-12 text-center text-muted-foreground" colSpan={13}><LoaderCircle className="mr-2 inline size-4 animate-spin" />正在读取 Ticker…</td></tr> : tickers.length === 0 ? <tr id="ticker-empty-row"><td className="px-4 py-12 text-center text-muted-foreground" colSpan={13}>没有匹配的 Ticker。</td></tr> : tickers.map((ticker) => <tr id={`ticker-row-${ticker.id}`} key={ticker.id} className="border-b last:border-0 hover:bg-muted/30"><td className="px-4 py-3">{marketLabels[ticker.market]}</td><td className="px-4 py-3">{typeLabels[ticker.assetType]}</td><td className="px-4 py-3 font-mono text-xs">{ticker.exchangeCode}</td><td className="px-4 py-3 font-mono text-xs font-medium">{ticker.symbol}</td><td className="px-4 py-3 font-medium">{ticker.name}</td><td className="px-4 py-3 text-muted-foreground">{ticker.nameEn || "—"}</td><td className="max-w-80 overflow-hidden text-ellipsis px-4 py-3 text-xs text-muted-foreground" title={ticker.description}>{ticker.description}</td><td className="px-4 py-3 font-mono text-xs">{ticker.currency}</td><td className="px-4 py-3"><span className={ticker.status === "active" ? "text-emerald-600" : "text-muted-foreground"}>{ticker.status === "active" ? "启用" : "停用"}</span></td><td className="px-4 py-3 font-mono text-xs text-muted-foreground">{ticker.tradingViewSymbol || "—"}</td><td className="px-4 py-3 font-mono text-xs text-muted-foreground">{ticker.source?.provider || "—"}</td><td className="px-4 py-3 font-mono text-xs text-muted-foreground">{ticker.source?.symbol || "—"}</td><td className="sticky right-0 bg-card px-4 py-3"><div className="flex justify-end gap-1"><Button id={`ticker-edit-${ticker.id}`} type="button" variant="ghost" size="icon-sm" onClick={() => startEdit(ticker)} aria-label={`编辑 ${ticker.symbol}`}><Pencil /></Button><Button id={`ticker-delete-${ticker.id}`} type="button" variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => void removeTicker(ticker)} aria-label={`删除 ${ticker.symbol}`}><Trash2 /></Button></div></td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      {isEditorOpen && <div id="ticker-editor-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}><section id="ticker-editor-dialog" role="dialog" aria-modal="true" aria-labelledby="ticker-editor-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border bg-card shadow-2xl"><div id="ticker-editor-heading" className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b bg-card p-5"><div><h2 id="ticker-editor-title" className="text-lg font-semibold">{editingId ? "编辑 Ticker" : "新增 Ticker"}</h2><p className="mt-1 text-xs text-muted-foreground">交易所代码与 Symbol 的组合必须唯一。</p></div><Button id="ticker-close-editor" type="button" variant="ghost" size="icon-sm" onClick={closeEditor} aria-label="关闭编辑弹窗"><X /></Button></div><form id="ticker-form" className="space-y-4 p-5" onSubmit={submit}><div id="ticker-market-fields" className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-xs font-medium" htmlFor="ticker-market">市场<select id="ticker-market" className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={form.market} onChange={(event) => updateField("market", event.target.value as TickerMarket)}>{Object.entries(marketLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="grid gap-1.5 text-xs font-medium" htmlFor="ticker-type">类型<select id="ticker-type" className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={form.assetType} onChange={(event) => updateField("assetType", event.target.value as TickerAssetType)}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><div id="ticker-identity-fields" className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-xs font-medium" htmlFor="ticker-exchange-code">交易所代码<Input id="ticker-exchange-code" required value={form.exchangeCode} onChange={(event) => updateField("exchangeCode", event.target.value)} placeholder="BINANCE" /></label><label className="grid gap-1.5 text-xs font-medium" htmlFor="ticker-symbol">Symbol<Input id="ticker-symbol" required value={form.symbol} onChange={(event) => updateField("symbol", event.target.value)} placeholder="BTC" /></label></div><div id="ticker-name-fields" className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-xs font-medium" htmlFor="ticker-name">中文名<Input id="ticker-name" required value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="比特币" /></label><label className="grid gap-1.5 text-xs font-medium" htmlFor="ticker-name-en">英文名<Input id="ticker-name-en" value={form.nameEn} onChange={(event) => updateField("nameEn", event.target.value)} placeholder="Bitcoin" /></label></div><label className="grid gap-1.5 text-xs font-medium" htmlFor="ticker-description">简介<Textarea id="ticker-description" required rows={3} value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="该资产的简要说明" /></label><div id="ticker-quote-fields" className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-xs font-medium" htmlFor="ticker-currency">计价货币<select id="ticker-currency" className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={form.currency} onChange={(event) => updateField("currency", event.target.value as TickerCurrency)}>{["CNY", "USD", "HKD", "USDT", "USDC"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="grid gap-1.5 text-xs font-medium" htmlFor="ticker-status">状态<select id="ticker-status" className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={form.status} onChange={(event) => updateField("status", event.target.value as TickerStatus)}><option value="active">启用</option><option value="inactive">停用</option></select></label></div><label className="grid gap-1.5 text-xs font-medium" htmlFor="ticker-trading-view">TradingView Symbol<Input id="ticker-trading-view" value={form.tradingViewSymbol} onChange={(event) => updateField("tradingViewSymbol", event.target.value)} placeholder="BINANCE:BTCUSDT" /></label><div id="ticker-source-fields" className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-xs font-medium" htmlFor="ticker-source-provider">数据源<Input id="ticker-source-provider" value={form.source?.provider ?? ""} onChange={(event) => updateField("source", { provider: event.target.value, symbol: form.source?.symbol ?? "" })} placeholder="binance" /></label><label className="grid gap-1.5 text-xs font-medium" htmlFor="ticker-source-symbol">数据源代码<Input id="ticker-source-symbol" value={form.source?.symbol ?? ""} onChange={(event) => updateField("source", { provider: form.source?.provider ?? "", symbol: event.target.value })} placeholder="BTCUSDT" /></label></div>{message && <p id="ticker-form-message" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{message}</p>}<div id="ticker-form-actions" className="flex justify-end gap-2 border-t pt-4"><Button id="ticker-cancel-editor" type="button" variant="outline" onClick={closeEditor}>取消</Button><Button id="ticker-submit" type="submit" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" /> : <Plus />}{editingId ? "保存修改" : "新增 Ticker"}</Button></div></form></section></div>}
      {isQuickAddOpen && <div id="ticker-quick-add-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsQuickAddOpen(false); }}><section id="ticker-quick-add-dialog" role="dialog" aria-modal="true" aria-labelledby="ticker-quick-add-title" className="w-full max-w-md rounded-xl border bg-card shadow-2xl"><div id="ticker-quick-add-heading" className="flex items-start justify-between border-b p-5"><div><h2 id="ticker-quick-add-title" className="text-lg font-semibold">按 Symbol 新建产品</h2><p className="mt-1 text-xs text-muted-foreground">选择交易所并输入代码后，自动预填标准字段。</p></div><Button id="ticker-quick-add-close" type="button" variant="ghost" size="icon-sm" onClick={() => setIsQuickAddOpen(false)} aria-label="关闭快捷新增"><X /></Button></div><form id="ticker-quick-add-form" className="space-y-4 p-5" onSubmit={continueQuickAdd}><label className="grid gap-1.5 text-xs font-medium" htmlFor="ticker-quick-exchange">交易所<select id="ticker-quick-exchange" required className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={quickExchangeCode} onChange={(event) => setQuickExchangeCode(event.target.value)}><option value="" disabled>选择交易所</option>{exchanges.map((exchange) => <option key={exchange.code} value={exchange.code}>{exchange.code} · {exchange.name}</option>)}</select></label><label className="grid gap-1.5 text-xs font-medium" htmlFor="ticker-quick-symbol">Symbol<Input id="ticker-quick-symbol" required value={quickSymbol} onChange={(event) => setQuickSymbol(event.target.value)} placeholder="例如 00700、AAPL 或 BTC" /></label>{message && <p id="ticker-quick-add-message" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{message}</p>}<div id="ticker-quick-add-actions" className="flex justify-end gap-2"><Button id="ticker-quick-add-cancel" type="button" variant="outline" onClick={() => setIsQuickAddOpen(false)}>取消</Button><Button id="ticker-quick-add-next" type="submit">下一步</Button></div></form></section></div>}
    </div>
  );
}

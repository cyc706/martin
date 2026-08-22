"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Market = "CN" | "US" | "HK" | "CRYPTO";
type AssetType = "index" | "stock" | "crypto";
type Status = "active" | "inactive";
type Exchange = { id: string; code: string; name: string; nameEn?: string; market: Market; countryOrRegion: string; assetTypes: AssetType[]; tradingViewPrefix?: string; website?: string; description: string; status: Status };
type ExchangeForm = Omit<Exchange, "id">;

const EMPTY_FORM: ExchangeForm = { code: "", name: "", nameEn: "", market: "CRYPTO", countryOrRegion: "GLOBAL", assetTypes: ["crypto"], tradingViewPrefix: "", website: "", description: "", status: "active" };
const marketLabels: Record<Market, string> = { CN: "中国大陆", US: "美国", HK: "香港", CRYPTO: "Crypto" };
const assetLabels: Record<AssetType, string> = { index: "指数", stock: "股票", crypto: "Crypto" };

function toForm(exchange: Exchange): ExchangeForm { return { ...exchange, nameEn: exchange.nameEn ?? "", tradingViewPrefix: exchange.tradingViewPrefix ?? "", website: exchange.website ?? "" }; }

export function ExchangeManager() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [form, setForm] = useState<ExchangeForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async (search = "") => {
    setLoading(true);
    try {
      const response = await fetch(`/api/exchanges/manage${search ? `?q=${encodeURIComponent(search)}` : ""}`);
      const payload = (await response.json()) as { items?: Exchange[]; message?: string };
      if (!response.ok) throw new Error(payload.message || "交易所读取失败");
      setExchanges(payload.items ?? []);
    } catch (error) { setMessage(error instanceof Error ? error.message : "交易所读取失败"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(query.trim()), 200); return () => window.clearTimeout(timer); }, [load, query]);

  function close() { setForm(EMPTY_FORM); setEditingId(null); setOpen(false); setMessage(""); }
  function edit(exchange: Exchange) { setForm(toForm(exchange)); setEditingId(exchange.id); setMessage(""); setOpen(true); }
  function toggleAssetType(assetType: AssetType) { setForm((current) => ({ ...current, assetTypes: current.assetTypes.includes(assetType) ? current.assetTypes.filter((item) => item !== assetType) : [...current.assetTypes, assetType] })); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const response = await fetch(editingId ? `/api/exchanges/manage/${editingId}` : "/api/exchanges/manage", { method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, nameEn: form.nameEn || undefined, tradingViewPrefix: form.tradingViewPrefix || undefined, website: form.website || undefined }) });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "交易所保存失败");
      close(); await load(query.trim());
    } catch (error) { setMessage(error instanceof Error ? error.message : "交易所保存失败"); } finally { setSaving(false); }
  }

  async function remove(exchange: Exchange) {
    if (!window.confirm(`确定删除交易所 ${exchange.code} 吗？`)) return;
    try {
      const response = await fetch(`/api/exchanges/manage/${exchange.id}`, { method: "DELETE" });
      if (!response.ok) { const payload = (await response.json()) as { message?: string }; throw new Error(payload.message || "交易所删除失败"); }
      await load(query.trim());
    } catch (error) { setMessage(error instanceof Error ? error.message : "交易所删除失败"); }
  }

  return <div id="exchange-manager" className="min-h-0"><section id="exchange-list" className="rounded-lg border bg-card shadow-sm"><div id="exchange-list-toolbar" className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div id="exchange-list-heading"><h2 className="text-base font-semibold">交易所列表</h2><p className="mt-1 text-xs text-muted-foreground">Ticker 通过交易所代码关联到此集合。</p></div><div id="exchange-list-actions" className="flex items-center gap-2"><div id="exchange-search" className="relative w-64 max-w-[50vw]"><Search className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" /><Input id="exchange-search-input" className="pl-8" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索代码、名称、地区" /></div><Button id="exchange-create-button" type="button" onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setMessage(""); setOpen(true); }}><Plus />新增交易所</Button></div></div>{message && !open && <p id="exchange-list-message" className="mx-4 mt-4 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{message}</p>}<div id="exchange-table-container" className="overflow-x-auto"><table id="exchange-table" className="w-full min-w-[1450px] whitespace-nowrap text-left text-sm"><thead id="exchange-table-header" className="border-b bg-muted/40 text-xs text-muted-foreground"><tr id="exchange-table-header-row"><th className="px-4 py-3 font-medium">代码</th><th className="px-4 py-3 font-medium">中文名</th><th className="px-4 py-3 font-medium">英文名</th><th className="px-4 py-3 font-medium">市场</th><th className="px-4 py-3 font-medium">地区</th><th className="px-4 py-3 font-medium">资产类型</th><th className="px-4 py-3 font-medium">TradingView 前缀</th><th className="px-4 py-3 font-medium">网站</th><th className="px-4 py-3 font-medium">简介</th><th className="px-4 py-3 font-medium">状态</th><th className="sticky right-0 bg-muted/40 px-4 py-3 font-medium">操作</th></tr></thead><tbody id="exchange-table-body">{loading ? <tr id="exchange-loading-row"><td colSpan={11} className="px-4 py-12 text-center text-muted-foreground"><LoaderCircle className="mr-2 inline size-4 animate-spin" />正在读取交易所…</td></tr> : exchanges.length === 0 ? <tr id="exchange-empty-row"><td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">没有匹配的交易所。</td></tr> : exchanges.map((exchange) => <tr id={`exchange-row-${exchange.id}`} key={exchange.id} className="border-b last:border-0 hover:bg-muted/30"><td className="px-4 py-3 font-mono text-xs font-medium">{exchange.code}</td><td className="px-4 py-3 font-medium">{exchange.name}</td><td className="px-4 py-3 text-muted-foreground">{exchange.nameEn || "—"}</td><td className="px-4 py-3">{marketLabels[exchange.market]}</td><td className="px-4 py-3 font-mono text-xs">{exchange.countryOrRegion}</td><td className="px-4 py-3">{exchange.assetTypes.map((item) => assetLabels[item]).join("、")}</td><td className="px-4 py-3 font-mono text-xs text-muted-foreground">{exchange.tradingViewPrefix || "—"}</td><td className="max-w-48 overflow-hidden text-ellipsis px-4 py-3 text-xs text-muted-foreground" title={exchange.website}>{exchange.website || "—"}</td><td className="max-w-80 overflow-hidden text-ellipsis px-4 py-3 text-xs text-muted-foreground" title={exchange.description}>{exchange.description}</td><td className="px-4 py-3"><span className={exchange.status === "active" ? "text-emerald-600" : "text-muted-foreground"}>{exchange.status === "active" ? "启用" : "停用"}</span></td><td className="sticky right-0 bg-card px-4 py-3"><div className="flex justify-end gap-1"><Button id={`exchange-edit-${exchange.id}`} type="button" variant="ghost" size="icon-sm" onClick={() => edit(exchange)} aria-label={`编辑 ${exchange.code}`}><Pencil /></Button><Button id={`exchange-delete-${exchange.id}`} type="button" variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => void remove(exchange)} aria-label={`删除 ${exchange.code}`}><Trash2 /></Button></div></td></tr>)}</tbody></table></div></section>{open && <div id="exchange-editor-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section id="exchange-editor-dialog" role="dialog" aria-modal="true" aria-labelledby="exchange-editor-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border bg-card shadow-2xl"><div id="exchange-editor-heading" className="sticky top-0 z-10 flex justify-between border-b bg-card p-5"><div><h2 id="exchange-editor-title" className="text-lg font-semibold">{editingId ? "编辑交易所" : "新增交易所"}</h2><p className="mt-1 text-xs text-muted-foreground">交易所代码是 Ticker 的稳定关联键。</p></div><Button id="exchange-close-editor" type="button" variant="ghost" size="icon-sm" onClick={close} aria-label="关闭编辑弹窗"><X /></Button></div><form id="exchange-form" className="space-y-4 p-5" onSubmit={submit}><div id="exchange-identity-fields" className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-xs font-medium" htmlFor="exchange-code">交易所代码<Input id="exchange-code" required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="BINANCE" /></label><label className="grid gap-1.5 text-xs font-medium" htmlFor="exchange-market">市场<select id="exchange-market" className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={form.market} onChange={(event) => setForm({ ...form, market: event.target.value as Market })}>{Object.entries(marketLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><div id="exchange-name-fields" className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-xs font-medium" htmlFor="exchange-name">中文名<Input id="exchange-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="grid gap-1.5 text-xs font-medium" htmlFor="exchange-name-en">英文名<Input id="exchange-name-en" value={form.nameEn} onChange={(event) => setForm({ ...form, nameEn: event.target.value })} /></label></div><div id="exchange-region-fields" className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-xs font-medium" htmlFor="exchange-region">所属地区<Input id="exchange-region" required value={form.countryOrRegion} onChange={(event) => setForm({ ...form, countryOrRegion: event.target.value })} placeholder="GLOBAL" /></label><label className="grid gap-1.5 text-xs font-medium" htmlFor="exchange-status">状态<select id="exchange-status" className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Status })}><option value="active">启用</option><option value="inactive">停用</option></select></label></div><fieldset id="exchange-asset-types" className="rounded-lg border p-3"><legend className="px-1 text-xs font-medium">支持的资产类型</legend><div className="mt-1 flex gap-4">{(Object.keys(assetLabels) as AssetType[]).map((type) => <label key={type} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.assetTypes.includes(type)} onChange={() => toggleAssetType(type)} />{assetLabels[type]}</label>)}</div></fieldset><div id="exchange-provider-fields" className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-xs font-medium" htmlFor="exchange-tradingview">TradingView 前缀<Input id="exchange-tradingview" value={form.tradingViewPrefix} onChange={(event) => setForm({ ...form, tradingViewPrefix: event.target.value })} placeholder="BINANCE" /></label><label className="grid gap-1.5 text-xs font-medium" htmlFor="exchange-website">网站<Input id="exchange-website" type="url" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} placeholder="https://" /></label></div><label className="grid gap-1.5 text-xs font-medium" htmlFor="exchange-description">简介<Textarea id="exchange-description" required rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>{message && <p id="exchange-form-message" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{message}</p>}<div id="exchange-form-actions" className="flex justify-end gap-2 border-t pt-4"><Button id="exchange-cancel-editor" type="button" variant="outline" onClick={close}>取消</Button><Button id="exchange-submit" type="submit" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" /> : <Plus />}{editingId ? "保存修改" : "新增交易所"}</Button></div></form></section></div>}</div>;
}

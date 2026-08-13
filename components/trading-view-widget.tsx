"use client";

type TradingViewWidgetProps = {
  symbol: string;
};

export function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  const chartUrl = new URL("https://www.tradingview.com/widgetembed/");
  chartUrl.searchParams.set("frameElementId", "tradingview-chart");
  chartUrl.searchParams.set("symbol", symbol);
  chartUrl.searchParams.set("interval", "D");
  chartUrl.searchParams.set("theme", "light");
  chartUrl.searchParams.set("style", "1");
  chartUrl.searchParams.set("locale", "zh_CN");
  chartUrl.searchParams.set("toolbarbg", "f1f3f6");
  chartUrl.searchParams.set("hide_side_toolbar", "1");
  chartUrl.searchParams.set("allow_symbol_change", "0");
  chartUrl.searchParams.set("withdateranges", "1");
  chartUrl.searchParams.set("hideideas", "1");
  chartUrl.searchParams.set("saveimage", "0");

  return (
    <iframe
      id="tradingview-chart"
      title={`TradingView ${symbol} 走势图`}
      src={chartUrl.toString()}
      className="block h-full min-h-[420px] w-full border-0"
      loading="eager"
      allowFullScreen
    />
  );
}

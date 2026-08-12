import { MarketWorkspace } from "@/components/market-workspace";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-16">
      <div className="w-full max-w-4xl">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Martin
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            金融行情查看系统
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            集中查看市场行情与资产表现，快速掌握重要金融数据。
          </p>
        </div>

        <MarketWorkspace />
      </div>
    </main>
  );
}

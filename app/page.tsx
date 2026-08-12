import { ArrowUpRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

        <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>市场概览</CardTitle>
              <CardDescription>
                一站式了解你关注的金融市场。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                {["统一查看多类金融资产", "清晰直观的行情展示", "为后续分析提供数据基础"].map(
                  (item) => (
                    <div key={item} className="flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="size-3.5" />
                      </span>
                      {item}
                    </div>
                  ),
                )}
              </div>
            </CardContent>
            <CardFooter className="gap-3">
              <Button>
                查看行情
                <ArrowUpRight />
              </Button>
              <Button variant="outline">进入系统</Button>
            </CardFooter>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>快速开始</CardTitle>
              <CardDescription>选择市场与关注的标的。</CardDescription>
            </CardHeader>
            <CardContent>
              <code className="block rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                选择市场 / 输入标的 / 查看详情
              </code>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="ml-auto">
                开始查看
                <ArrowUpRight />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}

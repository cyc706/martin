<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 页面布局约定

- 页面使用全屏布局，顶部区域称为“导航栏”，固定高度为 56px。
- 导航栏下方为 body 区域，body 使用 4px 的外边距和区域间距。
- body 左侧称为“资产详情区”，宽度随屏幕剩余空间自适应；右侧称为“收藏区”，桌面端固定宽度 300px。
- 资产详情区顶部保留固定高度 56px 的 Info 区，用于展示当前资产的概览信息；其下方使用 TradingView 图表并撑满剩余区域。
- 窄屏下资产详情区与收藏区可以改为上下排列，但桌面端的左右关系和收藏区 300px 固定宽度需要保持。
- 每一个页面组件都必须增加唯一且语义化的 `id` 名称，便于定位、调试和自动化测试。

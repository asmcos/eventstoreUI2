# 辰龙文档中心 (eventStoreUI2)

基于 **Next.js 16 App Router** 的 SEO 友好版技术文档社区，支持电子书、博客、论坛三大公开展示模块，以及创作/管理后台。

## 技术栈

- Next.js 16 (App Router, SSR)
- React 19 + TypeScript
- Tailwind CSS 4
- EventStore WebSocket (`eventstore-tools`)
- react-markdown (服务端 Markdown 渲染)

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local

# 启动开发服务器（需 EventStore 运行在 ws://127.0.0.1:8080）
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
src/
├── app/
│   ├── (public)/          # SEO 公开展示页（SSR）
│   │   ├── page.tsx       # 首页
│   │   ├── books/         # 电子书
│   │   ├── blogs/         # 博客
│   │   └── topics/        # 论坛
│   ├── (app)/             # 创作/管理（noindex）
│   │   ├── creator/       # 创作中心
│   │   ├── editbook/      # 书籍编辑（迁移中）
│   │   ├── editblog/      # 博客编辑（迁移中）
│   │   ├── edittopic/     # 话题发布（迁移中）
│   │   └── admin/         # 管理后台（迁移中）
│   ├── robots.ts          # robots.txt
│   └── sitemap.ts         # 动态 sitemap
├── components/
├── lib/
│   ├── esclient/          # EventStore SDK
│   ├── seo.ts             # SEO metadata 工具
│   └── config.ts
```

## SEO 特性

- 每页独立 `metadata` / `generateMetadata`
- 动态 `sitemap.xml`（书籍/博客/话题）
- `robots.txt`（屏蔽 admin/编辑页）
- JSON-LD 结构化数据（WebSite、Book、BlogPosting、DiscussionForumPosting）
- 语义化 `<a href>` 链接，服务端渲染完整 HTML

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `EVENTSTORE_WS_URL` | EventStore WebSocket | `ws://127.0.0.1:8080/` |
| `UPLOAD_BASE_URL` | 文件上传 CDN | `http://127.0.0.1:8081/uploads/` |
| `NEXT_PUBLIC_SITE_URL` | 站点域名（SEO） | `https://docs.chenlongos.cn` |

## 迁移进度

- [x] 项目骨架 + SEO 基础设施
- [x] 首页（书籍/博客推荐）
- [x] 书籍/博客/话题列表与详情（博客/话题 Markdown SSR）
- [x] 短 ID 路由支持（`{user8}-{id8}`）
- [ ] 电子书章节阅读器（目录树 + VitePress 渲染）
- [ ] 论坛回帖
- [ ] 登录 / 私钥认证
- [ ] 编辑器（书籍/博客/话题）
- [ ] 管理后台

# Xiangliang Remove

AI background removal SaaS website built with Next.js, Supabase, OpenRouter, and PayPal.

## English

### Overview
- Remove image backgrounds with AI (`google/gemini-2.5-flash-image` via OpenRouter).
- Tiered product model: `free`, `pro`, `business`.
- Google sign-in via Supabase Auth.
- PayPal subscription flow + webhook-based subscription sync.

### Key Features
- Background removal API: `app/api/remove-background/route.ts`
- Monthly quota and basic anti-abuse protection for guest/free users.
- Tier-based output quality:
  - Free: web-ready export
  - Pro: HD export
  - Business: original resolution export
- Pricing page with Monthly/Annual toggle and PayPal Checkout buttons.

### Tech Stack
- Next.js 16 (App Router)
- React 19
- Supabase (Auth + Postgres)
- OpenRouter (image model API)
- PayPal Checkout + webhook sync

### Local Development
1. Install dependencies:
   - `npm install`
2. Start dev server:
   - `npm run dev`
3. Build for production check:
   - `npm run build`

### Environment Variables
Create `.env.local` and configure at least:

- Core
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_SITE_URL` (recommended, e.g. `https://your-domain`)
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENROUTER_API_KEY`

- PayPal checkout (frontend)
  - `NEXT_PUBLIC_PAYPAL_CLIENT_ID`

- PayPal webhook (server)
  - `PAYPAL_CLIENT_ID`
  - `PAYPAL_CLIENT_SECRET`
  - `PAYPAL_WEBHOOK_ID`
  - `PAYPAL_API_BASE` (`https://api-m.sandbox.paypal.com` or `https://api-m.paypal.com`)
  - `PAYPAL_PLAN_ID_PRO_MONTHLY`
  - `PAYPAL_PLAN_ID_PRO_ANNUAL`
  - `PAYPAL_PLAN_ID_BUSINESS_MONTHLY`
  - `PAYPAL_PLAN_ID_BUSINESS_ANNUAL`
  - `PRO_MONTHLY_CREDITS` (optional, default `200`)
  - `BUSINESS_MONTHLY_CREDITS` (optional, default `1000`)

### Database Setup (Supabase)
Run SQL migrations:
- `supabase/migrations/20260206_002_subscriptions.sql`
- `supabase/migrations/20260206_003_deduct_credits.sql`

Optional seed script:
- `supabase/sql/seed_test_subscriptions.sql`

### Webhook Endpoint
- Route: `/api/paypal/webhook`
- Configure this URL in PayPal Developer Dashboard:
  - `https://your-domain/api/paypal/webhook`

### PayPal Checkout Endpoints
- Create order: `/api/paypal/create-order`
- Capture order: `/api/paypal/capture-order`

### Deploy (Vercel)
1. Import repository in Vercel.
2. Configure environment variables.
3. Deploy.
4. Bind custom domain.
5. Update Supabase auth callback URL and PayPal webhook URL to production domain.

---

## 中文

### 项目简介
- 这是一个基于 Next.js 的 AI 去背景 SaaS 工具站。
- 去背景模型通过 OpenRouter 调用 `google/gemini-2.5-flash-image`。
- 套餐分层为：`free`、`pro`、`business`。
- 登录使用 Supabase（Google OAuth），支付使用 PayPal。

### 主要功能
- 去背景接口：`app/api/remove-background/route.ts`
- 游客/免费用户有额度与基础风控限制。
- 按套餐输出不同质量：
  - Free：网页级导出
  - Pro：高清导出
  - Business：原始分辨率导出
- Pricing 页面支持月付/年付切换，并集成 PayPal Checkout 支付按钮。

### 本地启动
1. 安装依赖：`npm install`
2. 启动开发：`npm run dev`
3. 构建检查：`npm run build`

### 环境变量
请在 `.env.local`（本地）和部署平台（生产）中配置：

- 核心变量
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_SITE_URL`（建议配置，例如 `https://你的域名`）
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENROUTER_API_KEY`

- PayPal 前端结账变量
  - `NEXT_PUBLIC_PAYPAL_CLIENT_ID`

- PayPal Webhook 服务端变量
  - `PAYPAL_CLIENT_ID`
  - `PAYPAL_CLIENT_SECRET`
  - `PAYPAL_WEBHOOK_ID`
  - `PAYPAL_API_BASE`（沙盒或正式）
  - `PAYPAL_PLAN_ID_PRO_MONTHLY`
  - `PAYPAL_PLAN_ID_PRO_ANNUAL`
  - `PAYPAL_PLAN_ID_BUSINESS_MONTHLY`
  - `PAYPAL_PLAN_ID_BUSINESS_ANNUAL`
  - `PRO_MONTHLY_CREDITS`（可选，默认 200）
  - `BUSINESS_MONTHLY_CREDITS`（可选，默认 1000）

### Supabase 数据库初始化
按顺序执行：
- `supabase/migrations/20260206_002_subscriptions.sql`
- `supabase/migrations/20260206_003_deduct_credits.sql`

测试数据脚本（可选）：
- `supabase/sql/seed_test_subscriptions.sql`

### PayPal Webhook 配置
- 项目 webhook 路由：`/api/paypal/webhook`
- 在 PayPal Developer 后台配置监听地址：
  - `https://你的域名/api/paypal/webhook`

### PayPal Checkout 接口
- 创建订单：`/api/paypal/create-order`
- 捕获订单：`/api/paypal/capture-order`

### 部署建议（Vercel）
1. 导入仓库并部署。
2. 配置所有环境变量。
3. 绑定域名并开启 HTTPS。
4. 将 Supabase 回调地址、PayPal webhook 地址切换为正式域名。

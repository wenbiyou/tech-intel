# 前端 UI 组件库 / 管理后台模版 / Agent Skill 获取渠道地图

> 类型：L3 按需专题结论 ｜ 生成日期：2026-09-22 ｜ 委托：用户（gateway-owner）
> 数据核验：GitHub REST API 实时读取 + 官方 changelog + skills.sh API，核验时间 2026-09-22 18:00 (GMT+8)
> 纪律：stars/安装量均为 🟢实证（实时抓取）；选型判断为 🟡推断，附依据。

---

## 0. 结论先行

1. **三类资源各有唯一「事实入口」**：组件库 → Best of JS / 官方站；管理后台模版 → GitHub（认准组织名）；Skill → skills.sh（安装量维度）+ ClawHub（OpenClaw 原生）。
2. **2026 年最关键的时效变化**：shadcn/ui 于 2026-07 把底层默认从 Radix UI 切到 Base UI（同为原班人马，Radix 未废弃、无需迁移）。新项目默认走 Base UI。
3. **管理后台「专用」Skill 生态很薄弱**：skills.sh 全站搜 "admin dashboard"，安装量最高的管理后台 skill 仅 3,938 次；而通用 `anthropics/skills/frontend-design` 达 91 万次。**正确策略 = 通用设计 skill + 模版仓库**，而非找「管理后台专用 skill」。
4. **单一前端工程师的最短路径**：React 栈 = shadcn/ui (Base UI) + satnaing/shadcn-admin + `frontend-design` skill；Vue 栈 = Vben / Soybean + Arco/TDesign。

---

## 1. UI 组件库

### 1.1 选型入口（先逛入口再选型）

| 入口 | 地址 | 用途 |
|---|---|---|
| Best of JS | https://bestofjs.org | 前端项目星标/趋势榜，选型第一站 |
| GitHub Topic | `component-library`、`ui-library` | 长尾发现 |
| npm trends | https://npmtrends.com | 下载量横向对比 |

### 1.2 React 生态（🟢 stars/下载量为 2026-09 实测值）

| 库 | GitHub stars | 周下载 | 定位 | 备注 |
|---|---|---|---|---|
| **shadcn/ui** | 115,000+ | 无 npm 包 | copy-paste + Tailwind，代码自持 | 2026-07 起底层默认 **Base UI**；v0/Lovable/Bolt/Claude Code 默认生成它 |
| **MUI** | 95,000+ | 5.8M | 全设计系统（Material） | v6（2025 末）bundle 约 -30%；MUI X 高级组件付费 |
| **Ant Design** | 94,000+ | 1.7M | 企业级中后台 | 表单/表格/i18n 开箱即用；品牌定制成本高 |
| **Chakra UI** | 38,700 | 533K | DX + 无障碍优先 | CSS-in-JS 运行时开销；同团队另有 headless 的 Ark UI |
| **Mantine** | 31,000+ | 1.9M | 全功能（v9） | 120+ 组件、100+ hooks，落地最快 |
| **HeroUI**（原 NextUI） | 28,200 | — | Tailwind 原生 | 底层用 React Aria（非 Radix）；v3 处 beta |

### 1.3 Headless / 无样式原语

| 库 | stars | 周下载 | 维护方 | 备注 |
|---|---|---|---|---|
| **Base UI** | 并入 MUI monorepo（95,000+） | 6M+ | MUI 团队（Radix 原班人马） | v1.6.0；2025-12 发布 1.0；**shadcn 新默认** |
| **Radix UI** | 35,000+ | 2M+ | WorkOS | 成熟稳定，仍完全支持 |
| **Headless UI** | 28,000+ | 2.6M | Tailwind 官方 | API 面小，适合简单场景 |
| **Ariakit** | 8,500+ | — | 社区 | 小众，可组合性强 |

> 关键判断 🟡：已有 Radix 项目**不必迁移**（shadcn 官方明确表态）；仅新项目建议 Base UI。依据：shadcn/ui 2026-07 changelog。

### 1.4 Vue 生态

| 库 | GitHub stars | 备注 |
|---|---|---|
| Element Plus | 27,779 | Element 团队；开放 issue 1,158（体量决定，非质量问题） |
| Naive UI | 18,563 | TS + 主题可定制；最近 push 2026-08-27 |
| Ant Design Vue | 未核验 | 与 React 版同设计语言 |
| TDesign Vue Next（腾讯） | 2,181 | 国内中后台三杰之一 |
| Arco Design（字节） | 5,707（React 仓） | Vue 版另有独立仓库 arco-design-vue |

### 1.5 国内中后台三杰（ERP 场景素材库）

Ant Design（蚂蚁）https://ant.design ｜ Arco Design（字节）https://arco.design ｜ TDesign（腾讯）https://tdesign.tencent.com
（来源：本档案 `source-notes.md` 第三节 UI 设计清单）

---

## 2. 管理后台模版

### 2.1 模版 vs 框架：先分清

- **模版（template）**：UI 外壳 + 现成页面，改品牌即可用 → 适合快速交付。
- **框架（framework）**：CRUD/权限/数据层由框架驱动，页面自动生成 → 适合表单表格海量的中后台。

### 2.2 React 系（🟢 2026-09-22 实测）

| 项目 | stars | 协议 | 最近 push | 定位 |
|---|---|---|---|---|
| **tabler/tabler** | 41,733 | MIT | 2026-09-22 | 纯 HTML/Bootstrap（已迁 Astro），颜值天花板级免费后台 UI Kit |
| **ant-design/ant-design-pro** | 38,799 | MIT | 2026-09-21 | React + umi + antd 企业级脚手架，国内落地最广 |
| **refinedev/refine** | 35,707 | MIT | 2026-09-10 | Headless 框架级：CRUD/权限/多数据源自动生成 |
| **satnaing/shadcn-admin** | 14,281 | MIT | 2026-09-10 | shadcn/ui + Vite + TS，10+ 页，最流行的 shadcn 后台起手 |
| marmelab/react-admin | 未核验 | MIT | — | 老牌框架级方案 |

### 2.3 Vue 系（🟢 2026-09-22 实测）

| 项目 | stars | 协议 | 最近 push | 定位 |
|---|---|---|---|---|
| **vbenjs/vue-vben-admin** | 33,505 | MIT | 2026-09-21 | Vue3 v5 monorepo；README 已含 Shadcn UI（技术栈在向 shadcn 体系靠） |
| **soybeanjs/soybean-admin** | 15,032 | MIT | 2026-09-07 | Vue3 + Vite + NaiveUI + UnoCSS，主打「清新优雅高颜值」 |

### 2.4 模版市集（付费/聚合）

- https://www.shadcn.io/templates —— shadcn 模版目录（免费 + 付费聚合，20+ 套）
- https://tailwindcss.com/plus —— Tailwind 官方付费（原 Tailwind UI）
- https://shadcnspace.com / https://shadcnstudio.com / https://shadcndashboard.com —— 第三方 shadcn 商业组件与模版站

### 2.5 避坑

- GitHub 搜 `admin-template` 会撞到**高仿镜像仓**（本次实测遇到 0 star 的 Vben 仿仓）。**认准组织名**（vbenjs / soybeanjs / ant-design / satnaing）。
- 选模版先看 `pushed_at`（最近推送）与 issue 数，避免接手停更项目。

---

## 3. Agent Skill 获取渠道

### 3.1 skills.sh —— 安装量维度的行业目录（🟢 2026-09-22 实测）

- 站点：https://skills.sh ｜ 标准：https://agentskills.io
- 安装：`npx skills add <owner>/<repo>`（或 `--skill <slug> -g`）
- **anthropics/skills 官方仓库：21 个 skill，累计 3.2M 安装**

| skill | 安装量 | 用途 |
|---|---|---|
| **frontend-design** | **910.3K** | 前端界面设计（全站设计类第一） |
| skill-creator | 387.7K | 自建 skill |
| webapp-testing | 161.5K | Web 应用测试 |
| canvas-design | 109.8K | 画布/图形设计 |
| web-artifacts-builder | 102.8K | 构建 Web artifacts |
| brand-guidelines | 94.5K | 品牌规范落地 |
| theme-factory | 86.4K | 主题生成 |

**第三方高安装量设计 skill**：
- `leonxlnx/taste-skill` → design-taste-frontend **505K**（设计品味方向，社区黑马）
- `pbakaus/impeccable` → frontend-design 54.5K

### 3.2 ClawHub —— OpenClaw 原生 registry

- 站点：https://clawhub.ai ｜ 检索：`openclaw skills search "<关键词>"` ｜ 安装：`openclaw skills install @owner/skill`
- 纪律：安装前 `openclaw skills verify`；第三方 skill 视为不可信；「Not scanned」标记的镜像需自担风险。
- 上游生态（awesome-claude-skills 等）会被 ClawHub 镜像收录。
- 实用元技能：`@permew/find-skills` —— 一次搜遍 skills.sh + ClawHub + GitHub，并按各站原生指标（安装量/stars）分栏呈现。

### 3.3 管理后台方向 Skill 的实测结论 ⚠️

skills.sh 搜 "admin dashboard" 结果（安装量）：

| skill | 安装量 | 来源 |
|---|---|---|
| building-admin-dashboard-customizations | 3,938 | medusajs/medusa-agent-skills |
| admin-dashboard | 314 | curiositech/some_claude_skills |
| admin-theme-development | 233 | bagisto/agent-skills |
| dashboard-design-system | 25 | alt-wrk/skills |

🟡 推断（依据：与通用 frontend-design 差 2 个数量级）：
**不存在高质量「管理后台专用」skill**。中后台界面质量的杠杆点在**通用设计 skill + 模版仓库**，而非领域专用 skill。

### 3.4 推荐组合与安装命令

| 场景 | 组合 | 命令 |
|---|---|---|
| 前端界面美化（最通用） | anthropics frontend-design | `npx skills add anthropics/skills --skill frontend-design -g` |
| 设计品味/审美提升 | taste-skill | `npx skills add leonxlnx/taste-skill --skill design-taste-frontend -g` |
| OpenClaw 内使用（中文语境） | fec-ui-design + ui-ux-design | `openclaw skills install @bovinphang/fec-ui-design`<br>`openclaw skills install @itsjustdri/ui-ux-design` |
| 跨registry检索 | find-skills | `openclaw skills install @permew/find-skills` |
| shadcn 技术栈迁移/使用 | shadcn 官方 skill | `npx shadcn@latest` 相关；`pnpm dlx skills add shadcn/ui` |

---

## 4. 给「单人前端 + 中后台」的实操路径 🟡

**React 栈（推荐）**
1. 起手：`npx shadcn@latest init`（默认 Base UI）→ 克隆 satnaing/shadcn-admin
2. 视觉提升：安装 `frontend-design` + `design-taste-frontend` skill 给 coding agent
3. 表单表格海量时换 refine / React Admin 做框架级生成
4. 参考基准：Tabler（免费高颜值）当审美标尺

**Vue 栈**
1. 起手：Vben Admin v5（工程能力全）或 Soybean Admin（颜值优先）
2. 组件：Arco Design Vue / TDesign Vue Next / Naive UI
3. 设计 skill 同样适用（与框架无关）

**AI 快速原型**（源清单既有关注项）：v0 / Lovable / Bolt.new 出高保真原型，生产代码仍以上述栈为准。

---

## 5. 数据来源

- GitHub REST API 实时读取（vbenjs/vue-vben-admin、soybeanjs/soybean-admin、satnaing/shadcn-admin、ant-design/ant-design-pro、refinedev/refine、tabler/tabler、element-plus/element-plus、tusen-ai/naive-ui、Tencent/tdesign-vue-next、arco-design/arco-design）
- shadcn/ui 官方 changelog：https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default
- skills.sh API：`/api/search?q=frontend design`、`/api/search?q=admin dashboard`；https://www.skills.sh/anthropics/skills
- 组件库横评（2026-09-16）：https://www.shadcndeck.com/blog/best-react-ui-libraries-2026
- ClawHub：https://clawhub.ai
- 本档案 UI 设计清单：`memory/intel/source-notes.md` 第三节

> 时效提示：stars/安装量为 2026-09-22 快照，选型前建议复核最新值。

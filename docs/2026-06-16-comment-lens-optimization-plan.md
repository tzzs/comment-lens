# Comment Lens 产品与分发优化方案

> 本方案基于 2026-06-16 的产品、竞品、Marketplace/Open VSX 和本地仓库分析整理。执行前需要先核对当前发布分支、VS Code Marketplace 与 Open VSX 的真实包名、版本和下载数据；本工作树 `package.json` 当前显示为 `0.3.0`，输入分析中提到的公开包快照为 `0.4.2`。

## 核心结论

Comment Lens 现在已经具备可继续产品化的工程底座：跨语言 adapter、inline inlay hints、source fallback、语言健康检查、CI/CodeQL，以及 Marketplace/Open VSX 发布链。下一阶段最重要的不是继续堆随机功能，而是把它收束成一个清晰、可信、可验证的 VS Code 阅读增强工具。

推荐定位：

**在代码引用处显示已有文档，不生成、不改写、不离开当前文件。**

英文主张可固定为：

**Read existing docs where symbols are used.**

这个定位要贯穿 README、Marketplace 标题/描述、Open VSX 页面、GitHub topics、issue templates、诊断命令和后续技术文章。Comment Lens 不和官方语言插件竞争 IntelliSense、definition、debug、test、lint；它复用官方/主流语言服务的 hover 与 definition 数据，在“代码阅读层”提供持续可见的文档上下文。

## 产品边界

Comment Lens 应该继续坚持：

- 只展示已有 doc comment、JSDoc、docstring、Javadoc、PHPDoc、Doxygen/YARD/KDoc/XML docs 或语言服务 hover 文档。
- 默认不修改源文件，不生成注释，不调用 LLM，不上传源码。
- 默认保持 display-only，hint 不成为新的跳转 UI 或编辑入口。
- 以引用处阅读为核心，不转向 TODO 高亮、注释盒子、文档生成器或代码片段管理器。
- 语言质量必须可验证：每次提升 support level 都要有 fixture、单测、integration 可行性说明、截图或手工验证记录，以及语言支持矩阵更新。

## 当前基线

仓库已有能力：

- 包名为 `comment-lens`，当前工作树展示名为 `Comment Lens`，核心描述是 “Show definition comments and symbol documentation inline at reference sites.”
- README 已经描述了读取 doc comment、JSDoc、docstring、Javadoc、PHPDoc 或语言服务 hover 文档，并在引用行尾展示。
- 语言支持矩阵已经把 Go/TS/JS/TSX/JSX 归为 stable，把 Python/Java/Rust/PHP 归为 experimental，把 C#/Ruby/Kotlin/Swift/C/C++ 归为 hover-only。
- 已有 `Comment Lens: Show Language Status`、`commentLens.minimumDocumentationWords`、adapter registry、language health、source fallback 等基础设施。
- 发布链已经覆盖 Marketplace/Open VSX，但公开入口仍受到新旧包并存影响。

主要缺口：

- 市场定位还没有在第一屏形成强记忆点。
- 新包 `comment-lens` 与旧包 `comment-doc-lens` 的认知、搜索权重和历史下载入口被拆开。
- 用户遇到“为什么没显示”时，缺少可复制的 Output Channel / diagnostics。
- 语言质量从 experimental/hover-only 推进到 stable 的证据链还不够产品化。
- 隐私与非 AI 定位还没有变成明确的 Marketplace 信任资产。
- 命令、配置项与商店文案还没有完成中文 VS Code 环境下的本地化收口。

## 优先路线

### P0：校准发布事实与包入口

目标：在动品牌和迁移前，先确认真实的发布状态，避免 README、旧包 deprecation 和商店文案写到错误版本。

执行项：

- 核对当前主分支、release 分支、VS Code Marketplace、Open VSX 的包名和版本。
- 记录新版 `tanzz.comment-lens` 与旧版 `tanzz.comment-doc-lens` 的 installs/downloads。
- 确认旧包是否还能发 deprecation 版本，以及 publisher token 是否仍可用于旧包。
- 把核对结果追加到发布记录或后续 release checklist。

验收标准：

- 有一份可追溯的包入口清单：新包、旧包、Marketplace URL、Open VSX URL、GitHub release URL。
- 后续 README/CHANGELOG/Marketplace 描述中的版本、包名、迁移指向一致。

### P1：品牌收口与 Marketplace 转化

目标：让用户在 10 秒内理解 Comment Lens 和官方语言插件、文档生成器、comment 高亮插件的区别。

执行项：

- 保留 `comment-lens` 作为主包。
- 给旧包 `comment-doc-lens` 发布 deprecation 版本，README、短描述、release note 全部指向新包。
- README 第一屏改成 “Before/After + 10 秒 GIF + 一句话痛点”。
- 标题和短描述围绕 `Read docs where symbols are used` 展开。
- Marketplace/Open VSX keywords 增补：`inline documentation`、`doc comments`、`docstring`、`Javadoc`、`PHPDoc`、`Doxygen`、`code reading`、`hover docs`。
- 分类在 `Programming Languages` 外考虑补充 `Visualization`。
- GitHub topics 对齐关键词，增加 issue templates：bug report、language support request、missing hint diagnostics。
- 新增隐私声明：本地运行、不上传源码、不调用 LLM、不生成或改写注释。

验收标准：

- README 第一屏不需要滚动即可看到产品名、核心主张、实际效果图/GIF、非生成式定位。
- 旧包页面明确指向新包，且不会让历史用户以为项目停止维护。
- Marketplace/Open VSX 页面关键词覆盖主搜索意图。
- 隐私声明可被 README、Marketplace 和 issue template 共同引用。

建议提交拆分：

- `docs(readme): sharpen marketplace positioning`
- `chore(marketplace): align package keywords and categories`
- `docs(privacy): document local-only behavior`
- `chore(release): deprecate legacy package entry`

### P2：官方级体验细节

目标：降低“为什么没显示”的困惑，把语言服务依赖、fallback 状态和性能行为变成用户可理解、可复制的诊断信息。

执行项：

- 增加 `resolveInlayHint` 惰性解析：`provideInlayHints` 只构建轻量 summary；tooltip、definition location、full docs 在用户需要时再解析。
- 增加 `Comment Lens` Output Channel，记录语言服务状态、跳过原因、fallback 命中、timeout、配置过滤、cache 统计。
- 增加 `Comment Lens: Diagnose Workspace`，扫描当前 workspace 的语言服务、推荐扩展、fallback 覆盖、缺失依赖、代表性文件状态。
- 增加 `Comment Lens: Copy Diagnostics for Issue`，输出可直接粘贴到 GitHub issue 的 Markdown。
- 增加 `Comment Lens: Show Why This Hint Is Hidden` 或等价诊断入口，解释当前光标/当前行为什么没有 hint。
- 增加 `package.nls.zh-cn.json`，本地化命令标题、配置项描述和关键诊断文案。

验收标准：

- 用户在没有打开开发者工具的情况下，能复制一段包含语言、扩展、hover/definition、fallback、配置和 timeout 信息的诊断报告。
- 默认 hint 仍保持轻量、display-only；交互详情只在需要时解析。
- 中文 VS Code 环境下，命令和配置项不再混杂大段英文。
- 对性能敏感路径有单测或集成测试覆盖，避免惰性解析退化成全量解析。

建议提交拆分：

- `perf(hints): resolve inlay hint details lazily`
- `feat(diagnostics): add output channel and copyable report`
- `feat(diagnostics): diagnose workspace language readiness`
- `feat(i18n): localize commands and settings`

### P3：语言质量升级

目标：把语言支持等级从“能跑”推进到“有证据地稳定”，并让每种语言的限制可解释。

稳定化规则：

- 每个 stable 语言必须有代表性 fixture。
- 每个 stable 语言必须覆盖 hover、definition hover、source fallback 或明确说明不需要 fallback。
- 每个 stable 语言必须有噪音过滤测试，例如 signature-only、bare type name、短摘要、声明行误报。
- 每次 support level 调整必须同步 README、`docs/language-support.md`、CHANGELOG 和截图/验证记录。
- integration 无法自动运行时，必须记录宿主环境原因和手工验证步骤。

近期升级目标：

- Python：补齐 module/function/class/method docstring fixture，验证 Pylance 场景和 source fallback 场景。
- Java：补齐 Javadoc class/method/field fixture，验证 Extension Pack for Java 索引后的 hover/definition。
- Rust：补齐 `///`、`//!`、trait、impl method fixture，验证 rust-analyzer 输出质量。
- PHP：补齐 class/function/method/property/const PHPDoc，验证 Intelephense 与 source fallback。

中期 fallback 目标：

- C#：XML docs source fallback。
- Ruby：YARD/RDoc source fallback。
- Kotlin：KDoc source fallback。
- C/C++：Doxygen source fallback，明确 compile commands/include path 限制。
- Swift：doc comment fallback，明确 SourceKit-LSP 和本机 Swift 工具链限制。

验收标准：

- Python/Java/Rust/PHP 从 experimental 升级为 stable 前，每个语言都有测试、fixture、矩阵、截图或手工记录。
- C#/Ruby/Kotlin/C/C++/Swift 从 hover-only 升级到 experimental 前，先证明 fallback 能稳定读取本地 source comment。
- 支持矩阵中每种语言的推荐扩展、已知限制、fallback 行为、验证状态保持同步。

建议提交拆分：

- `test(python): prove docstring fallback quality`
- `test(java): prove javadoc fallback quality`
- `test(rust): prove doc comment fallback quality`
- `test(php): prove phpdoc fallback quality`
- `feat(csharp): add xml docs source fallback`
- `feat(ruby): add yard source fallback`
- `feat(kotlin): add kdoc source fallback`
- `feat(cpp): add doxygen source fallback`
- `feat(swift): add doc comment source fallback`

### P4：增长功能与样例资产

目标：用小功能降低试用门槛、issue 成本和商店跳出率，而不是偏离核心产品。

执行项：

- 增加 `Open Sample Gallery`，打开仓库内或文档站中的多语言示例。
- 增加 README demo gallery：Go、TypeScript、Python、Java、Rust、PHP、C# 等代表语言各一张真实截图。
- 写一篇技术文章：`Inline docs without generating comments`，解释和官方语言插件、JSDoc/Doxygen 生成器、AI 文档生成器的差异。
- 在 GitHub Release、Marketplace、Open VSX、README、README_CN 中复用同一套定位和截图。
- 对旧包迁移写一段短 FAQ：为什么改名、旧用户怎么办、是否需要卸载旧包。

验收标准：

- 新用户能通过 README 或 Sample Gallery 在 1 分钟内看到自己语言的真实效果。
- 技术文章明确强调本地、非生成式、复用语言服务、引用处阅读。
- 旧包用户有明确迁移路径，issue 中不再重复解释包名关系。

### P5：维护机制与指标

目标：让后续每月质量版本、每季度语言扩展有固定节奏，避免回到“功能随机游走”。

维护节奏：

- 每月发一个质量版本：bugfix、诊断、语言质量、截图/文档更新。
- 每季度扩一个语言或把一个语言提升 support level。
- 每个新语言必须先进入支持矩阵，再进入代码；同一 PR 内必须包含 fixture、单测和文档。
- 每次发布后检查 Marketplace Acquisition Trend、Total Acquisition、Ratings & Reviews、Open VSX downloads 和 GitHub issues。

核心指标：

- Marketplace 安装转化：README/商店页改造后 installs/downloads 是否提升。
- 旧包迁移：旧包 downloads 是否逐步下降，新包 downloads 是否承接增长。
- 诊断有效性：新 issue 中附带 `Copy Diagnostics for Issue` 的比例。
- 语言质量：每个 support level 的 fixture 覆盖数、fallback 命中率、噪音过滤回归数。
- 用户信任：隐私相关 issue 或评论是否下降。
- 维护健康：发布后 7 天内是否有 crash、性能或语言误报回归。

发布 checklist：

- `npm test`
- `npm run package`
- 可用宿主环境下运行 `npm run test:integration`
- 更新 README、README_CN、`docs/language-support.md`、CHANGELOG
- 更新截图/GIF 或注明无需更新
- 检查 package keywords/categories/description
- 验证 Marketplace 与 Open VSX 发布结果
- 记录旧包/新包下载与安装快照

## 推荐执行顺序

### 近期 1 周

- 校准新旧包和注册表数据。
- 完成旧包 deprecation 版本。
- 重写 README 第一屏，补 GIF/Before-After、关键词、分类、隐私声明。
- 补 GitHub topics 和 issue templates。
- 输出一版 README_CN 同步改造。

### 接下来 2-4 周

- 实现 Output Channel。
- 实现 workspace diagnosis。
- 实现 copyable diagnostics。
- 引入 `resolveInlayHint` 惰性解析。
- 稳定 Python/Java/Rust/PHP，并补真实 demo 截图。

### 1-2 个月

- 补 C#/Ruby/Kotlin/C++/Swift source fallback。
- 发布 sample gallery。
- 发布技术文章 `Inline docs without generating comments`。
- 固定月度质量版本和季度语言升级机制。

## 风险与处理

| 风险 | 影响 | 处理 |
| --- | --- | --- |
| 新旧包同时存在，用户搜索和下载被拆开 | 影响增长数据和品牌识别 | 旧包发 deprecation 版本，所有入口指向新包，保留历史下载入口 |
| 语言服务差异导致 hint 不稳定 | 用户认为扩展坏了 | Output Channel、workspace diagnosis、support matrix 和 issue diagnostics 解释依赖状态 |
| fallback 误读无关注释 | 噪音增加，降低信任 | 每种语言增加 declaration 过滤、注释距离限制、signature-only 过滤和 fixture |
| 惰性解析实现不当导致体验退化 | tooltip/full docs 慢或不一致 | 默认 summary 与 resolve details 分离，增加 timeout/cache 统计和回归测试 |
| 过早宣传 hover-only 语言为稳定 | 负面评价 | support level 必须由证据驱动，README 和矩阵保持保守 |
| AI 文档生成器认知干扰 | 用户误会会上传源码或生成注释 | README、Marketplace、隐私声明反复强调本地、非生成式、不改写 |

## 最终成功标准

- Marketplace/Open VSX/GitHub 对外信息统一为 `Comment Lens` 与 `Read existing docs where symbols are used`。
- 旧包用户有清晰迁移路径，新包成为唯一主入口。
- 用户可以复制诊断报告解释“为什么没有显示 hint”。
- Python/Java/Rust/PHP 至少完成一轮 stable 证据建设或明确留下未达标原因。
- README、README_CN、语言矩阵、截图/GIF、CHANGELOG 与实际功能一致。
- 后续每个语言升级都能按矩阵、fixture、测试、截图、发布记录闭环。

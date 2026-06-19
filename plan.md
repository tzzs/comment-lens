# Comment Doc Lens 待优化执行计划

> 当前基线：`comment-doc-lens` / `Comment Doc Lens` / `0.5.0`。
> 本计划补充当前待优化内容；现有长期来源仍以 `docs/language-support.md`、`docs/language-service-evidence.md` 和 `docs/2026-06-16-comment-lens-optimization-plan.md` 为准。

## 产品边界

Comment Doc Lens 的核心定位保持不变：

**在代码引用处显示已有文档，不生成、不改写、不上传源码。**

继续坚持：

- 只读取已有 doc comment、docstring、Javadoc、PHPDoc、XML docs、YARD/RDoc、KDoc、Swift doc comment、Doxygen 或语言服务 hover/definition 输出；
- 不生成注释；
- 不重写源文件；
- 不上传源码；
- 不把插件扩展成通用 LSP、lint、AI 文档或代码分析平台。

## 当前判断

当前插件已经具备稳定的基础形态：多语言 adapter、source fallback、语言状态诊断、workspace diagnosis、可复制 issue 诊断报告、样例文档、发布链和测试门槛都已存在。下一阶段不应优先继续堆新语言或大功能，而应优先补齐可信证据、反馈闭环、诊断精度和公开入口转化。

本轮待优化项按优先级分为：

1. P0：反馈闭环与 issue 模板；
2. P1：语言服务真实证据；
3. P2：诊断精度与可观测性；
4. P3：公开入口与增长素材；
5. P4：谨慎评估的可选技术增强。

## P0：反馈闭环与 issue 模板

目标：让用户遇到 missing hint、语言服务不可用、噪音提示或性能问题时，能够提交可复现、可判断、可行动的反馈。

待优化内容：

- 新增 GitHub issue templates：
  - missing hint diagnostics；
  - language support request；
  - bug report；
  - performance or timeout report。
- 在 missing hint 模板中要求用户粘贴：
  - `Comment Doc Lens: Show Language Status` 输出；
  - `Comment Doc Lens: Explain Hidden Hint` 输出；
  - `Comment Doc Lens: Copy Diagnostics for Issue` 输出；
  - 当前 language id；
  - 是否安装推荐语言扩展和工具链；
  - 最小复现代码片段或 fixture 路径。
- 优化 `Copy Diagnostics for Issue` 输出字段：
  - extension version；
  - VS Code version；
  - active language id；
  - enabled languages；
  - per-language override；
  - max line length、max hint length、minimum documentation words、timeout；
  - 最近一次 language health 状态；
  - 最近一次 hidden hint explanation；
  - 最近一次 workspace diagnosis 摘要。
- 将 issue 模板与 README、README_CN、docs/release-quality-checklist.md 互相链接。

验收标准：

- `.github/ISSUE_TEMPLATE/` 至少包含 missing hint、language support、bug report 三类模板；
- 模板中的字段可以直接映射到现有诊断命令输出；
- `npm run harness:check` 和 `npm test` 通过；
- 新用户不需要理解内部实现，也能提交可诊断问题。

## P1：语言服务真实证据

目标：把语言支持从“有 fallback 和测试”推进到“有真实 VS Code language-service 证据”。未完成证据前，不提升 experimental 语言等级。

待优化内容：

- 按 `docs/language-service-evidence.md` 的 capture checklist 补齐以下语言真实证据：
  - C#：C# Dev Kit 或 OmniSharp；
  - Ruby：Ruby LSP 或 Solargraph；
  - Kotlin：Kotlin language server；
  - Swift：Swift extension + SourceKit-LSP；
  - C/C++：C/C++ extension + include path 或 compile commands。
- 每个 experimental 语言至少捕获：
  - `Show Language Status`；
  - `Copy Diagnostics for Issue`；
  - hover 是否返回有用文档；
  - definition 是否返回预期声明；
  - source fallback 是否命中；
  - Output Channel excerpt 或截图。
- 为 stable 语言补代表性证据：
  - Python；
  - Java；
  - Rust；
  - PHP。
- 将证据同步到：
  - `docs/language-service-evidence.md`；
  - `docs/language-support.md`；
  - `docs/sample-gallery.md`；
  - release notes。

验收标准：

- 每个 experimental 语言都有一份真实语言服务 capture 或明确的环境阻塞记录；
- 只有真实 hover/definition、fallback 测试、噪音过滤、截图或日志、支持矩阵和 CI 全部闭环后，才评估升级为 `stable`；
- `npm test`、`npm run harness:check`、`npm run package -- --out /tmp/comment-doc-lens-verify.vsix` 通过。

## P2：诊断精度与可观测性

目标：让诊断命令不仅能说明“可能为什么不显示”，还可以定位是候选扫描、过滤、hover、definition、fallback、timeout、缓存还是配置导致的问题。

待优化内容：

- 优化 `Comment Doc Lens: Explain Hidden Hint`：
  - 展示当前行候选符号列表；
  - 标出每个候选被跳过的原因；
  - 区分 declaration、noisy candidate、property chain head、line too long、too short summary、signature-only hover、timeout、missing dependency。
- 优化 `Comment Doc Lens: Diagnose Workspace`：
  - 不再只用文件中的第一个单词作为探针；
  - 优先选择 adapter 认为更像 call-site 的候选；
  - 在报告中显示扫描文件数、支持语言数、ready/degraded/missingDependency/unknown 计数；
  - 对每个语言给出最可能的下一步操作。
- 增加 Output Channel 可观测字段：
  - candidate count；
  - resolved count；
  - skipped count；
  - timeout count；
  - cache hit/miss；
  - language id；
  - adapter support level；
  - source fallback used；
  - request duration。
- 评估是否需要 per-language timeout/cache 指标；仅当真实 issue 或大型 workspace 报告证明需要时再加入设置项。

验收标准：

- `Explain Hidden Hint` 能直接说明当前行为什么没有 hint；
- `Diagnose Workspace` 能更可靠地探测真实引用点；
- 诊断报告可以帮助维护者复现 missing hint；
- 不显著增加默认 inlay hint 请求成本。

## P3：公开入口与增长素材

目标：让插件在 GitHub、Marketplace、Open VSX 和 README 中保持统一、可信、易理解，并提高安装转化。

待优化内容：

- 核对公开入口：
  - GitHub repository；
  - Marketplace；
  - Open VSX；
  - GitHub release；
  - release tag；
  - README links；
  - package metadata。
- 补 GitHub topics：
  - `vscode-extension`；
  - `documentation`；
  - `inlay-hints`；
  - `doc-comments`；
  - `docstring`；
  - `code-reading`。
- 补 10 秒以内 GIF 或短视频：
  - 使用现有 Before/After 场景；
  - 重点展示“引用处显示已有文档”；
  - 同步 README、Marketplace、Open VSX 和 release notes。
- 扩展 `docs/sample-gallery.md`：
  - 为 C#、Ruby、Kotlin、Swift、C/C++ 补真实截图或日志后再展示；
  - 避免把 experimental 语言包装成 stable。
- 定期记录增长和质量指标：
  - Marketplace Acquisition Trend；
  - Marketplace Total Acquisition；
  - Marketplace ratings/reviews；
  - Open VSX downloads；
  - GitHub stars、issues、support requests；
  - diagnostics report 使用率。

验收标准：

- 对外名称统一为 `Comment Doc Lens`；
- 对外包名统一为 `comment-doc-lens`；
- 对外主张统一为 `Read existing docs where symbols are used`；
- README、README_CN、sample gallery、Marketplace、Open VSX 与实际功能一致；
- 公开素材不夸大 experimental 语言成熟度。

## P4：谨慎评估的可选技术增强

目标：只在已有过滤和诊断仍不足时，引入更复杂的辅助能力。所有增强必须服务于“读取已有文档”这一边界。

候选增强：

- `Open Language Setup`：
  - 根据当前 language id 打开推荐扩展安装页或说明；
  - 对 missingDependency 提供更直接恢复路径。
- `Copy Minimal Repro`：
  - 基于当前文件、当前行、语言状态和配置生成更小的 issue 复现模板；
  - 比完整 diagnostics 更适合快速粘贴。
- document symbols / references 辅助过滤：
  - 仅当真实误匹配问题证明现有 adapter/filter 不足时引入；
  - 优先用于减少 declaration、same-line duplicate、property chain noise；
  - 不替代语言服务 hover/definition。
- Web/Codespaces 支持评估：
  - 先验证 inlay hints、hover provider、definition provider、source fallback 在 web extension 环境下的可行性；
  - 未验证前不在 README 中承诺 web 支持。
- 更细的 language upgrade 流程：
  - 每季度最多升级一个语言；
  - 每次升级必须包含 fixture、tests、docs、evidence、release notes。

暂不做：

- AI 生成注释；
- 自动补全文档；
- 自动重写源码；
- 上传源码做分析；
- 和官方语言插件竞争 IntelliSense、definition、debug、test 或 lint；
- 没有 evidence 的语言等级提升；
- 为增长而添加与核心阅读体验无关的功能。

## 建议执行顺序

### 第一阶段：1 周内

1. 新增 issue templates。
2. 优化 diagnostics report 字段。
3. 刷新当前状态文档中的版本和公开入口信息。
4. 补 GitHub topics。
5. 运行 `npm test`、`npm run harness:check`。

### 第二阶段：2-4 周

1. 按 `docs/language-service-evidence.md` 补 Swift 和 PHP 的真实语言服务记录。
2. 继续补 C#、Ruby、Kotlin、C/C++ 的真实语言服务记录或环境阻塞记录。
3. 优化 `Explain Hidden Hint` 的候选级原因输出。
4. 优化 `Diagnose Workspace` 的探针选择。
5. 更新 sample gallery 和 release notes。

### 第三阶段：1-2 个月

1. 用真实 issue 和 diagnostics 数据挑选一个语言升级目标。
2. 根据增长指标决定是否补 GIF 或 Marketplace 素材。
3. 评估 document symbols / references 辅助过滤是否值得做。
4. 发布 monthly quality release。

## 每次优化的完成门槛

- 没有扩大产品边界；
- README、README_CN、language support matrix 和 sample gallery 与实际行为一致；
- 新增功能有单元测试或明确手工验证；
- 涉及打包内容时运行 `npm run package -- --out /tmp/comment-doc-lens-verify.vsix`；
- 涉及文档索引时运行 `npm run harness:check`；
- 涉及代码、配置、语言支持或诊断行为时运行 `npm test`；
- 若 integration host 可用，再运行 `npm run test:integration`。



---

## 设计原则

### 核心理念：HTML 只是架子

`index.html` 是一个静态骨架，不含任何内容数据。所有文字、功能、交互均由 JavaScript 在运行时动态注入。HTML 中只有占位元素（带 `data-home-slot`、`data-article-open` 等属性的空容器），真正的内容来自 `articles/` 目录下的 Markdown 文件。

### 目录结构

```
docs/
├── index.html                  # 静态骨架，唯一的 HTML 入口
├── 404.html
├── articles/                   # 所有文章内容（Markdown + 少量 JS）
│   ├── essay/                  # 散文
│   ├── poem/                   # 诗歌
│   ├── home/                   # 首页插槽内容（hero, lovestory1-3, midline, footer）
│   └── hidden/                 # 隐藏文章（.md + .js 配对）
├── assets/
│   ├── js/site.js              # 核心运行时（唯一静态加载的 JS）
│   ├── css/style.css           # 全局样式
│   ├── algorithms/             # 算法可视化模块（运行时动态加载）
│   ├── features/               # 站点功能插件（运行时动态加载）
│   └── images/                 # 静态图片资源
```

### 运行时加载机制

页面启动时只加载一个脚本：`assets/js/site.js`。其余所有 JS 均在 `DOMContentLoaded` 后按以下顺序动态发现并加载：

```
DOMContentLoaded
  ├── 1. 发现并加载 algorithms/*.js（算法可视化）
  ├── 2. 发现并加载 features/*.js（站点功能插件）
  ├── 3. 发现并加载 articles/*.md（文章内容）
  └── 4. 触发 appReady 事件
        └── 隐藏文章的 *.js 触发脚本在此阶段加载
```

**发现策略**：优先尝试本地目录遍历（fetch 目录列表页解析 `<a>` 标签），失败则回退到 GitHub API (`git/trees`)。

**去缓存**：所有动态脚本加载时附加 `_=timestamp` 查询参数，确保不命中缓存。

### 三类插件体系

#### 1. 算法可视化 (`assets/algorithms/*.js`)

通过 `window.__registerAlgorithmVisualizer` 注册，提供 `{ id, mount }` 接口。

```js
window.__registerAlgorithmVisualizer({
  id: 'tsp',
  mount(canvas) {
    // 在 canvas 上启动动画
    return { _paused: false }; // 可选：返回控制对象
  }
});
```

- 首页随机选取两个算法挂载到两个 `<canvas>` 元素上
- 使用 `IntersectionObserver` 实现离屏暂停

#### 2. 站点功能插件 (`assets/features/**/*.js`)

通过 `window.__registerSiteFeature` 注册，工厂函数接收完整的 API 对象。

```js
window.__registerSiteFeature((api) => {
  // api.runtimeData      — 全部运行时数据
  // api.getArticle(slug) — 按 slug 获取文章
  // api.openArticle(slug)/ closeArticle() — 控制弹窗
  // api.onArticleOpen(handler)  — 文章打开事件
  // api.onArticleClose(handler) — 文章关闭事件
  // api.onKeydown(handler)      — 全局键盘事件
  // api.onHomeSlotReady(handler) — 首页插槽就绪
  // api.onAppReady(handler)      — 应用就绪
  // api.onDirectoryFilterClick(handler) — 分类筛选点击
  // api.unlockHiddenDirectory()  — 解锁隐藏目录
});
```

#### 3. 文章附属脚本 (`articles/**/*.js`)

文章 sidecar 会和站点功能脚本一起被统一扫描加载，不再要求脚本文件名和文章文件名一致。

每个脚本都必须显式声明自己要挂到哪篇文章：

```js
window.__registerArticleFeature({
  slug: 'poem/镜花',
  setup(api) {
    // api.slug              — 当前目标文章 slug
    // api.article / api.getArticle() — 当前文章对象
    // api.open()            — 打开当前文章
    // api.openArticle(slug) — 打开任意文章
    // api.closeArticle()    — 关闭文章弹窗
    // api.onOpen(handler)   — 当前文章打开时触发
    // api.onClose(handler)  — 当前文章关闭时触发
    // api.onArticleOpen(handler)
    // api.onArticleClose(handler)
    // api.onKeydown(handler)
    // api.onDirectoryFilterClick(handler)
    // api.unlockHiddenDirectory()
  }
});
```

旧的 `window.__registerHiddenArticleTrigger` 已废弃，不再作为 hidden 文章的专用加载方式。

### 文章 Markdown 格式

每篇文章是一个自定义格式的 Markdown 文件，头部元数据用特殊前缀标记：

```md
# 文章标题
@2024-05-08
&散文 生活
> 这是文章摘要，会显示在卡片和弹窗中。

正文内容...
```

- `# 标题` — 第一个 `#` 行为文章标题
- `@日期` — 发布日期，支持 `YYYY-MM-DD`、`YYYY年M月D日`、`M月D日` 等格式
- `&标签1 标签2` — 空格分隔的标签，第一个标签作为分类
- `> 摘要` — 引用块形式的摘要
- 正文支持标准 Markdown（标题、代码块、引用、列表、链接、图片）

**后记（Afterword）**：正文末尾的连续 `>` 引用块（可带 `@日期` 后缀）会被解析为独立的后记条目。

### 事件桥接系统

`site.js` 内部维护一个事件桥 `HIDDEN_RUNTIME_BRIDGE`，各模块通过它进行解耦通信：

| 事件桶 | 触发时机 |
|---|---|
| `articleOpenListeners` | 文章弹窗打开 |
| `articleCloseListeners` | 文章弹窗关闭 |
| `keydownListeners` | 全局键盘按下 |
| `homeSlotListeners` | 首页插槽内容就绪 |
| `appReadyListeners` | 应用完全就绪 |
| `directoryFilterListeners` | 分类筛选按钮被点击 |

### 隐藏目录机制

隐藏文章默认不在目录中显示。解锁方式：连续点击"全部文章"筛选按钮 100 次（2 秒内无点击则重置计数）。解锁后隐藏分类出现在筛选列表中。

### 样式设计

- CSS 自定义属性（`--bg`, `--text`, `--line` 等）驱动全局主题
- 暗色模式通过 `body.dark-mode` 类切换，自动检测系统偏好 + 夜间时段（20:00-6:00）
- 响应式断点：1320px / 1180px / 720px

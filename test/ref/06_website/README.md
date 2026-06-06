# Starletto 网站部署说明

## 目录结构

```
00_hub/06_website/
├── index.html          # 主页面
├── css/
│   └── style.css      # 样式文件
├── js/
│   └── main.js        # JavaScript 文件
├── images/
│   └── favicon.svg    # 网站图标
└── README.md          # 本文档
```

## 部署方式

### 方式一：本地直接打开

1. 进入网站目录：
   ```bash
   cd 00_hub/06_website
   ```

2. 直接在浏览器中打开 `index.html` 文件

### 方式二：使用本地服务器（推荐）

使用 Python 启动简单的 HTTP 服务器：

```bash
# Python 3
cd 00_hub/06_website
python -m http.server 8000

# Python 2
cd 00_hub/06_website
python -m SimpleHTTPServer 8000
```

然后在浏览器中访问：`http://localhost:8000`

### 方式三：使用 Node.js 服务器

如果你安装了 Node.js，可以使用 `http-server`：

```bash
# 安装 http-server
npm install -g http-server

# 启动服务器
cd 00_hub/06_website
http-server -p 8000
```

然后在浏览器中访问：`http://localhost:8000`

### 方式四：部署到 Web 服务器

将 `00_hub/06_website/` 目录下的所有文件上传到你的 Web 服务器即可。

支持的服务器类型：
- Apache
- Nginx
- IIS
- 任何静态文件服务器

## 技术栈

- **HTML5**: 页面结构
- **CSS3**: 样式设计（遵循 WIRED 设计风格）
- **JavaScript (ES6+)**: 交互功能和仿真画布
- **Canvas API**: 自动驾驶仿真可视化

## 设计特点

### 布局结构
- **顶部固定导航栏**：三列布局（名称 | 导航链接 | GitHub/登录）
- **三列内容区**：
  - 左侧：项目介绍
  - 中间：快速统计和特色设计
  - 右侧：Canvas 仿真界面
- **横向滚动区**：应用场景和解决方案
- **文档区**：分类文档列表，点击查看详细内容
- **页尾**：产品、解决方案、资源、关于我们等链接

### 设计风格（遵循 WIRED 风格）
- **颜色方案**：
  - 主色：纯黑 (#000000) 和纸白 (#ffffff)
  - 强调色：链接蓝 (#057dbc)
  - 中性色：页面墨 (#1a1a1a)、说明灰 (#757575)、发丝灰 (#e2e8f0)
- **排版**：
  - 标题：WiredDisplay 风格（Helvetica 替代）
  - 正文：BreveText 风格（Helvetica 替代）
  - UI：Apercu 风格（Helvetica 替代）
  - 标签：WiredMono 风格（Courier New 替代）
- **视觉元素**：
  - 硬边框：2px 纯黑边框
  - 方角：所有元素 0 圆角
  - 无阴影：完全平面设计
  - 发丝线：1px 分隔线

## 功能特性

### 交互功能
- **分类筛选**：左侧分类栏可筛选文档
- **文档模态框**：点击文档显示详细内容
- **仿真画布**：Canvas 绘制的自动驾驶仿真界面
- **滚动动画**：元素进入视口时淡入显示
- **响应式设计**：适配桌面、平板、移动设备

### 仿真画布
- 道路和车道线
- 车辆模型
- 轨迹规划可视化
- 传感器覆盖范围
- 目标物体（行人、车辆、障碍物）

### 文档系统
- 架构设计
- 模块设计
- 算法
- 仿真
- 部署
- API 文档
- 示例代码
- 常见问题

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 响应式设计

- **桌面端** (≥1024px)：完整三列布局
- **平板端** (768-1023px)：单列布局，侧边栏堆叠
- **移动端** (≤767px)：单列布局，简化导航

## 性能优化

- **资源压缩**：CSS 和 JS 文件最小化
- **懒加载**：图片和非关键资源延迟加载
- **Canvas 优化**：高效的 2D 绘制
- **事件委托**：减少事件监听器数量
- **防抖处理**：窗口 resize 事件优化

## 自定义

### 修改设计

编辑 `css/style.css` 文件中的 CSS 变量：

```css
:root {
    --wired-black: #000000;        /* 主黑 */
    --page-ink: #1a1a1a;           /* 页面墨 */
    --paper-white: #ffffff;         /* 纸白 */
    --link-blue: #057dbc;           /* 链接蓝 */
    /* ... 其他变量 */
}
```

### 添加新文档

1. 在 `index.html` 中添加文档项：
   ```html
   <div class="doc-item" data-category="category-name">
       <div class="doc-item-header">
           <div class="doc-item-title">文档标题</div>
           <div class="doc-item-meta">分类</div>
       </div>
       <div class="doc-item-text">
           文档描述
       </div>
   </div>
   ```

2. 在 `js/main.js` 中的 `docContent` 对象中添加文档内容：
   ```javascript
   '文档标题': `
       <h2>文档标题</h2>
       <p>文档内容...</p>
   `
   ```

### 添加新应用场景

在 `index.html` 的 `scroll-container` 中添加新的场景：

```html
<div class="scroll-item">
    <h3 class="scroll-item-title">场景名称</h3>
    <p class="scroll-item-text">
        场景描述...
    </p>
</div>
```

## 注意事项

1. **路径问题**：所有资源引用使用相对路径，确保在任何部署环境下都能正常工作
2. **缓存**：建议在 Web 服务器上配置适当的缓存策略
3. **HTTPS**：生产环境建议使用 HTTPS
4. **兼容性**：确保在主流浏览器中测试

## 常见问题

### Q: 仿真画布不显示？
A: 检查浏览器是否支持 Canvas API，确保 JavaScript 已启用。

### Q: 文档模态框不工作？
A: 检查浏览器控制台是否有 JavaScript 错误。

### Q: 响应式布局不正常？
A: 检查浏览器宽度是否在对应断点范围内，清除浏览器缓存。

## 更新日志

### v1.0.0 (2026-04-14)
- 初始版本发布
- 遵循 WIRED 设计风格
- 三列布局结构
- 自动驾驶仿真画布
- 完整的文档系统
- 响应式设计

## 联系方式

如有问题或建议，请联系：
- Email: info@starletto.io
- GitHub: github.com/starletto

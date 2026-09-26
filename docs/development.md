# Development Guide

FreeMap 是一个面向新加坡区域的地图交互原型。这里记录本地运行、测试、数据边界与资源来源。

[项目入口](../README.md) · [设计案例](../case-study.md)

## 启动

在本目录执行：

```sh
node server.mjs
```

打开 <http://localhost:4173>。Windows 也可以双击 `启动网站.cmd`。需要 Node.js 20 或更高版本，运行网站无需安装 npm 依赖。不要直接双击 `index.html`，浏览器需要通过 HTTP 加载 JavaScript 模块。

## 已实现

- 新加坡真实地理底图，地图平移、缩放、回到默认视野。
- 60 条明确标记的演示物品，五种物品类别及 All finds 入口。
- 分类和 1–30 km 半径的组合筛选；距 City Hall 固定参考中心计算。
- 地图视野内结果数量，随筛选、拖拽与缩放更新。
- 四级新鲜度、悬停标题、选中标记高亮。
- 带图片或分类替代图的详情卡，显示区域、时间、距离和演示状态。
- 收藏、取消收藏、收藏面板、浏览器本地持久化；异常存储可降级。
- 零结果提示与重置、图片失败替代图、地图加载失败与重试。
- 手机端分类横向滚动、详情与收藏底部面板，以及键盘操作。

## 数据边界

所有物品均为虚构示例，坐标仅用于地图演示，不代表领取地址。照片是示意素材，不代表真实待领取物品。原帖地址为空，领取入口明确禁用。

没有接入 Craigslist、抓取服务、真实发布、登录或后台。这与规格中“演示版先行”的范围一致。未来数据接入可以替换 `src/data.js` 的数据提供逻辑，保留核心字段；来源链接必须为 HTTPS，演示条目不会开放领取入口。

演示发布时间在第一次访问时生成，并保存基准时间，刷新不会把旧物品重新变为刚发布。收藏使用 `freemap.stash.v1`，时间基准使用 `freemap.demo-anchor.v1`。清除该站点的浏览器存储可重置演示。

## 地图

交互引擎为本地随附的 Leaflet 1.9.4。底图使用 OpenStreetMap 在线瓦片，并通过 CSS 处理为深色；网络不可用时会提示，但仍保留物品点位和收藏操作。

地图源可在 `src/app.js` 的 `L.tileLayer` 配置中替换。底图只按当前地图视图加载，未提供离线下载或批量预取。正式上线前应配置适合使用规模的地图服务。

文档参考：[Leaflet API](https://leafletjs.com/reference.html)、[OpenStreetMap 瓦片使用要求](https://operations.osmfoundation.org/policies/tiles/)。本地许可证见 `vendor/LEAFLET-LICENSE.txt`。

## 文件

| 文件 | 内容 |
| --- | --- |
| `index.html`、`styles.css` | 页面结构与响应式视觉 |
| `src/app.js` | 地图、详情、收藏与界面联动 |
| `src/core.js` | 距离、新鲜度、筛选、存储校验 |
| `src/data.js` | 60 条本地演示物品 |
| `src/icons.js` | 本地 SVG 图标 |
| `assets/` | 本地示意照片和网站图标 |
| `server.mjs` | 仅监听本机的静态预览服务 |
| `tests/` | 核心逻辑和浏览器验证 |
| `screenshots/` | 验收截图与浏览器测试报告 |

## 验证

核心测试无需额外依赖：

```sh
node --test tests/core.test.mjs
```

浏览器测试需要 Playwright，并需要预览服务已启动：

```sh
npm install --no-save playwright
node tests/browser.test.mjs
```

Windows 默认使用已安装的 Microsoft Edge。其他平台需要先用 Playwright 安装 Chromium。也可通过 `FREEMAP_PLAYWRIGHT_PATH` 指定已有 Playwright 模块的 `index.mjs` 绝对路径。

浏览器测试首次检查真实地图加载，后续交互测试使用模拟瓦片，避免反复加载额外地图区域。测试覆盖分类、范围、收藏刷新恢复、详情关闭、移动端、图片失败和地图失败恢复。

## 示意图片来源

照片已存入本地，不依赖运行时图片请求；图片加载失败有类别替代图。

- 椅子：[Unsplash image](https://images.unsplash.com/photo-1567538096630-e0c55bd6374c)
- 显示器：[Unsplash image](https://images.unsplash.com/photo-1527443224154-c4a3942d3acf)
- 自行车：[Unsplash image](https://images.unsplash.com/photo-1485965120184-e220f721d03e)

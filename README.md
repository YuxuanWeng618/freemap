![FreeMap — Singapore map with free-item markers and filters](screenshots/desktop.png)

# FreeMap

FreeMap 是一个基于地图的免费二手物品发现原型。它将位置、距离与发布时间整合在新加坡地图上，支持分类和半径筛选、详情查看及本地收藏，并适配手机浏览。当前包含 60 条演示物品，探索用空间关系组织二手信息的交互方式。

## Features

- **Explore the map** — 拖拽、缩放，查看当前视野中的物品数量。
- **Filter nearby finds** — 五种类别、1–30 km 范围，距离以 City Hall 为参考。
- **Read freshness** — 用发布时间、颜色和光晕区分四级信息新鲜度。
- **Inspect & save** — 查看详情、收藏物品，刷新后恢复收藏。
- **Use it on mobile** — 横向分类栏、底部详情面板与键盘操作。
- **Recover gracefully** — 空结果、图片缺失和地图加载失败均有反馈。

## Tech Stack

HTML · CSS · JavaScript (ES modules) · Leaflet · OpenStreetMap · LocalStorage

Node.js 本地预览与逻辑测试 · Playwright 浏览器验证

## Live Demo

项目目前为私有，公开演示已关闭。可按下方说明在本地运行。

演示数据不代表真实可领取物品；未使用用户定位，未接入 Marketplace 数据。

## Case Study

阅读 [完整案例：Problem → Concept → Design → Interaction → Implementation](case-study.md)。

## Run Locally

```sh
node server.mjs
```

打开 [localhost:4173](http://localhost:4173)。运行网站无需安装 npm 依赖。

[开发与测试说明](docs/development.md) · [浏览器测试记录](screenshots/test-report.json)

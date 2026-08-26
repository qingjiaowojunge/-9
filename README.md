# 我的世界 · Web版

纯前端实现的开源体素生存游戏，支持电脑键鼠与手机触屏，可打包为 Android APK。

## 项目结构

```
-9/
├── web/                     # 游戏源文件（网页版 + APK 共用）
│   ├── index.html           # 游戏入口（离线，three.min.js 用本地引用）
│   └── game.js              # 游戏核心逻辑
├── app/                     # Android WebView 工程
│   └── src/main/            # MainActivity(WebView) + AndroidManifest + 资源
├── docs/                    # GitHub Pages：APK 下载页 + 在线游玩预览
└── .github/workflows/       # 自动编译 APK、发布 Release、部署 Pages
```

## 下载与安装

GitHub Actions 每次推送到 `main` 会自动构建 APK 并发布 Release。

- **APK 下载（令牌地址）**：
  `https://github.com/qingjiaowojunge/-9/releases/latest/download/MinecraftWeb.apk`
- **下载页**：`https://qingjiaowojunge.github.io/-9/`
- **网页在线游玩**：`https://qingjiaowojunge.github.io/-9/game/`

安装步骤：下载 APK → 文件管理器找到 → 允许未知来源 → 点击安装。

## 游戏特色

- 无限随机世界，自动生成与加载
- 挖矿合成（镐、剑、弓箭、熔炉、合成台、附魔）
- 怪物战斗（僵尸、骷髅、苦力怕）与下界探险
- 全平台自动适配（键鼠 / 触屏）
# App 端制作完整教程

> 技术选型对比 + 分步实施指南  
> 更新时间：2026-06-25

---

## 目录

1. [三种方案对比](#一三种方案对比)
2. [方案一：PWA 渐进式应用（推荐，最快）](#二方案一pwa-渐进式应用)
3. [方案二：UniApp 跨平台（上架应用商店）](#三方案二uniapp-跨平台)
4. [方案三：Capacitor 混合应用](#四方案三capacitor-混合应用)
5. [总结建议](#五总结建议)

---

## 一、三种方案对比

| 维度 | PWA | UniApp | Capacitor |
|------|-----|--------|-----------|
| **开发周期** | 1-2 天 | 2-4 周（代码迁移） | 3-7 天 |
| **代码复用** | 100% | 60-80%（组件需改造） | 95% |
| **iOS/Android 安装** | 通过浏览器添加 | 可上架应用商店 | 可上架应用商店 |
| **离线能力** | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| **推送通知** | ✅ (Android) / 有限 (iOS) | ✅ UniPush | ✅ 原生推送 |
| **相机/GPS/蓝牙** | 有限支持 | ✅ 完整 | ✅ 完整 |
| **审核上架** | 无需审核 | 需应用商店审核 | 需应用商店审核 |
| **维护成本** | 低（一套代码） | 中（平台差异） | 低-中 |
| **适用场景** | 内部系统、校园应用 | 对外发布、多端统一 | 快速封装已有 Web 应用 |

---

## 二、方案一：PWA 渐进式应用

> 💡 **最适合本项目**：校园内部系统，用户通过浏览器安装到桌面即可，无需应用商店审核。

### 效果预览

```
用户访问网页 → 浏览器弹出"添加到主屏幕"提示
→ 点击添加 → 桌面出现 App 图标
→ 点击图标打开全屏应用（无浏览器地址栏）
→ 离线也能打开（缓存了页面和数据）
```

---

### 步骤 1：安装依赖

```bash
cd d:/BISHE/campus-club
npm install vite-plugin-pwa -D
```

### 步骤 2：准备 App 图标

在 `public/` 目录下放置以下图标文件：

```
public/
├── icon-192x192.png    # 192×192 像素
├── icon-512x512.png    # 512×512 像素
├── icon-maskable.png   # 可遮罩图标 (自适应形状)
└── vite.svg            # 已有
```

> 📐 你可以用 [realfavicongenerator.net](https://realfavicongenerator.net) 一键生成所有尺寸。

快捷方式（用现有 vite.svg 临时替代）：后续替换为正式图标。

### 步骤 3：配置 vite.config.js

修改 [vite.config.js](vite.config.js)，完整内容如下：

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',       // 自动更新 Service Worker
      includeAssets: ['vite.svg'],      // 需要缓存的额外资源
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,woff2}'],  // 缓存所有静态资源
        runtimeCaching: [
          {
            // 缓存 API 请求（可选：离线时显示缓存数据）
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkFirst',     // 网络优先，失败时返回缓存
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24  // 24小时
              }
            }
          },
          {
            // 缓存上传文件
            urlPattern: /^\/uploads\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'uploads-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          }
        ]
      },
      manifest: {
        name: '校园社团成果展示与孵化系统',
        short_name: '社团成果',
        description: '校园社团成果展示、孵化、评审一体化平台',
        theme_color: '#1a2642',           // 与侧边栏颜色一致
        background_color: '#f0f2f5',
        display: 'standalone',            // 全屏模式（无浏览器地址栏）
        orientation: 'portrait',          // 竖屏
        scope: '/',
        start_url: '/login/student',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'           // 自适应图标
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true }
    }
  }
})
```

### 步骤 4：改造 index.html

修改 [index.html](index.html)：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <!-- PWA 相关 meta -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="社团成果" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#1a2642" />
    <!-- Apple 触摸图标 -->
    <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <title>校园社团成果展示与孵化系统</title>
  </head>
  <body>
    <div id="app"></div>
    <!-- PWA 注册 -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').then(reg => {
            console.log('✅ PWA Service Worker 已注册', reg.scope)
          }).catch(err => {
            console.warn('⚠ Service Worker 注册失败:', err)
          })
        })
      }
    </script>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

### 步骤 5：处理移动端响应式布局

当前项目侧边栏在移动端会占用空间。在 `global.css` 末尾追加移动端适配样式：

```css
/* ========== 移动端适配 ========== */
@media (max-width: 768px) {
  /* 管理员首页统计卡片 */
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm);
  }

  .stat-card {
    padding: var(--spacing-md);
  }

  .stat-card__value {
    font-size: 22px;
  }

  /* 表格横向滚动 */
  .el-table {
    font-size: 13px;
  }

  /* 搜索框占满宽度 */
  .search-input {
    max-width: 100% !important;
  }

  /* 弹窗全屏 */
  .el-dialog {
    width: 95% !important;
    margin-top: 10px !important;
  }

  /* 页面内边距减小 */
  .manage-content,
  .admin-content {
    padding: var(--spacing-md) !important;
  }

  /* 页面标题 */
  .page-header {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: flex-start;
  }
}
```

### 步骤 6：构建并测试

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
# 访问 http://localhost:4173 进行测试
```

### 步骤 7：真机测试

1. 将项目部署到服务器（参考 [DEPLOY.md](DEPLOY.md)）
2. 用手机浏览器（Chrome/Safari）访问部署地址
3. **Chrome**：会自动弹出"添加到主屏幕"提示；或点菜单 → "添加到主屏幕"
4. **Safari**：点击底部分享按钮 → "添加到主屏幕"
5. 桌面出现 App 图标，点击即可全屏使用

> 📱 **Android 效果最好**：PWA 在 Chrome 上支持最完整（推送通知、后台同步、离线缓存）  
> 🍎 **iOS**：iOS 16.4+ 开始支持推送通知，但离线缓存有限制（最多约50MB）

---

## 三、方案二：UniApp 跨平台

> 适合需要上架应用商店、或需要调用原生能力的场景。

### 技术架构

```
原有项目 (Vue3 + Element Plus + Express)
           ↓ 代码迁移
UniApp 项目 (Vue3 + uView/Vant UI)
           ↓ 编译
   ┌───────┼───────┬────────┐
  iOS    Android   微信小程序   H5
```

### 实施步骤概要

#### 1. 安装 HBuilderX

下载 [HBuilderX](https://www.dcloud.io/hbuilderx.html)（DCloud 官方 IDE）

#### 2. 创建 UniApp 项目

```
HBuilderX → 文件 → 新建 → 项目 → uni-app
模板选择：Vue 3 + 默认模板
```

#### 3. 迁移代码

| 原项目 | UniApp 对应 |
|--------|-------------|
| `vue-router` | uni-app 内置 `pages.json` 路由 |
| `element-plus` | 替换为 `uView UI` 或 `uni-ui` |
| `axios` + `request.js` | 继续用 axios，配置 `baseURL` 指向部署的后端 |
| `PageLayout.vue` | 改为 `uni-list` + 底部 tabBar |
| `localStorage` | `uni.setStorageSync()` |
| 文件上传 | `uni.uploadFile()` |

#### 4. 配置路由 (pages.json)

```json
{
  "pages": [
    { "path": "pages/login/login", "style": { "navigationBarTitleText": "登录" } },
    { "path": "pages/home/home", "style": { "navigationBarTitleText": "首页" } },
    { "path": "pages/result-market/result-market", "style": { "navigationBarTitleText": "成果市场" } }
  ],
  "tabBar": {
    "list": [
      { "text": "首页", "pagePath": "pages/home/home", "iconPath": "static/home.png" },
      { "text": "成果市场", "pagePath": "pages/result-market/result-market", "iconPath": "static/shop.png" },
      { "text": "上传", "pagePath": "pages/upload/upload", "iconPath": "static/upload.png" },
      { "text": "我的", "pagePath": "pages/mine/mine", "iconPath": "static/mine.png" }
    ]
  }
}
```

#### 5. 云打包发布

- **Android**：HBuilderX → 发行 → 原生App-云打包（需要 DCloud 开发者账号）
- **iOS**：需要 Apple Developer 账号（$99/年）+ 证书配置
- **微信小程序**：HBuilderX → 发行 → 小程序-微信

### 工作量和周期

| 阶段 | 预估时间 |
|------|----------|
| 项目初始化 + 路由配置 | 1 天 |
| 登录/注册页面迁移 | 1 天 |
| 学生端 9 个页面迁移 | 3-4 天 |
| 教师端 5 个页面迁移 | 2 天 |
| 管理员端 9 个页面迁移 | 3-4 天 |
| 文件上传改造 | 1 天 |
| 联调测试 | 2 天 |
| **合计** | **13-16 天** |

---

## 四、方案三：Capacitor 混合应用

> 将现有 Web 应用直接包入原生壳，改动最少。

### 操作步骤

```bash
# 1. 安装 Capacitor
cd d:/BISHE/campus-club
npm install @capacitor/core @capacitor/cli
npx cap init "社团成果" "com.campus.club"

# 2. 构建前端
npm run build

# 3. 添加平台
npm install @capacitor/android @capacitor/ios
npx cap add android    # 添加 Android 平台
npx cap add ios        # 添加 iOS 平台（需 Mac）

# 4. 同步前端到原生项目
npx cap sync

# 5. 打开原生项目
npx cap open android   # Android Studio
npx cap open ios       # Xcode（仅 Mac）

# 6. 在 IDE 中打包/签名/发布
```

### 优缺点

- ✅ 改动极小，几乎零代码迁移
- ✅ 可以调用原生 API（相机、GPS 等）
- ❌ 性能不如 PWA（本质是 WebView 壳）
- ❌ iOS 上架可能被拒（纯 WebView 应用）
- ❌ 需要 Android Studio / Xcode 开发环境

---

## 五、总结建议

```
┌──────────────────────────────────────────────────┐
│                    推荐路线                         │
│                                                    │
│  第一步: PWA  ← 现在就能做，1-2天完成               │
│     ↓                                              │
│   效果好、能用 → 先用人反馈，再决定是否继续投入        │
│     ↓                                              │
│  第二步: UniApp ← 如果需要应用商店分发                │
│     ↓                                              │
│   覆盖 iOS + Android + 微信小程序                    │
│                                                    │
└──────────────────────────────────────────────────┘
```

| 如果你的需求是... | 选择 |
|-------------------|------|
| 校园内部使用，能快点用上 | **PWA** |
| 需要上架应用商店，对外发布 | **UniApp** |
| 已有 App 壳，想快速封装 | **Capacitor** |
| 预算充足，从零打造原生体验 | Flutter / React Native 重写 |

---

> 📁 相关文件：[vite.config.js](vite.config.js) · [index.html](index.html) · [DEPLOY.md](DEPLOY.md)

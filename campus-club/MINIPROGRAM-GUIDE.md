# 小程序端制作完整教程

> 模拟微信小程序开发 — 从零到上线  
> 更新时间：2026-06-25

---

## 目录

1. [小程序 vs App vs Web](#一小程序-vs-app-vs-web)
2. [技术选型](#二技术选型)
3. [方案一：UniApp 编译小程序（推荐，Vue 开发者最快上手）](#三方案一uniapp-编译小程序)
4. [方案二：原生微信小程序](#四方案二原生微信小程序)
5. [方案三：Taro + Vue 3](#五方案三taro--vue-3)
6. [页面设计规划](#六页面设计规划)
7. [后端 API 适配](#七后端-api-适配)
8. [真机调试与发布](#八真机调试与发布)

---

## 一、小程序 vs App vs Web

| 维度 | 微信小程序 | App (PWA/原生) | Web |
|------|-----------|----------------|-----|
| **用户入口** | 微信内扫一扫/搜索 | 桌面图标 | 浏览器地址栏 |
| **安装** | 免安装，用完即走 | 需下载安装 | 无需安装 |
| **离线** | 有缓存限制 | 支持 | 取决于实现 |
| **分享** | 微信生态一键分享 | 较复杂 | 复制链接 |
| **支付** | 微信支付无缝 | 支付宝/微信 SDK | 跳转支付 |
| **审核** | 必须审核 | App 需审核 | 无需审核 |
| **包大小** | 单个包 ≤ 2MB，总 ≤ 20MB | 无严格限制 | 无限制 |
| **适合场景** | C 端用户、传播裂变 | 深度使用 | 管理后台 |

---

## 二、技术选型

```
现有项目：Vue 3 + Element Plus + Express
                ↓
      ┌─────────┼─────────┐
      ↓         ↓          ↓
   UniApp     Taro       原生开发
 (Vue语法)  (Vue/React)  (WXML/WXSS)
      ↓         ↓          ↓
  微信小程序  微信小程序   微信小程序
  支付宝小程序  多端统一   仅微信
  ...
```

| 方案 | 学习成本 | 代码复用 | 多端支持 |
|------|----------|----------|----------|
| **UniApp** | 低（Vue 3 语法） | 60-70% | 微信/支付宝/百度/字节/QQ |
| **Taro** | 中 | 50-60% | 微信/支付宝/百度/字节/QQ/京东 |
| **原生开发** | 高（全新语法） | 20-30% | 仅微信 |

> 🏆 **推荐 UniApp**：与现有 Vue 3 项目兼容最好，能复用大量业务逻辑。

---

## 三、方案一：UniApp 编译小程序

### 3.1 环境安装

```bash
# 1. 下载 HBuilderX（DCloud 官方 IDE）
# https://www.dcloud.io/hbuilderx.html
# 下载 "App开发版"（支持小程序编译）

# 2. 安装微信开发者工具
# https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

# 3. CLI 方式（可选，VSCode 用户偏好）
npm install -g @dcloudio/uvm
```

### 3.2 创建 UniApp 项目

用 HBuilderX：

```
文件 → 新建 → 项目 → uni-app
├── 模板：默认模板（Vue 3）
├── 项目名称：campus-club-miniapp
└── 启用 Vuex：不勾选（用 Pinia 或 reactive）
```

用 CLI：

```bash
npx degit dcloudio/uni-preset-vue#vite-ts campus-club-miniapp
cd campus-club-miniapp
npm install
```

### 3.3 项目结构

```
campus-club-miniapp/
├── pages/                     # 页面目录
│   ├── index/                 # 首页
│   │   └── index.vue
│   ├── login/                 # 登录
│   │   └── login.vue
│   ├── result-market/         # 成果市场
│   │   └── result-market.vue
│   ├── result-upload/         # 成果上传
│   │   └── result-upload.vue
│   ├── my-incubate/           # 我的孵化
│   │   └── my-incubate.vue
│   ├── my-result/             # 我的成果
│   │   └── my-result.vue
│   ├── resource-matching/     # 资源对接
│   │   └── resource-matching.vue
│   └── mine/                  # 个人中心
│       └── mine.vue
├── static/                    # 静态资源
│   └── tabbar-icons/          # 底部导航图标
├── api/                       # API 封装（从原项目迁移）
│   └── request.js
├── store/                     # 状态管理
├── pages.json                 # ⭐ 路由+导航+窗口配置（核心文件）
├── manifest.json              # 应用配置
├── App.vue                    # 应用入口
└── main.js                    # 主入口
```

### 3.4 核心配置：pages.json

这是 UniApp 项目的灵魂文件，替代了 vue-router：

```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^u-(.*)": "uview-plus/components/u-$1/u-$1.vue"
    }
  },
  "pages": [
    {
      "path": "pages/login/login",
      "style": {
        "navigationBarTitleText": "登录",
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "社团成果",
        "navigationBarBackgroundColor": "#1a2642",
        "navigationBarTextStyle": "white"
      }
    },
    {
      "path": "pages/result-market/result-market",
      "style": { "navigationBarTitleText": "成果市场" }
    },
    {
      "path": "pages/result-upload/result-upload",
      "style": { "navigationBarTitleText": "成果上传" }
    },
    {
      "path": "pages/result-detail/result-detail",
      "style": { "navigationBarTitleText": "成果详情" }
    },
    {
      "path": "pages/my-incubate/my-incubate",
      "style": { "navigationBarTitleText": "我的孵化" }
    },
    {
      "path": "pages/my-result/my-result",
      "style": { "navigationBarTitleText": "我的成果" }
    },
    {
      "path": "pages/resource-matching/resource-matching",
      "style": { "navigationBarTitleText": "资源对接" }
    },
    {
      "path": "pages/mine/mine",
      "style": { "navigationBarTitleText": "个人中心" }
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "社团成果",
    "navigationBarBackgroundColor": "#FFFFFF",
    "backgroundColor": "#f5f5f5"
  },
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#2B5AED",
    "borderStyle": "black",
    "backgroundColor": "#ffffff",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "static/tabbar/home.png",
        "selectedIconPath": "static/tabbar/home-active.png"
      },
      {
        "pagePath": "pages/result-market/result-market",
        "text": "成果市场",
        "iconPath": "static/tabbar/shop.png",
        "selectedIconPath": "static/tabbar/shop-active.png"
      },
      {
        "pagePath": "pages/result-upload/result-upload",
        "text": "上传",
        "iconPath": "static/tabbar/upload.png",
        "selectedIconPath": "static/tabbar/upload-active.png"
      },
      {
        "pagePath": "pages/mine/mine",
        "text": "我的",
        "iconPath": "static/tabbar/mine.png",
        "selectedIconPath": "static/tabbar/mine-active.png"
      }
    ]
  }
}
```

### 3.5 API 封装迁移

将原项目 [src/utils/request.js](src/utils/request.js) 迁移改造：

```js
// api/request.js
const BASE_URL = 'https://your-server.com'  // ⚠️ 替换为你的服务器地址

const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          resolve(res.data)
        } else {
          uni.showToast({ title: res.data.msg || '请求失败', icon: 'none' })
          reject(res.data)
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络请求失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

// 快捷方法
request.get = (url, params) => request({ url, method: 'GET', data: params })
request.post = (url, data) => request({ url, method: 'POST', data })
request.put = (url, data) => request({ url, method: 'PUT', data })
request.delete = (url) => request({ url, method: 'DELETE' })

export default request
```

### 3.6 登录页面迁移示例

将 `Login.vue` 改造为小程序的 `pages/login/login.vue`：

```vue
<template>
  <view class="login-page">
    <!-- Logo -->
    <view class="logo-section">
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <text class="title">校园社团成果展示与孵化</text>
    </view>

    <!-- 角色切换 -->
    <view class="role-tabs">
      <view
        v-for="role in roles"
        :key="role.value"
        :class="['role-tab', { active: currentRole === role.value }]"
        @click="currentRole = role.value"
      >
        <text>{{ role.label }}</text>
      </view>
    </view>

    <!-- 登录表单 -->
    <view class="form-section">
      <u-input
        v-model="username"
        placeholder="请输入用户名"
        prefixIcon="account"
        border="surround"
      />
      <u-input
        v-model="password"
        type="password"
        placeholder="请输入密码"
        prefixIcon="lock"
        border="surround"
      />
      <u-button type="primary" shape="circle" :loading="loading" @click="login">
        登 录
      </u-button>
    </view>

    <!-- 注册入口 -->
    <view class="register-link" @click="goRegister">
      <text>没有账号？点击注册</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import request from '@/api/request'

const username = ref('')
const password = ref('')
const loading = ref(false)
const currentRole = ref('student')

const roles = [
  { label: '学生', value: 'student' },
  { label: '教师', value: 'teacher' },
  { label: '专家', value: 'expert' }
]

const login = async () => {
  if (!username.value || !password.value) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
    return
  }
  loading.value = true
  try {
    const res = await request.post('/api/auth/login/' + currentRole.value, {
      username: username.value,
      password: password.value
    })
    uni.setStorageSync('token', res.data.token)
    uni.setStorageSync('userType', currentRole.value)
    uni.setStorageSync('username', username.value)
    uni.reLaunch({ url: '/pages/index/index' })
  } catch (e) {
    // 错误已在 request 中处理
  } finally {
    loading.value = false
  }
}

const goRegister = () => {
  uni.navigateTo({ url: '/pages/register/register?type=' + currentRole.value })
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a2642 0%, #2a3f6e 100%);
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}
.logo { width: 120rpx; height: 120rpx; }
.title { color: #fff; font-size: 36rpx; margin-top: 20rpx; }
.role-tabs {
  display: flex;
  background: rgba(255,255,255,0.15);
  border-radius: 50rpx;
  padding: 6rpx;
  margin-bottom: 50rpx;
}
.role-tab {
  padding: 16rpx 40rpx;
  border-radius: 50rpx;
  color: rgba(255,255,255,0.7);
  font-size: 28rpx;
  transition: all 0.3s;
}
.role-tab.active {
  background: #fff;
  color: #1a2642;
  font-weight: 600;
}
.form-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 40rpx;
}
.register-link { color: rgba(255,255,255,0.7); font-size: 28rpx; }
</style>
```

### 3.7 成果市场列表页示例

```vue
<template>
  <view class="page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <u-search v-model="keyword" placeholder="搜索成果" @search="onSearch" />
    </view>

    <!-- 成果列表 -->
    <view class="result-list">
      <view
        v-for="item in list"
        :key="item.id"
        class="result-card"
        @click="goDetail(item.id)"
      >
        <image
          :src="item.cover || '/static/default-cover.png'"
          class="result-cover"
          mode="aspectFill"
        />
        <view class="result-info">
          <text class="result-title">{{ item.title }}</text>
          <text class="result-desc">{{ item.description }}</text>
          <view class="result-meta">
            <text class="result-author">{{ item.studentName }}</text>
            <text class="result-college">{{ item.college }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 上拉加载更多 -->
    <u-loadmore :status="loadStatus" @click="loadMore" />
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'

const keyword = ref('')
const list = ref([])
const page = ref(1)
const loadStatus = ref('loadmore')

const fetchList = async (isRefresh = false) => {
  if (isRefresh) { page.value = 1; list.value = [] }
  try {
    const res = await request.post('/api/result/list', {
      page: page.value,
      pageSize: 10,
      keyword: keyword.value
    })
    list.value = isRefresh
      ? res.data
      : [...list.value, ...res.data]
    loadStatus.value = res.data.length < 10 ? 'nomore' : 'loadmore'
  } catch { /* handled */ }
}

const onSearch = () => { fetchList(true) }
const loadMore = () => { page.value++; fetchList() }
const goDetail = (id) => { uni.navigateTo({ url: `/pages/result-detail/result-detail?id=${id}` }) }

onMounted(() => { fetchList(true) })
</script>
```

### 3.8 编译到微信小程序

```bash
# HBuilderX 方式：
# 运行 → 运行到小程序模拟器 → 微信开发者工具

# CLI 方式：
npm run dev:mp-weixin
# 然后在微信开发者工具中打开 dist/dev/mp-weixin/
```

---

## 四、方案二：原生微信小程序

### 4.1 技术特点

| 特性 | 说明 |
|------|------|
| **语言** | WXML（模板）+ WXSS（样式）+ JS/TS（逻辑） |
| **组件** | WeUI 或 Vant Weapp |
| **API** | `wx.request`、`wx.login`、`wx.uploadFile` 等 |
| **路由** | `app.json` 中配置，API 用 `wx.navigateTo` |

### 4.2 核心文件结构

```
miniapp-native/
├── app.js              # 小程序入口（获取用户信息、全局数据）
├── app.json            # 全局配置（路由、窗口、tabBar）
├── app.wxss            # 全局样式
├── pages/
│   ├── index/          # index.js / index.wxml / index.wxss / index.json
│   ├── login/
│   ├── result-market/
│   ├── result-upload/
│   └── mine/
├── utils/
│   └── request.js      # 封装 wx.request
├── components/         # 自定义组件
└── images/
```

### 4.3 app.json 配置

```json
{
  "pages": [
    "pages/index/index",
    "pages/login/login",
    "pages/result-market/result-market",
    "pages/result-detail/result-detail",
    "pages/result-upload/result-upload",
    "pages/my-incubate/my-incubate",
    "pages/my-result/my-result",
    "pages/resource-matching/resource-matching",
    "pages/mine/mine"
  ],
  "window": {
    "navigationBarBackgroundColor": "#1a2642",
    "navigationBarTitleText": "社团成果",
    "navigationBarTextStyle": "white",
    "backgroundColor": "#f5f5f5"
  },
  "tabBar": {
    "color": "#999",
    "selectedColor": "#2B5AED",
    "list": [
      { "pagePath": "pages/index/index", "text": "首页", "iconPath": "images/home.png", "selectedIconPath": "images/home-active.png" },
      { "pagePath": "pages/result-market/result-market", "text": "成果", "iconPath": "images/shop.png", "selectedIconPath": "images/shop-active.png" },
      { "pagePath": "pages/result-upload/result-upload", "text": "上传", "iconPath": "images/upload.png", "selectedIconPath": "images/upload-active.png" },
      { "pagePath": "pages/mine/mine", "text": "我的", "iconPath": "images/mine.png", "selectedIconPath": "images/mine-active.png" }
    ]
  },
  "permission": {
    "scope.userLocation": { "desc": "你的位置信息将用于资源匹配" }
  }
}
```

### 4.4 网络请求封装

```js
// utils/request.js
const BASE_URL = 'https://your-server.com/api'

const request = (url, options = {}) => {
  const token = wx.getStorageSync('token')

  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : ''
      },
      success(res) {
        if (res.statusCode === 200 && res.data.code === 200) {
          resolve(res.data)
        } else {
          wx.showToast({ title: res.data.msg || '请求失败', icon: 'none' })
          reject(res.data)
        }
      },
      fail(err) {
        wx.showToast({ title: '网络异常', icon: 'none' })
        reject(err)
      }
    })
  })
}

module.exports = { request }
```

### 4.5 登录页 WXML 示例

```xml
<!-- pages/login/login.wxml -->
<view class="login-page">
  <view class="logo-section">
    <image class="logo" src="/images/logo.png" mode="aspectFit"></image>
    <text class="title">校园社团成果展示与孵化</text>
  </view>

  <view class="role-tabs">
    <view
      wx:for="{{roles}}"
      wx:key="value"
      class="role-tab {{currentRole === item.value ? 'active' : ''}}"
      bindtap="switchRole"
      data-role="{{item.value}}"
    >{{item.label}}</view>
  </view>

  <view class="form-section">
    <input
      class="input"
      placeholder="请输入用户名"
      value="{{username}}"
      bindinput="onUsernameInput"
    />
    <input
      class="input"
      type="password"
      placeholder="请输入密码"
      value="{{password}}"
      bindinput="onPasswordInput"
    />
    <button class="login-btn" loading="{{loading}}" bindtap="login">
      登 录
    </button>
  </view>

  <view class="register-link" bindtap="goRegister">
    <text>没有账号？点击注册</text>
  </view>
</view>
```

---

## 五、方案三：Taro + Vue 3

> Taro 是京东出品的跨端框架，支持 Vue 3 + 小程序。

```bash
# 安装 Taro CLI
npm install -g @tarojs/cli

# 创建项目
taro init campus-club-taro
# 选择：Vue 3 模板 + Webpack 5

# 启动开发
npm run dev:weapp

# 在微信开发者工具中导入 dist/ 目录
```

Taro 语法与 UniApp 类似，主要区别是：
- 模板用 `<View>` `<Text>` `<Image>`（React 风格组件名）
- 路由用 `app.config.ts` 配置
- API 用 `Taro.request` / `Taro.navigateTo`

**选择建议**：Vue 开发者选 UniApp，React 开发者选 Taro。

---

## 六、页面设计规划

根据现有系统，小程序端仅保留**学生端核心功能**（教师和管理员不适合在小程序操作）：

```
底部导航（4个Tab）
├── 🏠 首页
│   ├── 轮播 banner（最近活动/公告）
│   ├── 快捷入口（成果市场、上传、资源对接）
│   └── 最新成果瀑布流
│
├── 🔍 成果市场
│   ├── 搜索栏
│   ├── 分类筛选（软件/论文/文创/发明...）
│   └── 成果卡片列表 → 点击进详情
│
├── 📤 上传
│   ├── 成果上传（选择文件 + 表单）
│   └── 获奖上传（照片 + 表单）
│
└── 👤 我的
    ├── 头像 + 姓名 + 学院
    ├── 我的成果
    ├── 我的孵化
    ├── 我的申请
    ├── 系统通知（红点提醒）
    └── 设置/退出
```

---

## 七、后端 API 适配

现有 Express 后端已经支持所有功能，小程序端直接调用即可。需要注意：

### 7.1 文件上传适配

```js
// 小程序端
uni.chooseImage({
  count: 1,
  success: (res) => {
    uni.uploadFile({
      url: BASE_URL + '/api/result/upload',
      filePath: res.tempFilePaths[0],
      name: 'achievementFiles',
      formData: {
        title: this.title,
        type: this.type,
        studentId: uni.getStorageSync('studentId')
      },
      header: {
        'Authorization': 'Bearer ' + uni.getStorageSync('token')
      }
    })
  }
})
```

### 7.2 小程序登录改造

利用微信 `wx.login()` 获取 code，后端对接微信接口换取 openid：

```js
// 小程序端
wx.login({
  success: (res) => {
    // 将 code 发给后端
    request.post('/api/auth/wechat-login', { code: res.code })
  }
})
```

```js
// server.js 新增：微信登录接口
app.post('/api/auth/wechat-login', async (req, res) => {
  const { code } = req.body
  // 调用微信接口换取 openid
  const wxRes = await fetch(
    `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`
  )
  const wxData = await wxRes.json()
  // 根据 openid 查找或创建用户...
})
```

### 7.3 CORS 配置

小程序请求不受跨域限制（微信服务器转发），但开发调试阶段需要配置：

```js
// server.js 已有 CORS 配置，确保允许小程序来源
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE')
  next()
})
```

---

## 八、真机调试与发布

### 8.1 真机调试

```
1. HBuilderX → 运行 → 运行到小程序模拟器 → 微信开发者工具
2. 微信开发者工具 → 扫码预览 → 手机微信扫码
3. 在手机上体验完整流程
```

### 8.2 发布流程

```
开发完成 → 微信开发者工具 → 上传代码

↓ 登录微信公众平台 mp.weixin.qq.com

开发管理 → 版本管理
├── 开发版本 → 提交审核
│     ↓
├── 审核版本（等待 1-7 天）
│     ↓
└── 线上版本（审核通过后发布）
```

### 8.3 审核注意事项

| 注意点 | 说明 |
|--------|------|
| **服务类目** | 选择"教育 > 学历教育"或"工具 > 信息查询" |
| **隐私接口** | 如果用到 `chooseImage`、`getLocation` 等，需要在 `app.json` 声明 |
| **用户协议** | 必须在首次打开时展示用户协议和隐私政策 |
| **测试账号** | 提交审核时提供测试账号（学生/教师） |
| **内容安全** | 如果允许用户上传内容，需接入微信内容安全 API |

---

## 总结建议

```
┌─────────────────────────────────────┐
│          推荐技术路线                 │
│                                     │
│  UniApp (Vue 3) ← 与现有技术栈一致    │
│       ↓                             │
│  编译微信小程序（主力平台）            │
│       ↓                             │
│  可选：支付宝/百度/字节小程序          │
│       ↓                             │
│  可选：编译为 iOS/Android App        │
│                                     │
└─────────────────────────────────────┘
```

| 你的情况 | 推荐 |
|----------|------|
| Vue 3 前端经验，想快速出小程序 | **UniApp** |
| 想学原生微信开发 | **原生 WXML + WXSS** |
| React 经验 | **Taro** |
| 只是前后端分离的管理后台 | 不需要小程序，PWA 即可 |

---

> 📁 相关文件：[APP-GUIDE.md](APP-GUIDE.md) · [DEPLOY.md](DEPLOY.md) · [server.js](server.js)

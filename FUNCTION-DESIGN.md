# 校园社团成果展示与孵化系统 — 功能设计文档

> 技术栈：Spring Boot + Vue 3 + MySQL + Redis + Elasticsearch + 腾讯云 OSS + Java Mail  
> 架构：前后端分离，纯浏览器访问

---

## 目录

1. [系统概述](#一系统概述)
2. [用户角色体系](#二用户角色体系)
3. [功能模块总览](#三功能模块总览)
4. [前端功能详解](#四前端功能详解)
5. [后端功能详解](#五后端功能详解)
6. [数据库设计](#六数据库设计)
7. [技术实现要点](#七技术实现要点)

---

## 一、系统概述

### 1.1 解决的核心痛点

```
问题：校园社团成果缺乏展示渠道 → 优秀成果难获孵化资源 → 人才与资源错配

方案：
  社团上传成果 → 平台展示 → 师生互动（浏览/点赞/评论）
  → 教师评分筛选 → 专家评审 → 对接孵化资源
  → 企业/学校基金投入 → 成果升级 → 推荐至比赛
```

### 1.2 业务闭环

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 成果上传  │ → │ 展示互动  │ → │ 评审孵化  │ → │ 资源对接  │
│ 社团提交  │    │ 师生浏览  │    │ 教师评分  │    │ 企业投资  │
│ 多格式文件 │    │ 点赞评论  │    │ 专家审核  │    │ 基金支持  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                ↓
                                          ┌──────────┐
                                          │ 比赛推荐  │
                                          │ 校级/市级 │
                                          └──────────┘
```

---

## 二、用户角色体系

| 角色 | 职责 | 权限范围 |
|------|------|----------|
| **学生/社团成员** | 上传成果、申请孵化、申请资源、查看进度 | 自己的数据 |
| **教师/社团指导老师** | 评分成果、审批孵化、发布通知、管理资源 | 本学院/全部 |
| **评审专家** | 评审成果、给出专业意见、多维打分 | 分配的评审任务 |
| **企业合作方** | 浏览收藏成果、投递资源、审批申请、签约合作 | 企业相关数据 |
| **系统管理员** | 管理所有用户、管理成果、系统配置、数据统计 | 全部数据 |

---

## 三、功能模块总览

```
校园社团成果展示与孵化系统
│
├── 01. 用户认证模块 (Auth)
│   ├── 注册（多角色：学生/教师/专家/企业/管理员）
│   ├── 登录（JWT 令牌认证）
│   ├── 密码找回（身份验证 → 重置密码）
│   └── 个人信息管理
│
├── 02. 成果管理模块 (Achievement)
│   ├── 成果上传（项目背景/实施过程/创新点/成果价值）
│   ├── 多文件上传（报告 PDF/演示视频/实物照片 → OSS）
│   ├── 成果列表（分类浏览、搜索筛选）
│   ├── 成果详情（完整展示 + 文件下载）
│   ├── 成果编辑/删除
│   └── 我的成果管理
│
├── 03. 成果展示与互动模块 (Social)
│   ├── 成果市场（首页推荐 + 热门榜单）
│   ├── 全文检索（Elasticsearch 按类型/领域/关键词检索）
│   ├── 点赞/收藏功能
│   ├── 评论互动（师生交流反馈）
│   ├── 浏览统计（Redis 计数 + 定时持久化）
│   └── 分类筛选（科技发明/文艺创作/公益项目/学术论文/创业实践）
│
├── 04. 评审孵化模块 (Incubation)
│   ├── 教师评分（多阶段：成果评分 + 孵化评分）
│   ├── 专家评审（多维打分：创新性25%/实用性25%/完成度20%/规范性15%/综合15%）
│   ├── 评审任务分配（自动推送 + 通知）
│   ├── 孵化状态跟踪（未孵化 → 孵化中 → 已完成 → 已拒绝）
│   ├── 孵化进度看板（进度百分比）
│   └── 评审历史查询
│
├── 05. 资源对接模块 (Resource)
│   ├── 资源发布（资金支持/设备支持/导师指导/场地提供/技术合作/实习机会）
│   ├── 资源浏览（分类筛选 + 搜索）
│   ├── 学生申请资源（需成果通过双审）
│   ├── 企业审批申请（批准/拒绝 + 理由）
│   ├── 申请状态跟踪
│   └── 资源效果评价（到期后评价使用效果）
│
├── 06. 校企合作模块 (Cooperation)
│   ├── 企业工作台（数据仪表盘）
│   ├── 成果浏览与收藏（人才储备库）
│   ├── 协议签署（线上合作协议）
│   ├── 资源投递管理
│   └── 合作效果评价
│
├── 07. 获奖管理模块 (Award)
│   ├── 获奖上传（获奖证书/证明材料）
│   ├── 获奖展示（按等级排序：国家级/省级/校级）
│   ├── 获奖统计
│   └── 比赛推荐（管理员推荐优质成果参赛）
│
├── 08. 通知模块 (Notification)
│   ├── 系统通知（公告发布）
│   ├── 业务通知（评审任务/申请结果/资源到期）
│   ├── 邮件通知（Java Mail 发送孵化资源对接通知）
│   ├── 消息已读/未读
│   └── 通知偏好设置
│
├── 09. 管理后台模块 (Admin)
│   ├── 用户管理（学生/教师/专家/企业 CRUD）
│   ├── 社团管理
│   ├── 成果管理（查看/删除/推荐）
│   ├── 资源管理、获奖管理
│   ├── 数据统计面板（ECharts 可视化）
│   ├── 系统设置（基本设置/文件设置/邮件设置）
│   └── 操作日志
│
└── 10. 数据统计与可视化模块 (Analytics)
    ├── 首页统计面板
    ├── 成果热榜（Redis 缓存热门成果）
    ├── 社团活跃度排名
    ├── 孵化成功率统计
    └── 资源对接转化率
```

---

## 四、前端功能详解

### 4.1 学生端（10 个页面）

| 页面 | 路径 | 功能描述 |
|------|------|----------|
| **首页** | `/student-home` | 欢迎横幅 + 统计卡片 + 热门成果推荐 + 快捷入口 |
| **成果市场** | `/result-market` | 搜索框 + 分类筛选 + 成果卡片流 + 点赞/详情 |
| **成果上传** | `/result-upload` | 项目背景/实施过程/创新点/成果价值表单 + 多文件上传 |
| **成果详情** | `/result-detail/:id` | 完整展示 + 文件预览/下载 + 评论区 |
| **我的成果** | `/my-result` | 个人成果列表 + 编辑/删除 |
| **我的孵化** | `/my-incubate` | 孵化状态卡片 + 进度条 + 评分查看 |
| **资源对接** | `/resource-matching` | 资源分类筛选 + 申请弹窗 + 双审资格提示 |
| **我的申请** | `/my-applications` | 申请列表 + 状态标签（待审/已通过/已拒绝） |
| **系统通知** | `/system-notify` | 通知列表 + 已读/未读 + 邮件通知 |
| **获奖上传** | `/award-upload` | 获奖信息表单 + 证书文件上传 |

### 4.2 教师端（6 个页面）

| 页面 | 功能描述 |
|------|----------|
| **教师首页** | 待评分数量 + 孵化统计 + 待审批数量 |
| **成果评分** | 成果列表 + 分数输入 + 评分标准参考 |
| **成果孵化** | 孵化项目管理 + 两阶段评分 + 推送专家评审 |
| **资源审批** | 资源列表 + 查看申请 + 批准/拒绝 |
| **通知管理** | 发布系统通知 + 查看已发布 |
| **获奖管理** | 查看学生获奖 + 推荐比赛 |

### 4.3 专家端（4 个页面）

| 页面 | 功能描述 |
|------|----------|
| **专家首页** | 待评审数量 + 评审统计 |
| **成果评审** | 评审任务列表 + 多维评分弹窗（创新性/实用性/完成度/规范性/综合） |
| **评审历史** | 已评审成果列表 + 详情查看 |
| **通知提醒** | 新评审任务通知 |

### 4.4 企业端（7 个页面）

| 页面 | 功能描述 |
|------|----------|
| **企业首页** | 投递资源数 + 收到申请数 + 签约协议数 + 收藏成果数 |
| **浏览成果** | 成果搜索 + 收藏 + 查看详情（含评分/评审意见） |
| **投递资源** | 发布资源 + 管理资源 + 查看申请数 |
| **审批申请** | 申请列表 + 批准/拒绝 + 查看学生成果背景 |
| **合作协议** | 签署协议 + 协议列表 + 关联资源 |
| **效果评价** | 到期资源评价 + 历史评价记录 |
| **企业信息** | 企业资料管理 + 通知设置 |

### 4.5 管理员端（10 个页面）

| 页面 | 功能描述 |
|------|----------|
| **管理员首页** | 系统统计仪表盘（用户数/成果数/资源数 + ECharts 图表） |
| **学生管理** | CRUD + 搜索 + 分页 |
| **教师管理** | CRUD + 搜索 + 分页 |
| **专家管理** | CRUD + 搜索 + 分页 |
| **企业管理** | CRUD + 审核企业注册 |
| **成果管理** | 查看/删除/推荐优质成果 |
| **通知管理** | 发布/编辑/删除系统通知 |
| **资源管理** | 查看/删除资源 |
| **获奖管理** | 查看/删除获奖 + 比赛推荐标记 |
| **系统设置** | 系统参数/文件上传配置/邮件配置 |

---

## 五、后端功能详解

### 5.1 Spring Boot 项目结构

```
src/main/java/com/campus/club/
│
├── config/
│   ├── SecurityConfig.java         安全配置（JWT 过滤器）
│   ├── CorsConfig.java             跨域配置
│   ├── RedisConfig.java            Redis 配置
│   ├── ElasticsearchConfig.java    ES 配置
│   ├── OssConfig.java              腾讯云 OSS 配置
│   └── MailConfig.java             Java Mail 配置
│
├── controller/
│   ├── AuthController.java         认证接口（登录/注册/密码重置）
│   ├── AchievementController.java  成果 CRUD + 搜索
│   ├── FileController.java         文件上传/下载（OSS）
│   ├── SocialController.java       点赞/评论/收藏
│   ├── IncubationController.java   孵化评审
│   ├── ResourceController.java     资源对接
│   ├── EnterpriseController.java   企业合作
│   ├── AwardController.java        获奖管理
│   ├── NotificationController.java 通知管理
│   ├── AdminController.java        管理后台
│   └── StatsController.java        数据统计
│
├── service/
│   ├── impl/                       各 Service 实现类
│   ├── AchievementService.java
│   ├── OssService.java             文件上传到 OSS
│   ├── MailService.java            邮件发送
│   ├── RedisService.java           缓存服务
│   ├── ElasticsearchService.java   搜索引擎服务
│   └── RecommendationService.java  热门推荐算法
│
├── entity/                          JPA 实体类
│   ├── User.java
│   ├── Achievement.java
│   ├── Comment.java
│   ├── Like.java
│   ├── Resource.java
│   ├── Application.java
│   ├── Award.java
│   ├── Notification.java
│   └── ...
│
├── repository/                      JPA Repository
│   └── ...
│
├── dto/                             数据传输对象
│   ├── LoginDTO.java
│   ├── AchievementDTO.java
│   └── ...
│
├── vo/                              视图对象（返回前端）
│   ├── ResultVO.java               统一响应格式 { code, msg, data }
│   └── PageVO.java                 分页响应
│
└── util/
    ├── JwtUtil.java                 JWT 工具类
    ├── OssUtil.java                 OSS 上传工具
    └── ElasticsearchUtil.java       ES 索引工具
```

### 5.2 核心 API 列表

#### 认证模块
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录（返回 JWT） |
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/verify-identity` | 身份验证（找回密码） |
| POST | `/api/auth/reset-password` | 重置密码 |
| GET | `/api/auth/profile` | 获取个人信息 |
| PUT | `/api/auth/profile` | 修改个人信息 |

#### 成果模块
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/achievements` | 上传成果（含 OSS 文件上传） |
| GET | `/api/achievements` | 成果列表（分页+筛选） |
| GET | `/api/achievements/:id` | 成果详情 |
| PUT | `/api/achievements/:id` | 编辑成果 |
| DELETE | `/api/achievements/:id` | 删除成果 |
| GET | `/api/achievements/my` | 我的成果 |
| GET | `/api/achievements/search` | ES 全文检索 |
| GET | `/api/achievements/hot` | 热门成果（Redis 缓存） |

#### 社交互动模块
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/achievements/:id/like` | 点赞/取消 |
| GET | `/api/achievements/:id/comments` | 评论列表 |
| POST | `/api/achievements/:id/comments` | 发表评论 |
| DELETE | `/api/comments/:id` | 删除评论 |

#### 孵化评审模块
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/incubation/score` | 教师评分 |
| POST | `/api/incubation/expert-review` | 专家评审 |
| GET | `/api/incubation/tasks` | 评审任务列表 |
| GET | `/api/incubation/:id` | 孵化详情 |

#### 资源对接模块
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/resources` | 资源列表 |
| POST | `/api/resources` | 发布资源（企业/教师） |
| POST | `/api/resources/:id/apply` | 申请资源（需双审检查） |
| PUT | `/api/applications/:id/approve` | 批准申请 |
| PUT | `/api/applications/:id/reject` | 拒绝申请 |
| GET | `/api/applications/my` | 我的申请 |

#### 通知模块
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/notifications` | 通知列表 |
| PUT | `/api/notifications/:id/read` | 标记已读 |
| POST | `/api/notifications` | 发送通知（管理员/系统） |

#### 管理后台模块
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/stats` | 系统统计数据 |
| GET/POST/PUT/DELETE | `/api/admin/users` | 用户管理 |
| GET/POST/PUT/DELETE | `/api/admin/achievements` | 成果管理 |
| PUT | `/api/admin/achievements/:id/recommend` | 推荐至比赛 |
| GET/POST/PUT/DELETE | `/api/admin/notices` | 通知管理 |
| GET/PUT | `/api/admin/settings` | 系统设置 |

#### 数据统计模块
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats/overview` | 系统总览统计 |
| GET | `/api/stats/achievements` | 成果统计（按类型、学院） |
| GET | `/api/stats/incubation` | 孵化转化率 |
| GET | `/api/stats/resources` | 资源对接统计 |

---

## 六、数据库设计

### 6.1 核心表结构

```sql
-- 用户表（统一用户认证）
user (
  id BIGINT PK,
  username VARCHAR(50) UNIQUE,
  password VARCHAR(255),
  role ENUM('student','teacher','admin','expert','enterprise'),
  real_name VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(100),
  avatar VARCHAR(500),          -- OSS URL
  status TINYINT DEFAULT 1,
  create_time DATETIME,
  update_time DATETIME
)

-- 学生扩展信息
student_profile (
  id BIGINT PK FK→user.id,
  student_no VARCHAR(50),
  college VARCHAR(100),
  major VARCHAR(100),
  grade VARCHAR(20)
)

-- 社团表
club (
  id BIGINT PK,
  name VARCHAR(255),
  type VARCHAR(100),            -- 科技/文艺/公益/体育/学术
  description TEXT,
  advisor_id BIGINT,            -- 指导老师
  member_count INT DEFAULT 0,
  create_time DATETIME
)

-- 成果表
achievement (
  id BIGINT PK,
  title VARCHAR(255),
  type VARCHAR(100),            -- 科技发明/文艺创作/公益项目/学术论文/创业实践/竞赛获奖/调查报告
  description TEXT,
  background TEXT,              -- 项目背景
  process TEXT,                 -- 实施过程
  innovation TEXT,              -- 创新点
  value TEXT,                   -- 成果价值
  cover VARCHAR(500),           -- 封面图 OSS URL
  student_id BIGINT FK,
  club_id BIGINT FK,
  college VARCHAR(100),
  score DECIMAL(3,1),           -- 教师第一阶段评分
  incubation_score DECIMAL(3,1),-- 教师第二阶段评分
  review_status TINYINT DEFAULT 0, -- 0=待审 1=待专家 2=通过 3=拒绝
  expert_score DECIMAL(3,1),    -- 专家评分
  expert_review TINYINT DEFAULT 0, -- 是否推送专家
  view_count INT DEFAULT 0,     -- 浏览数
  like_count INT DEFAULT 0,     -- 点赞数
  comment_count INT DEFAULT 0,  -- 评论数
  is_recommended TINYINT DEFAULT 0, -- 推荐至比赛
  create_time DATETIME,
  update_time DATETIME
)

-- 成果文件（OSS 存储）
achievement_file (
  id BIGINT PK,
  achievement_id BIGINT FK,
  file_name VARCHAR(255),
  file_path VARCHAR(500),       -- OSS 完整 URL
  file_size BIGINT,
  file_type VARCHAR(100),       -- pdf/mp4/jpg/png/docx
  file_category VARCHAR(50),    -- report/video/image/attachment
  create_time DATETIME
)

-- 评论表
comment (
  id BIGINT PK,
  achievement_id BIGINT FK,
  user_id BIGINT FK,
  content TEXT,
  parent_id BIGINT DEFAULT 0,   -- 父评论ID（支持回复）
  create_time DATETIME
)

-- 点赞表
likes (
  id BIGINT PK,
  achievement_id BIGINT FK,
  user_id BIGINT FK,
  create_time DATETIME,
  UNIQUE(achievement_id, user_id)
)

-- 孵化评审表
expert_review (
  id BIGINT PK,
  expert_id BIGINT FK,
  achievement_id BIGINT FK,
  score DECIMAL(3,1),
  comment TEXT,
  conclusion VARCHAR(50),        -- excellent/good/pass/fail
  dimension_scores TEXT,         -- JSON: {"创新性":90,"实用性":85,...}
  review_type VARCHAR(50),
  create_time DATETIME
)

-- 资源表
resource (
  id BIGINT PK,
  title VARCHAR(255),
  type VARCHAR(100),            -- 资金/设备/导师/场地/技术/实习
  description TEXT,
  provider VARCHAR(255),
  price DECIMAL(10,2) DEFAULT 0,
  enterprise_id BIGINT,         -- 发布企业
  publish_time DATETIME,
  end_time DATETIME,
  status VARCHAR(50),           -- 进行中/已到期
  view_count INT DEFAULT 0,
  apply_count INT DEFAULT 0,
  create_time DATETIME
)

-- 资源申请表
resource_application (
  id BIGINT PK,
  resource_id BIGINT FK,
  student_id BIGINT FK,
  student_name VARCHAR(100),
  student_college VARCHAR(100),
  status VARCHAR(50) DEFAULT '待审核',  -- 待审核/已通过/已拒绝/已取消
  reason TEXT,
  application_time DATETIME,
  approve_time DATETIME,
  approver_id BIGINT
)

-- 获奖表
award (
  id BIGINT PK,
  title VARCHAR(255),
  level VARCHAR(50),            -- 国家级/省级/校级
  award_time DATE,
  description TEXT,
  student_id BIGINT FK,
  college VARCHAR(100),
  is_recommended TINYINT DEFAULT 0,
  create_time DATETIME
)

-- 获奖文件表
award_file (
  id BIGINT PK,
  award_id BIGINT FK,
  file_name VARCHAR(255),
  file_path VARCHAR(500),       -- OSS URL
  create_time DATETIME
)

-- 通知表
notification (
  id BIGINT PK,
  user_id BIGINT,               -- 接收人（NULL=全局通知）
  title VARCHAR(255),
  content TEXT,
  type VARCHAR(50),             -- system/review/resource/notice
  related_id BIGINT,            -- 关联业务ID
  is_read TINYINT DEFAULT 0,
  is_email_sent TINYINT DEFAULT 0,
  create_time DATETIME
)

-- 企业协议表
enterprise_agreement (
  id BIGINT PK,
  enterprise_id BIGINT FK,
  achievement_id BIGINT FK,
  title VARCHAR(255),
  content TEXT,
  sign_date DATE,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50),
  create_time DATETIME
)
```

### 6.2 Redis 缓存设计

| Key | 类型 | 说明 | 过期 |
|-----|------|------|------|
| `hot:achievements` | ZSET | 热门成果排行（按浏览/点赞加权） | 1h |
| `achievement:view:{id}` | STRING | 成果浏览量（定时同步到 DB） | 1h |
| `achievement:like:{id}` | STRING | 点赞数缓存 | 10min |
| `user:token:{userId}` | STRING | JWT 令牌存储 | 24h |
| `search:hot:keywords` | LIST | 热门搜索词 | 1d |

### 6.3 Elasticsearch 索引设计

```json
{
  "index": "achievements",
  "mappings": {
    "properties": {
      "id": { "type": "long" },
      "title": { "type": "text", "analyzer": "ik_max_word" },
      "type": { "type": "keyword" },
      "description": { "type": "text", "analyzer": "ik_smart" },
      "college": { "type": "keyword" },
      "club_name": { "type": "keyword" },
      "club_type": { "type": "keyword" },
      "score": { "type": "float" },
      "create_time": { "type": "date" }
    }
  }
}
```

**检索示例：** "科技类社团 机器人项目" → 分词后匹配 `club_type:科技` + `title/description:机器人`

---

## 七、技术实现要点

### 7.1 Spring Boot 与 Vue 3 前后端分离架构

```
浏览器 (Vue 3 + Vite)
  │
  ├── /api/* → Nginx 反向代理 → Spring Boot (localhost:8080)
  │
  └── 静态文件 → Nginx 直接托管 dist/
```

### 7.2 Redis 缓存策略

```
读多写少的场景用 Redis：
  1. 热门成果榜 → ZSET 存储，定时从 DB 同步
  2. 成果详情页 → 先查 Redis，未命中查 DB 再回填
  3. 用户点赞状态 → SET 存储用户已点赞的成果ID列表

避免缓存雪崩：
  - 热点数据设置随机过期时间（1h ± 10min）
  - 使用互斥锁防止缓存击穿
```

### 7.3 Elasticsearch 同步策略

```
数据变更时异步同步：
  MySQL 新增/更新成果 → 发消息 → ES 索引更新（异步）

搜索流程：
  用户输入关键词 → ES 查询（ik 分词+权重打分） → 返回成果ID列表 
  → 从 Redis/MySQL 加载完整数据 → 返回前端
```

### 7.4 腾讯云 OSS 文件上传

```
前端 → 后端获取临时签名 → 前端直传 OSS（减少服务器带宽压力）
  ↓
OSS 回调通知后端 → 后端记录文件信息到 achievement_file 表

文件分类存储路径：
  /reports/{year}/{month}/{uuid}.pdf      报告文档
  /videos/{year}/{month}/{uuid}.mp4       演示视频
  /images/{year}/{month}/{uuid}.jpg       实物照片
```

### 7.5 Java Mail 邮件通知

```
触发场景：
  - 学生成果通过双审 → 通知可申请资源
  - 学生申请资源 → 通知企业有新的申请
  - 孵化资源对接 → 通知相关方
  - 协议即将到期 → 提醒续签
  - 成果被推荐至比赛 → 通知学生

发送方式：
  - 异步发送（@Async + 线程池）
  - 失败重试 3 次
  - 发送记录写入 notification 表
```

### 7.6 安全设计

```
JWT 认证流程：
  登录 → 服务端签发 JWT（含 userId、role、expire）
  → 前端存 localStorage → 每次请求带 Authorization: Bearer {token}
  → 后端 JwtFilter 校验 → 放行/拒绝

权限控制：
  接口级：@PreAuthorize("hasRole('ADMIN')")
  数据级：查询时自动过滤（学生只能看自己的成果）

防刷策略：
  点赞/评论接口 → Redis 限制频率（同一用户 1 秒内最多 3 次）
  登录接口 → 失败 5 次锁定 15 分钟
```

### 7.7 热门推荐算法

```
热门分数 = 浏览量×1 + 点赞数×3 + 评论数×5 + 教师评分×10

每日凌晨 2 点计算：
  1. 查询近 30 天所有成果的互动数据
  2. 计算热度分 = viewCount*1 + likeCount*3 + commentCount*5 + score*10
  3. 按分数降序排列，取 Top 50 存入 Redis ZSET
  4. 首页推荐直接读取 Redis
```

---

## 八、部署架构

```
┌─────────────────────────────────────────┐
│                 Nginx (80/443)           │
│  ┌──────────────────────────────────┐   │
│  │  静态文件 (Vue dist/)             │   │
│  │  /api/* → Spring Boot (8080)     │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
              │
    ┌─────────┼─────────┬──────────┐
    ↓         ↓         ↓          ↓
 Spring Boot  MySQL   Redis    Elasticsearch
  (8080)      (3306)  (6379)    (9200)
              │
              ↓
        腾讯云 OSS         Java Mail
      (文件存储)          (邮件通知)
```

---

> 📁 相关文档：[DEPLOY.md](../campus-club/DEPLOY.md) · [APP-GUIDE.md](../campus-club/APP-GUIDE.md) · [MINIPROGRAM-GUIDE.md](../campus-club/MINIPROGRAM-GUIDE.md)

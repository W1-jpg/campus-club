# 校园社团成果展示与孵化系统 — 部署教程

> 适用环境：Windows Server / Linux (CentOS/Ubuntu)  
> 更新时间：2026-06-25

---

## 目录

1. [环境准备](#1-环境准备)
2. [数据库配置](#2-数据库配置)
3. [后端部署](#3-后端部署)
4. [前端构建与部署](#4-前端构建与部署)
5. [Nginx 反向代理](#5-nginx-反向代理)
6. [进程守护 (PM2)](#6-进程守护-pm2)
7. [HTTPS 配置](#7-https-配置可选)
8. [常见问题](#8-常见问题)

---

## 1. 环境准备

### 1.1 安装 Node.js

版本要求：**Node.js 18+**

| 系统 | 安装方式 |
|------|----------|
| Windows | 下载安装包 [nodejs.org](https://nodejs.org)，安装时勾选"添加到PATH" |
| Linux | `curl -fsSL https://deb.nodesource.com/setup_18.x \| sudo -E bash -` 然后 `sudo apt install -y nodejs` |

验证安装：

```bash
node -v   # 应显示 v18.x.x 或更高
npm -v    # 应显示 9.x.x 或更高
```

### 1.2 安装 MySQL

版本要求：**MySQL 8.0+**

| 系统 | 安装方式 |
|------|----------|
| Windows | 下载 [MySQL Installer](https://dev.mysql.com/downloads/installer/)，安装 MySQL Server 8.0 |
| Linux | `sudo apt install mysql-server-8.0` (Ubuntu) 或 `sudo yum install mysql-server` (CentOS) |

安装后设置 root 密码，创建数据库：

```sql
CREATE DATABASE IF NOT EXISTS 23db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> ⚠️ 当前数据库名固定为 `23db`，如需修改请同时修改 `server.js` 中的 `database` 配置。

### 1.3 安装 Git（可选，用于拉取代码）

Windows 下载 [Git for Windows](https://git-scm.com/download/win)，Linux 使用 `sudo apt install git`。

---

## 2. 数据库配置

### 2.1 确保 MySQL 服务已启动

**Windows**：打开"服务" (services.msc)，找到 `MySQL80`，确保状态为"正在运行"。

**Linux**：`sudo systemctl start mysql` 并 `sudo systemctl enable mysql`。

### 2.2 配置数据库连接

编辑 `server.js` 第 1-30 行附近的数据库配置：

```js
const db = mysql.createConnection({
  host: 'localhost',      // 数据库地址
  user: 'root',           // 数据库用户名
  password: 'your-password',  // ⚠️ 改成你的真实密码
  database: '23db'        // 数据库名
});
```

> 🔒 **安全建议**：生产环境请使用环境变量管理敏感信息，见[进阶安全配置](#进阶安全配置)。

### 2.3 自动建表

后端启动时会**自动创建所有需要的表**，无需手动执行 SQL：

| 表名 | 说明 |
|------|------|
| `student_user` | 学生用户 |
| `teacher_user` | 教师用户 |
| `admin_user` | 管理员（默认账号 admin/admin123） |
| `expert_user` | 评审专家 |
| `achievement` | 成果 |
| `award` / `award_file` | 获奖及文件 |
| `resource` | 资源 |
| `resource_application` | 资源申请 |
| `club` | 社团 |
| `notification` | 通知 |
| `expert_reviews` | 专家评审记录 |

**默认管理员账号**：用户名 `admin`，密码 `admin123`（首次启动自动创建）。

---

## 3. 后端部署

### 3.1 安装依赖

```bash
cd campus-club
npm install
```

### 3.2 测试运行

```bash
node server.js
```

看到以下输出说明启动成功：

```
Server running at http://localhost:3000
Notification table created or already exists
Student_user table created or already exists
Admin_user table created or already exists
Expert_user table created or already exists
Club table created or already exists
```

访问 `http://localhost:3000/api/admin/stats` 验证 API 是否正常响应。

### 3.3 生产模式部署

在生产环境中，后端需要同时**提供前端静态文件**。在 `server.js` 中添加以下代码（放在 `app.listen` 之前）：

```js
// 生产环境：托管前端构建文件
const frontendPath = path.join(__dirname, 'dist');
app.use(express.static(frontendPath));

// SPA 回退：所有非 API 请求返回 index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});
```

---

## 4. 前端构建与部署

### 4.1 构建生产版本

```bash
cd campus-club
npm run build
```

构建完成后，`dist/` 目录包含：

```
dist/
├── index.html
├── vite.svg
└── assets/
    ├── index-*.js    (主应用，约 1MB)
    ├── index-*.css   (样式表，约 377KB)
    └── ...           (各页面按需加载的 chunk)
```

### 4.2 两种部署方式

#### 方式 A：Express 托管前端（简单）

在 `server.js` 中添加了静态文件托管代码后（见步骤 3.3），直接启动后端即可：

```bash
node server.js
# 访问 http://localhost:3000 即可看到完整系统
```

#### 方式 B：Nginx 托管前端（推荐，性能更好）

见步骤 5。

---

## 5. Nginx 反向代理

> 适用于 Linux 服务器。Windows Server 可使用 IIS 或直接使用方式 A。

### 5.1 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 5.2 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/campus-club`：

```nginx
server {
    listen 80;
    server_name your-domain.com;   # ⚠️ 改为你的域名或IP

    # 前端静态文件
    root /path/to/campus-club/dist;
    index index.html;

    # 上传文件
    location /uploads/ {
        alias /path/to/campus-club/uploads/;
    }

    # API 反向代理到 Express
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA 回退：前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/campus-club /etc/nginx/sites-enabled/
sudo nginx -t          # 检查配置语法
sudo systemctl reload nginx
```

---

## 6. 进程守护 (PM2)

> 防止服务器崩溃或关机后停止运行。

### 6.1 安装 PM2

```bash
npm install -g pm2
```

### 6.2 启动应用

```bash
cd campus-club
pm2 start server.js --name "campus-club" --max-memory-restart 500M
```

### 6.3 设置开机自启

```bash
pm2 startup          # 生成开机启动脚本，按提示执行
pm2 save             # 保存当前进程列表
```

### 6.4 常用 PM2 命令

| 命令 | 说明 |
|------|------|
| `pm2 list` | 查看所有进程 |
| `pm2 logs campus-club` | 查看日志 |
| `pm2 restart campus-club` | 重启 |
| `pm2 stop campus-club` | 停止 |
| `pm2 delete campus-club` | 移除 |
| `pm2 monit` | 实时监控面板 |

---

## 7. HTTPS 配置（可选）

### 7.1 使用 Let's Encrypt 免费证书

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

证书会自动续期，无需手动操作。

### 7.2 更新 Nginx 配置后重载

```bash
sudo systemctl reload nginx
```

---

## 8. 常见问题

### Q1：启动报错 `Client does not support authentication protocol`

```sql
-- 在 MySQL 中执行
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '你的密码';
FLUSH PRIVILEGES;
```

### Q2：端口被占用

```bash
# Windows
netstat -ano | findstr :3000

# Linux
lsof -i :3000
```

修改 `server.js` 末尾 `const port = 3000` 为其他端口。

### Q3：API 返回 500 错误

检查 `server.js` 中 MySQL 连接配置是否正确（主机、用户名、密码、数据库名）。

### Q4：上传文件后无法下载

确保 `uploads/` 目录存在且有写入权限：

```bash
mkdir -p uploads
chmod 755 uploads
```

### Q5：前端页面刷新后 404

检查 Nginx 配置中是否有 `try_files $uri $uri/ /index.html;`（SPA 回退规则）。

---

## 快速部署检查清单

部署完成后，逐项验证：

- [ ] `node server.js` 能正常启动
- [ ] `http://你的地址:3000/api/admin/stats` 返回 JSON
- [ ] 前端页面能正常打开（管理员登录 `/login/admin`）
- [ ] 默认管理员账号 `admin` / `admin123` 能登录
- [ ] 各管理页面（学生管理、教师管理、专家管理等）数据正常加载
- [ ] 文件上传功能正常
- [ ] PM2 已配置开机自启
- [ ] Nginx 已配置（可选）
- [ ] 防火墙已开放相应端口（80/443/3000）

---

## 进阶安全配置

将敏感配置移到 `.env` 文件中：

```bash
# .env 文件内容（不要提交到 Git！）
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=你的密码
DB_NAME=23db
JWT_SECRET=生成一个随机字符串
PORT=3000
```

安装 `dotenv`：`npm install dotenv`

修改 `server.js` 顶部：

```js
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || '23db'
});

const secretKey = process.env.JWT_SECRET || 'your-secret-key';
const port = process.env.PORT || 3000;
```

---

> 📁 相关文件：[server.js](server.js) · [package.json](package.json) · [vite.config.js](vite.config.js)

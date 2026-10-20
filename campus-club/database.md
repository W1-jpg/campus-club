# 校园社团成果展示与孵化系统 - 数据库结构

## 数据库信息
- 数据库名称：23db
- 字符集：utf8mb4
- 排序规则：utf8mb4_unicode_ci

## 表结构

### 1. user 表
**用途**：存储用户基本信息

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | INT | PRIMARY KEY AUTO_INCREMENT | 用户ID |
| username | VARCHAR(100) | NOT NULL UNIQUE | 用户名 |
| password | VARCHAR(100) | NOT NULL | 密码 |
| user_type | ENUM('student', 'teacher', 'admin') | NOT NULL | 用户类型 |
| college | VARCHAR(100) | | 学院 |
| create_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 2. student 表
**用途**：存储学生详细信息

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | INT | PRIMARY KEY AUTO_INCREMENT | 学生ID |
| user_id | INT | NOT NULL, FOREIGN KEY | 关联的用户ID |
| student_id | VARCHAR(100) | NOT NULL UNIQUE | 学号 |
| name | VARCHAR(100) | NOT NULL | 姓名 |
| major | VARCHAR(100) | | 专业 |

### 3. teacher 表
**用途**：存储教师详细信息

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | INT | PRIMARY KEY AUTO_INCREMENT | 教师ID |
| user_id | INT | NOT NULL, FOREIGN KEY | 关联的用户ID |
| teacher_id | VARCHAR(100) | NOT NULL UNIQUE | 教师编号 |
| name | VARCHAR(100) | NOT NULL | 姓名 |
| department | VARCHAR(100) | | 部门 |

### 4. achievement 表
**用途**：存储学生成果信息

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | INT | PRIMARY KEY AUTO_INCREMENT | 成果ID |
| title | VARCHAR(100) | NOT NULL | 成果标题 |
| description | TEXT | | 成果描述 |
| type | VARCHAR(100) | NOT NULL | 成果类型 |
| cover | VARCHAR(100) | | 成果封面 |
| student_id | INT | NOT NULL, FOREIGN KEY | 关联的学生ID |
| create_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| score | DECIMAL(3, 1) | | 评分 |
| incubation_status | ENUM('0', '1', '2') | DEFAULT '0' | 孵化状态（0: 未孵化, 1: 孵化中, 2: 孵化完成） |

### 5. file 表
**用途**：存储成果相关文件

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | INT | PRIMARY KEY AUTO_INCREMENT | 文件ID |
| achievement_id | INT | NOT NULL, FOREIGN KEY | 关联的成果ID |
| file_name | VARCHAR(255) | NOT NULL | 文件名 |
| file_path | VARCHAR(255) | NOT NULL | 文件路径 |
| file_size | BIGINT | NOT NULL | 文件大小 |
| file_type | VARCHAR(255) | NOT NULL | 文件类型 |
| create_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 6. incubation 表
**用途**：存储成果孵化信息

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | INT | PRIMARY KEY AUTO_INCREMENT | 孵化ID |
| achievement_id | INT | NOT NULL, FOREIGN KEY | 关联的成果ID |
| status | ENUM('0', '1', '2') | DEFAULT '0' | 孵化状态（0: 未开始, 1: 进行中, 2: 已完成） |
| progress | INT | DEFAULT 0 | 孵化进度（0-100） |
| start_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | 开始时间 |
| end_time | DATETIME | | 结束时间 |

### 7. resource 表
**用途**：存储资源信息

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | INT | PRIMARY KEY AUTO_INCREMENT | 资源ID |
| name | VARCHAR(255) | NOT NULL | 资源名称 |
| type | VARCHAR(255) | NOT NULL | 资源类型 |
| description | TEXT | | 资源描述 |
| provider | VARCHAR(255) | | 提供者 |
| create_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 8. application 表
**用途**：存储资源申请信息

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | INT | PRIMARY KEY AUTO_INCREMENT | 申请ID |
| student_id | INT | NOT NULL, FOREIGN KEY | 关联的学生ID |
| resource_id | INT | NOT NULL, FOREIGN KEY | 关联的资源ID |
| status | ENUM('0', '1', '2') | DEFAULT '0' | 申请状态（0: 待审批, 1: 已通过, 2: 已拒绝） |
| apply_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | 申请时间 |
| reason | TEXT | | 申请理由 |

### 9. notification 表
**用途**：存储系统通知信息

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| id | INT | PRIMARY KEY AUTO_INCREMENT | 通知ID |
| title | VARCHAR(255) | NOT NULL | 通知标题 |
| content | TEXT | | 通知内容 |
| type | VARCHAR(255) | NOT NULL | 通知类型 |
| create_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| is_read | BOOLEAN | DEFAULT FALSE | 是否已读 |

## 表关系

- **user** 与 **student**：一对多关系（一个用户对应一个学生）
- **user** 与 **teacher**：一对多关系（一个用户对应一个教师）
- **student** 与 **achievement**：一对多关系（一个学生可以有多个成果）
- **achievement** 与 **file**：一对多关系（一个成果可以有多个文件）
- **achievement** 与 **incubation**：一对多关系（一个成果可以有一个孵化记录）
- **student** 与 **application**：一对多关系（一个学生可以有多个申请）
- **resource** 与 **application**：一对多关系（一个资源可以被多个学生申请）

## 测试数据

系统包含以下测试数据：

### 用户数据
- 学生：student1 / password123
- 教师：teacher1 / password123
- 管理员：admin / password123

### 成果数据
- 软件测试实验报告
- 学术论文
- 文创作品

### 通知数据
- 系统通知：欢迎使用校园社团成果展示与孵化系统
- 成果审核：您的成果已通过审核
- 孵化通知：您的成果已开始孵化
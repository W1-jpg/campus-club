-- 创建数据库
CREATE DATABASE IF NOT EXISTS 23db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE 23db;

-- 创建用户表
CREATE TABLE IF NOT EXISTS user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    user_type ENUM('student', 'teacher', 'admin') NOT NULL,
    college VARCHAR(100),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建学生表
CREATE TABLE IF NOT EXISTS student (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    student_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    major VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- 创建教师表
CREATE TABLE IF NOT EXISTS teacher (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    teacher_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- 创建成果表
CREATE TABLE IF NOT EXISTS achievement (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL,
    cover VARCHAR(100),
    student_id INT NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    score DECIMAL(3, 1),
    incubation_status ENUM('0', '1', '2') DEFAULT '0' COMMENT '0: 未孵化, 1: 孵化中, 2: 孵化完成',
    FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE
);

-- 创建文件表
CREATE TABLE IF NOT EXISTS file (
    id INT PRIMARY KEY AUTO_INCREMENT,
    achievement_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(255) NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (achievement_id) REFERENCES achievement(id) ON DELETE CASCADE
);

-- 创建孵化表
CREATE TABLE IF NOT EXISTS incubation (
    id INT PRIMARY KEY AUTO_INCREMENT,
    achievement_id INT NOT NULL,
    status ENUM('0', '1', '2') DEFAULT '0' COMMENT '0: 未开始, 1: 进行中, 2: 已完成',
    progress INT DEFAULT 0 COMMENT '孵化进度，0-100',
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    FOREIGN KEY (achievement_id) REFERENCES achievement(id) ON DELETE CASCADE
);

-- 创建资源表
CREATE TABLE IF NOT EXISTS resource (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    description TEXT,
    provider VARCHAR(255),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建申请表格
CREATE TABLE IF NOT EXISTS application (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    resource_id INT NOT NULL,
    status ENUM('0', '1', '2') DEFAULT '0' COMMENT '0: 待审批, 1: 已通过, 2: 已拒绝',
    apply_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resource(id) ON DELETE CASCADE
);

-- 创建通知表
CREATE TABLE IF NOT EXISTS notification (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(255) NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

-- 插入测试数据
-- 插入用户
INSERT INTO user (username, password, user_type, college) VALUES
('student1', 'password123', 'student', '计算机学院'),
('teacher1', 'password123', 'teacher', '计算机学院'),
('admin', 'password123', 'admin', '管理学院');

-- 插入学生
INSERT INTO student (user_id, student_id, name, major) VALUES
(1, '20200001', '张三', '计算机科学与技术');

-- 插入教师
INSERT INTO teacher (user_id, teacher_id, name, department) VALUES
(2, 'T20200001', '李四', '计算机学院');

-- 插入成果
INSERT INTO achievement (title, description, type, cover, student_id, score, incubation_status) VALUES
('软件测试实验报告', '这是一份软件测试的实验报告', '软件', 'cover1.jpg', 1, 85.5, '0'),
('学术论文', '关于人工智能的研究论文', '论文', 'cover2.jpg', 1, 90.0, '1'),
('文创作品', '校园文化创意设计', '文创', 'cover3.jpg', 1, 88.0, '2');

-- 插入文件
INSERT INTO file (achievement_id, file_name, file_path, file_size, file_type) VALUES
(1, '软件测试实验报告.docx', 'uploads/software_test_report.docx', 1024000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
(2, '人工智能研究论文.pdf', 'uploads/ai_research_paper.pdf', 2048000, 'application/pdf'),
(3, '校园文创设计.png', 'uploads/campus_design.png', 1536000, 'image/png');

-- 插入孵化记录
INSERT INTO incubation (achievement_id, status, progress, start_time, end_time) VALUES
(1, '0', 0, CURRENT_TIMESTAMP, NULL),
(2, '1', 50, CURRENT_TIMESTAMP, NULL),
(3, '2', 100, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY));

-- 插入资源
INSERT INTO resource (name, type, description, provider) VALUES
('实验室设备', '硬件', '用于学生实验的设备', '实验室管理处'),
('研究经费', '资金', '用于科研项目的经费', '科研处'),
('技术指导', '服务', '专业技术人员的指导', '计算机学院');

-- 插入申请
INSERT INTO application (student_id, resource_id, status, reason) VALUES
(1, 1, '0', '需要使用实验室设备进行实验'),
(1, 2, '1', '需要经费支持科研项目'),
(1, 3, '2', '需要技术指导完成项目');

-- 插入通知
INSERT INTO notification (title, content, type, is_read) VALUES
('系统通知', '欢迎使用校园社团成果展示与孵化系统', 'system', TRUE),
('成果审核', '您的成果已通过审核', 'achievement', FALSE),
('孵化通知', '您的成果已开始孵化', 'incubation', FALSE);
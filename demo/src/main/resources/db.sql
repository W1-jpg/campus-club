-- 成果表
CREATE TABLE IF NOT EXISTS achievement (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    student_id BIGINT NOT NULL,
    college VARCHAR(50),
    file_path VARCHAR(255),
    file_name VARCHAR(255),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status INT DEFAULT 1
);

-- 评论表
CREATE TABLE IF NOT EXISTS comment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    achievement_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    user_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (achievement_id) REFERENCES achievement(id) ON DELETE CASCADE
);

-- 点赞表
CREATE TABLE IF NOT EXISTS likes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    achievement_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    user_type VARCHAR(50) NOT NULL,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_achievement_user (achievement_id, user_id, user_type),
    FOREIGN KEY (achievement_id) REFERENCES achievement(id) ON DELETE CASCADE
);

-- 系统通知表
CREATE TABLE IF NOT EXISTS system_notice (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    publisher_id BIGINT,
    publisher_type VARCHAR(50),
    student_id BIGINT,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status INT DEFAULT 1
);

-- 为student_user表添加college字段（如果不存在）
-- ALTER TABLE student_user ADD COLUMN IF NOT EXISTS college VARCHAR(50) AFTER email;

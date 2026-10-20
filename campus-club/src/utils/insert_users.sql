USE 23db;

-- 插入教师账号
INSERT IGNORE INTO user (username, password, user_type, college) VALUES ('teacher1', 'password123', 'teacher', 'Computer Science');

-- 插入管理员账号
INSERT IGNORE INTO user (username, password, user_type, college) VALUES ('admin1', 'password123', 'admin', 'Computer Science');

-- 查看所有用户
SELECT * FROM user;
USE 23db;

-- 添加file_category字段到file表
ALTER TABLE file ADD COLUMN file_category VARCHAR(50) NOT NULL DEFAULT 'club' AFTER file_type;

-- 为现有数据设置file_category值
UPDATE file SET file_category = 'club' WHERE file_category = '';

-- 插入测试数据
INSERT IGNORE INTO file (achievement_id, file_name, file_path, file_size, file_type, file_category) VALUES 
(1, 'software_test_report.docx', 'uploads/software_test_report.docx', 1024000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'club'),
(1, 'achievement_demo.pdf', 'uploads/achievement_demo.pdf', 2048000, 'application/pdf', 'achievement');
-- 资源表
CREATE TABLE IF NOT EXISTS resource (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    publish_time DATETIME NOT NULL,
    end_time DATETIME,
    status VARCHAR(20) NOT NULL DEFAULT '进行中',
    view_count INT DEFAULT 0,
    apply_count INT DEFAULT 0,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 资源申请表
CREATE TABLE IF NOT EXISTS resource_application (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    resource_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    student_name VARCHAR(50) NOT NULL,
    student_college VARCHAR(50) NOT NULL,
    application_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT '待审核',
    FOREIGN KEY (resource_id) REFERENCES resource(id) ON DELETE CASCADE
);

-- 插入示例数据
INSERT INTO resource (title, type, provider, description, publish_time, end_time, status) VALUES
('大学生创新创业基金', '资金支持', '校团委', '为优秀的大学生创新创业项目提供资金支持，最高资助金额10万元', '2024-01-15 08:00:00', '2024-02-28 08:00:00', '进行中'),
('创业导师一对一指导', '导师指导', '创新创业学院', '邀请校外创业导师为学生项目提供一对一指导服务', '2024-01-10 08:00:00', '2024-03-31 08:00:00', '进行中'),
('创客空间场地申请', '场地提供', '资产处', '为创业团队提供免费的办公场地和基础设施', '2024-01-05 08:00:00', '2024-01-20 08:00:00', '已结束'),
('3D打印机使用申请', '设备支持', '工程学院', '为学生项目提供3D打印机使用权限', '2024-01-20 08:00:00', '2024-02-20 08:00:00', '进行中'),
('创业培训课程', '导师指导', '就业指导中心', '为学生提供创业相关培训课程', '2024-01-12 08:00:00', '2024-02-12 08:00:00', '进行中');

-- 插入示例申请数据
INSERT INTO resource_application (resource_id, student_id, student_name, student_college, status) VALUES
(1, 1, '张三', '软件学院', '待审核'),
(1, 2, '李四', '商学院', '已通过'),
(2, 3, '王五', '艺术学院', '待审核'),
(3, 4, '赵六', '软件学院', '已通过'),
(4, 5, '钱七', '工程学院', '待审核');
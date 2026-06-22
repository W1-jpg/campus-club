CREATE DATABASE IF NOT EXISTS 23db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE 23db;

CREATE TABLE IF NOT EXISTS user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    user_type ENUM('student', 'teacher', 'admin') NOT NULL,
    college VARCHAR(100),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    student_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    major VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS achievement (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL,
    student_id INT NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    score DECIMAL(3, 1),
    incubation_status ENUM('0', '1', '2') DEFAULT '0'
);

CREATE TABLE IF NOT EXISTS file (
    id INT PRIMARY KEY AUTO_INCREMENT,
    achievement_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(255) NOT NULL,
    file_category VARCHAR(50) NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO user (username, password, user_type, college) VALUES ('student1', 'password123', 'student', 'Computer Science');

INSERT INTO student (user_id, student_id, name, major) VALUES (1, '20200001', 'Zhang San', 'Computer Science');

INSERT INTO achievement (title, description, type, student_id, score, incubation_status) VALUES ('Software Test Report', 'This is a software test report', 'Software', 1, 85.5, '0');

INSERT INTO file (achievement_id, file_name, file_path, file_size, file_type, file_category) VALUES (1, 'software_test_report.docx', 'uploads/software_test_report.docx', 1024000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'club');
INSERT INTO file (achievement_id, file_name, file_path, file_size, file_type, file_category) VALUES (1, 'achievement_demo.pdf', 'uploads/achievement_demo.pdf', 2048000, 'application/pdf', 'achievement');
-- 更新系统通知表，添加student_id列
ALTER TABLE system_notice ADD COLUMN IF NOT EXISTS student_id BIGINT;
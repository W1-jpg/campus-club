-- =============================================
-- 钱包支付功能 数据库迁移脚本
-- 仅添加 enterprise_account / recharge_record 表
-- 不影响任何现有表和数据
-- 执行方式: mysql -u root -p 23db < wallet_migration.sql
-- =============================================

USE 23db;

-- 1. 企业账户表
CREATE TABLE IF NOT EXISTS enterprise_account (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    enterprise_id BIGINT UNIQUE NOT NULL        COMMENT '关联企业用户ID',
    username VARCHAR(64) DEFAULT NULL           COMMENT '企业名称',
    balance DECIMAL(10, 2) DEFAULT 0.00         COMMENT '账户余额',
    frozen_amount DECIMAL(10, 2) DEFAULT 0.00   COMMENT '冻结金额',
    total_recharge DECIMAL(12, 2) DEFAULT 0.00  COMMENT '累计充值金额',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='企业钱包账户';

-- 2. 充值记录表
CREATE TABLE IF NOT EXISTS recharge_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    enterprise_id BIGINT NOT NULL              COMMENT '企业ID',
    out_trade_no VARCHAR(64) UNIQUE NOT NULL   COMMENT '商户订单号',
    trade_no VARCHAR(64) DEFAULT NULL          COMMENT '支付宝交易号',
    amount DECIMAL(10, 2) NOT NULL             COMMENT '充值金额',
    status VARCHAR(20) DEFAULT 'PENDING'       COMMENT 'PENDING/SUCCESS/FAILED',
    pay_method VARCHAR(20) DEFAULT 'alipay'    COMMENT '支付方式',
    remark VARCHAR(255) DEFAULT NULL           COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    pay_time DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='充值交易记录';

-- 验证：确认表已创建（不会影响现有表）
-- SHOW TABLES LIKE 'enterprise_account';
-- SHOW TABLES LIKE 'recharge_record';

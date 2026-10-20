-- 23db 数据库表注释（自动生成）
USE 23db;

ALTER TABLE `user` COMMENT='统一登录认证表，存储所有用户基础登录凭据，通过 user_type 区分角色';
ALTER TABLE `student_user` COMMENT='学生用户详情表，存储学生个人信息';
ALTER TABLE `teacher_user` COMMENT='教师（指导老师）用户表，负责成果评分与孵化审批';
ALTER TABLE `admin_user` COMMENT='系统管理员表，拥有全量管理权限';
ALTER TABLE `expert_user` COMMENT='评审专家表，对成果进行多维度专业评审';
ALTER TABLE `enterprise_user` COMMENT='企业用户表，发布资源、审批申请、浏览收藏成果';
ALTER TABLE `achievement` COMMENT='成果主表，存储成果完整信息及评分、孵化、评审全流程状态';
ALTER TABLE `result` COMMENT='成果表（早期简化版），用于基础成果提交与展示';
ALTER TABLE `file` COMMENT='成果附件表，记录成果关联的图片/视频/文档等上传文件';
ALTER TABLE `comment` COMMENT='评论表，存储师生对成果的评论互动';
ALTER TABLE `likes` COMMENT='点赞表，记录用户对成果的点赞';
ALTER TABLE `expert_reviews` COMMENT='专家评审记录表，存储专家对成果的多维度评分与评审结论';
ALTER TABLE `resource` COMMENT='资源表，存储企业/教师发布的资助资源';
ALTER TABLE `resource_application` COMMENT='资源申请表，记录学生对资源的申请及审批状态';
ALTER TABLE `notification` COMMENT='业务通知表，存储系统根据业务事件自动生成的通知';
ALTER TABLE `system_notice` COMMENT='系统公告表，管理员发布的全站公告';
ALTER TABLE `award` COMMENT='获奖表，记录学生成果获奖信息';
ALTER TABLE `award_file` COMMENT='获奖附件表，存储获奖证书等证明材料文件';
ALTER TABLE `enterprise_account` COMMENT='企业账户（钱包）表，管理企业资金余额与冻结金额';
ALTER TABLE `recharge_record` COMMENT='充值记录表，记录企业账户充值流水';
ALTER TABLE `enterprise_bookmark` COMMENT='企业收藏表，记录企业收藏的优质成果';

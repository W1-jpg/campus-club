# -*- coding: utf-8 -*-
# 生成 11 个实体的数据库表设计三线表（HTML，供渲染成 PNG）
import os

OUT = r"D:\BISHE\ER实体属性图\数据库表设计"
os.makedirs(OUT, exist_ok=True)

# (表名, 中文表名, [(字段, 类型, 长度, 主键, 允许null, 描述), ...])
TABLES = [
    ("student_user", "学生信息表", [
        ("student_id", "int", "11", "是", "否", "学生ID，主键，自增"),
        ("username", "varchar", "20", "否", "否", "用户名，唯一，用于登录"),
        ("password", "varchar", "64", "否", "否", "密码，加密存储"),
        ("real_name", "varchar", "20", "否", "是", "真实姓名"),
        ("college", "varchar", "50", "否", "是", "所属学院"),
        ("phone", "varchar", "20", "否", "是", "手机号"),
        ("email", "varchar", "50", "否", "是", "邮箱"),
        ("openid", "varchar", "64", "否", "是", "微信openid，小程序登录"),
        ("nick_name", "varchar", "30", "否", "是", "微信昵称"),
        ("avatar", "varchar", "255", "否", "是", "头像URL"),
        ("status", "tinyint", "1", "否", "否", "账号状态，默认1（1正常/0禁用）"),
        ("create_time", "datetime", "—", "否", "否", "注册时间，默认当前时间"),
    ]),
    ("teacher_user", "教师信息表", [
        ("teacher_id", "int", "11", "是", "否", "教师ID，主键，自增"),
        ("username", "varchar", "20", "否", "否", "用户名，唯一，用于登录"),
        ("password", "varchar", "64", "否", "否", "密码，加密存储"),
        ("real_name", "varchar", "20", "否", "否", "真实姓名"),
        ("teacher_no", "varchar", "20", "否", "是", "教师工号"),
        ("college", "varchar", "50", "否", "是", "所属学院"),
        ("email", "varchar", "50", "否", "是", "邮箱"),
        ("status", "tinyint", "1", "否", "否", "账号状态，默认1（1正常/0禁用）"),
        ("create_time", "datetime", "—", "否", "否", "创建时间，默认当前时间"),
    ]),
    ("admin_user", "管理员信息表", [
        ("admin_id", "int", "11", "是", "否", "管理员ID，主键，自增"),
        ("username", "varchar", "20", "否", "否", "用户名，唯一，用于登录"),
        ("password", "varchar", "64", "否", "否", "密码，加密存储"),
        ("real_name", "varchar", "20", "否", "是", "真实姓名"),
        ("email", "varchar", "50", "否", "是", "邮箱"),
        ("status", "tinyint", "1", "否", "否", "账号状态，默认1（1正常/0禁用）"),
        ("create_time", "datetime", "—", "否", "否", "创建时间，默认当前时间"),
    ]),
    ("resource", "资源信息表", [
        ("resource_id", "int", "11", "是", "否", "资源ID，主键，自增"),
        ("title", "varchar", "100", "否", "否", "资源标题"),
        ("type", "varchar", "20", "否", "否", "资源类型"),
        ("provider", "varchar", "50", "否", "是", "资源提供方"),
        ("description", "varchar", "500", "否", "是", "资源详细描述"),
        ("publish_time", "datetime", "—", "否", "是", "发布时间"),
        ("end_time", "datetime", "—", "否", "是", "申请截止时间"),
        ("status", "varchar", "10", "否", "否", "状态，默认“开放”"),
        ("view_count", "int", "11", "否", "否", "浏览量，默认0"),
        ("apply_count", "int", "11", "否", "否", "申请量，默认0"),
        ("create_time", "datetime", "—", "否", "否", "创建时间，默认当前时间"),
        ("update_time", "datetime", "—", "否", "是", "更新时间"),
    ]),
    ("resource_application", "资源申请表", [
        ("application_id", "int", "11", "是", "否", "申请ID，主键，自增"),
        ("resource_id", "int", "11", "否", "否", "所申请的资源ID，外键"),
        ("student_id", "int", "11", "否", "否", "申请学生ID，外键"),
        ("student_name", "varchar", "20", "否", "是", "学生姓名（冗余，便于展示）"),
        ("student_college", "varchar", "50", "否", "是", "学生学院（冗余，便于展示）"),
        ("application_time", "datetime", "—", "否", "是", "申请时间，默认当前时间"),
        ("status", "varchar", "10", "否", "否", "申请状态，默认“待审核”"),
    ]),
    ("achievement", "成果信息表", [
        ("achievement_id", "int", "11", "是", "否", "成果ID，主键，自增"),
        ("title", "varchar", "100", "否", "否", "成果标题"),
        ("type", "varchar", "20", "否", "否", "成果类型（项目/竞赛/论文等）"),
        ("description", "varchar", "500", "否", "是", "成果描述"),
        ("student_id", "int", "11", "否", "否", "所属学生ID，外键"),
        ("college", "varchar", "50", "否", "是", "学生所属学院"),
        ("file_path", "varchar", "255", "否", "是", "附件存储路径"),
        ("file_name", "varchar", "100", "否", "是", "附件文件名"),
        ("score", "int", "11", "否", "是", "教师评分，默认NULL"),
        ("review_status", "tinyint", "1", "否", "否", "审核状态，默认0（0待审/1通过/2驳回）"),
        ("incubation_status", "tinyint", "1", "否", "否", "孵化状态，默认0"),
        ("create_time", "datetime", "—", "否", "否", "创建时间，默认当前时间"),
        ("update_time", "datetime", "—", "否", "是", "更新时间"),
    ]),
    ("likes", "点赞信息表", [
        ("like_id", "int", "11", "是", "否", "点赞ID，主键，自增"),
        ("achievement_id", "int", "11", "否", "否", "被点赞的成果ID，外键"),
        ("user_id", "int", "11", "否", "否", "点赞用户ID"),
        ("user_type", "varchar", "10", "否", "否", "用户类型（student/teacher）"),
        ("create_time", "datetime", "—", "否", "否", "点赞时间，默认当前时间"),
    ]),
    ("comment", "评论信息表", [
        ("comment_id", "int", "11", "是", "否", "评论ID，主键，自增"),
        ("achievement_id", "int", "11", "否", "否", "被评论的成果ID，外键"),
        ("user_id", "int", "11", "否", "否", "评论用户ID"),
        ("user_type", "varchar", "10", "否", "否", "用户类型（student/teacher）"),
        ("content", "varchar", "500", "否", "否", "评论内容"),
        ("create_time", "datetime", "—", "否", "否", "评论时间，默认当前时间"),
    ]),
    ("file", "文件信息表", [
        ("file_id", "int", "11", "是", "否", "文件ID，主键，自增"),
        ("achievement_id", "int", "11", "否", "否", "所属成果ID，外键"),
        ("file_name", "varchar", "100", "否", "否", "文件名"),
        ("file_path", "varchar", "255", "否", "否", "文件存储路径"),
        ("upload_time", "datetime", "—", "否", "否", "上传时间，默认当前时间"),
    ]),
    ("system_notice", "系统通知表", [
        ("notice_id", "int", "11", "是", "否", "通知ID，主键，自增"),
        ("title", "varchar", "100", "否", "否", "通知标题"),
        ("content", "varchar", "1000", "否", "否", "通知内容"),
        ("publisher_id", "int", "11", "否", "否", "发布者ID"),
        ("publisher_type", "varchar", "10", "否", "否", "发布者类型（teacher/admin）"),
        ("student_id", "int", "11", "否", "是", "接收学生ID，为空表示全员通知"),
        ("status", "tinyint", "1", "否", "否", "通知状态，默认1（1发布/0撤回）"),
        ("create_time", "datetime", "—", "否", "否", "创建时间，默认当前时间"),
        ("update_time", "datetime", "—", "否", "是", "更新时间"),
    ]),
    ("incubation", "孵化信息表", [
        ("incubation_id", "int", "11", "是", "否", "孵化ID，主键，自增"),
        ("achievement_id", "int", "11", "否", "否", "孵化成果ID，外键"),
        ("incubation_status", "tinyint", "1", "否", "否", "孵化状态，默认0（0培育/1落地/2终止）"),
        ("incubation_time", "datetime", "—", "否", "是", "孵化开始时间，默认当前时间"),
        ("remark", "varchar", "200", "否", "是", "备注说明"),
    ]),
]

CSS = """
<style>
  body{margin:16px;background:white;font-family:'Times New Roman',SimSun,serif;font-size:15px;}
  .cap{text-align:center;font-size:15px;margin:0 0 4px 0;}
  table{border-collapse:collapse;margin:0 auto;}
  th,td{padding:4px 10px;}
  th{border-top:1.5pt solid black;border-bottom:0.75pt solid black;text-align:center;font-weight:normal;}
  td{text-align:left;border:none;}
  tr:last-child td{border-bottom:1.5pt solid black;}
</style>
"""

for i, (tname, cname, rows) in enumerate(TABLES, 1):
    html = ["<!doctype html><html><head><meta charset='utf-8'>", CSS, "</head><body>"]
    html.append(f"<p class='cap'>表3-{i} {cname}（{tname}）</p>")
    html.append("<table><tr><th>字段名称</th><th>数据类型</th><th>字段长度</th><th>主键</th><th>允许null值</th><th>描述</th></tr>")
    for r in rows:
        tds = "".join(f"<td>{c}</td>" for c in r)
        html.append(f"<tr>{tds}</tr>")
    html.append("</table></body></html>")
    with open(os.path.join(OUT, f"表3-{i}_{tname}.html"), "w", encoding="utf-8") as f:
        f.write("".join(html))

print("done", len(TABLES))

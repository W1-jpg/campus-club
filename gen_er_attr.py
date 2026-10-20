# -*- coding: utf-8 -*-
# 生成 11 个实体的 E-R 实体属性图（陈氏风格：矩形实体 + 椭圆属性，主键下划线）
import os, math

OUT = r"D:\BISHE\ER实体属性图"
os.makedirs(OUT, exist_ok=True)

ENTITIES = [
    ("学生", ["学生ID", "用户名", "密码", "真实姓名", "学院", "手机", "邮箱", "状态"]),
    ("教师", ["教师ID", "用户名", "密码", "真实姓名", "教师工号", "学院", "邮箱"]),
    ("管理员", ["管理员ID", "用户名", "密码", "真实姓名", "邮箱", "状态"]),
    ("资源", ["资源ID", "标题", "类型", "提供方", "描述", "发布时间", "截止时间", "状态"]),
    ("申请", ["申请ID", "资源ID", "学生ID", "学生姓名", "学院", "申请时间", "状态"]),
    ("成果", ["成果ID", "标题", "类型", "描述", "学生ID", "评分", "审核状态", "孵化状态"]),
    ("点赞", ["点赞ID", "成果ID", "用户ID", "用户类型", "点赞时间"]),
    ("评论", ["评论ID", "成果ID", "用户ID", "用户类型", "内容", "评论时间"]),
    ("文件", ["文件ID", "文件名", "文件路径", "所属成果", "上传时间"]),
    ("通知", ["通知ID", "标题", "内容", "发布者ID", "发布者类型", "接收学生ID", "状态"]),
    ("孵化", ["孵化ID", "成果ID", "孵化状态", "孵化时间", "备注"]),
]

RX, RY = 58, 24      # 椭圆半径
COLW = 150           # 列间距
ROWH = 130           # 行距（椭圆中心到实体中心）

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;")

def make_svg(name, attrs):
    n = len(attrs)
    top_n = math.ceil(n / 2)
    rows = [attrs[:top_n], attrs[top_n:]]
    width = max(660, n * COLW + 120)
    height = 330
    cx = width / 2
    cy = height / 2
    parts = []
    parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}" font-family="SimSun, SimHei, serif" font-size="16">'
        f'<rect width="{width}" height="{height}" fill="white"/>'
    )
    style = ('<style>.a{fill:white;stroke:black;stroke-width:1.5;}'
             '.l{stroke:black;stroke-width:1.2;}'
             '.t{fill:black;text-anchor:middle;dominant-baseline:middle;}</style>')
    parts.append(style)
    # 实体矩形
    parts.append(f'<rect class="a" x="{cx-60}" y="{cy-24}" width="120" height="48"/>')
    parts.append(f'<text class="t" x="{cx}" y="{cy}" font-size="18">{esc(name)}</text>')
    # 属性
    for r, attrs_row in enumerate(rows):
        m = len(attrs_row)
        ay = cy - ROWH if r == 0 else cy + ROWH
        start = cx - (m - 1) * COLW / 2
        for i, a in enumerate(attrs_row):
            ax = start + i * COLW
            parts.append(
                f'<ellipse class="a" cx="{ax:.0f}" cy="{ay}" rx="{RX}" ry="{RY}"/>'
            )
            underline = ' text-decoration="underline"' if i == 0 and r == 0 and a.endswith("ID") else ''
            parts.append(f'<text class="t" x="{ax:.0f}" y="{ay}"{underline}>{esc(a)}</text>')
            # 连线：连到实体边缘
            if r == 0:
                ex, ey = cx + (0 if abs(ax - cx) < 1 else (60 if ax > cx else -60)), cy - 24
            else:
                ex, ey = cx + (0 if abs(ax - cx) < 1 else (60 if ax > cx else -60)), cy + 24
            parts.append(f'<line class="l" x1="{ax:.0f}" y1="{ay + (RY if r==0 else -RY)}" x2="{ex:.0f}" y2="{ey}"/>')
    parts.append('</svg>')
    return "".join(parts)

for name, attrs in ENTITIES:
    svg = make_svg(name, attrs)
    with open(os.path.join(OUT, f"{name}实体属性图.svg"), "w", encoding="utf-8") as f:
        f.write(svg)
print("done")

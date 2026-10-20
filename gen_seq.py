
# -*- coding: utf-8 -*-
# 生成“成果浏览”用例的时序图（SVG）
import os
OUT = r"D:\BISHE"
# 参与者
parts = ["学生", "微信小程序", "后端系统", "数据库"]
# (类型'msg'|'ret', 发送者索引, 接收者索引, 标签)
msgs = [
    ("msg", 0, 1, "进入成果浏览页面"),
    ("msg", 1, 2, "请求成果列表(分页)"),
    ("msg", 2, 3, "查询审核通过的成果"),
    ("ret", 3, 2, "返回成果列表"),
    ("ret", 2, 1, "返回列表(JSON)"),
    ("ret", 1, 0, "分页展示成果列表"),
    ("msg", 0, 1, "点击某一成果"),
    ("msg", 1, 2, "请求成果详情(id)"),
    ("msg", 2, 3, "查询成果详情"),
    ("msg", 2, 3, "更新浏览量(+1)"),
    ("ret", 3, 2, "返回详情与更新结果"),
    ("ret", 2, 1, "返回详情(含点赞/评论)"),
    ("ret", 1, 0, "展示详情并刷新浏览量"),
]

# 布局参数
colw = 190            # 参与者列间距
x0 = 90               # 第一个参与者x
top = 90              # 参与者标题框顶部
hdr = 54              # 标题框高度
rowh = 40             # 消息行距
margin_bottom = 40

n = len(parts)
width = x0*2 + (n-1)*colw + 120
height = top + hdr + 30 + len(msgs)*rowh + margin_bottom
pxs = [x0 + i*colw for i in range(n)]

s = []
s.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
         f'viewBox="0 0 {width} {height}" font-family="SimSun, SimHei, serif" font-size="14">')
s.append('<rect width="%d" height="%d" fill="white"/>' % (width, height))
s.append('<style>.box{fill:white;stroke:black;stroke-width:1.4;}'
         '.life{stroke:#888;stroke-width:1;stroke-dasharray:5,4;}'
         '.act{fill:#eef;stroke:black;stroke-width:1.2;}'
         '.msg{stroke:black;stroke-width:1.4;}'
         '.ret{stroke:black;stroke-width:1.2;stroke-dasharray:6,4;}'
         '.lbl{fill:black;font-size:13px;text-anchor:middle;dominant-baseline:middle;}'
         '.ptl{fill:black;font-size:15px;text-anchor:middle;dominant-baseline:middle;}</style>')

# 参与者标题框
for i, p in enumerate(parts):
    s.append(f'<rect class="box" x="{pxs[i]-58}" y="{top}" width="116" height="{hdr}"/>')
    s.append(f'<text class="ptl" x="{pxs[i]}" y="{top+hdr/2}">{p}</text>')

# 生命线
y_start = top + hdr
for i in range(n):
    s.append(f'<line class="life" x1="{pxs[i]}" y1="{y_start}" x2="{pxs[i]}" y2="{y_start+len(msgs)*rowh}"/>')

# 消息
act_top = {}
cur = y_start + 30
for idx, (kind, a, b, label) in enumerate(msgs):
    y = cur
    # 激活条
    for p in (a, b):
        if p not in act_top:
            act_top[p] = y - 12
    if kind == "msg":
        s.append(f'<line class="msg" x1="{pxs[a]}" y1="{y}" x2="{pxs[b]}" y2="{y}"/>')
        arrow = 'M{0},{1} l8,-4 v8 z'.format(pxs[b], y)
        s.append(f'<path d="{arrow}" fill="black"/>')
    else:
        s.append(f'<line class="ret" x1="{pxs[a]}" y1="{y}" x2="{pxs[b]}" y2="{y}"/>')
        arrow = 'M{0},{1} l-8,-4 v8 z'.format(pxs[b], y)
        s.append(f'<path d="{arrow}" fill="black"/>')
    # 标签（画在线上方，水平偏移避开箭头）
    lx = (pxs[a] + pxs[b]) / 2
    s.append(f'<text class="lbl" x="{lx}" y="{y-8}">{label}</text>')
    cur += rowh

# 画激活条（在消息之后统一覆盖）
for i in range(n):
    if i in act_top:
        y1 = act_top[i]
        y2 = y_start + len(msgs)*rowh - 8
        s.append(f'<rect class="act" x="{pxs[i]-4}" y="{y1}" width="8" height="{y2-y1}"/>')

s.append('</svg>')
open(os.path.join(OUT, "成果浏览时序图.svg"), "w", encoding="utf-8").write("".join(s))
print("svg written", width, height)

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR, MSO_AUTO_SIZE
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.dml import MSO_LINE_DASH_STYLE

# ---------- theme ----------
NAVY = RGBColor(0x0B, 0x1B, 0x3A)
NAVY_2 = RGBColor(0x14, 0x2A, 0x55)
BLUE = RGBColor(0x1F, 0x4F, 0xD8)
CYAN = RGBColor(0x14, 0xB8, 0xC8)
LIGHT = RGBColor(0xF4, 0xF7, 0xFC)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
TEXT = RGBColor(0x1B, 0x24, 0x37)
MUTED = RGBColor(0x6B, 0x78, 0x91)
BORDER = RGBColor(0xDF, 0xE6, 0xF2)
ORANGE = RGBColor(0xF5, 0x9E, 0x0B)
GREEN = RGBColor(0x10, 0xB9, 0x81)
SOFT_BLUE = RGBColor(0xEA, 0xF0, 0xFF)
SOFT_CYAN = RGBColor(0xE6, 0xF8, 0xFA)
FONT = "Microsoft YaHei"

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]

TOTAL = 10


def set_bg(slide, color=LIGHT):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def no_line(shape):
    shape.line.fill.background()


def add_rect(slide, x, y, w, h, fill, line=None, radius=True, shape=MSO_SHAPE.ROUNDED_RECTANGLE, line_w=1):
    shp = slide.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    shp.fill.solid()
    shp.fill.fore_color.rgb = fill
    if line is None:
        no_line(shp)
    else:
        shp.line.color.rgb = line
        shp.line.width = Pt(line_w)
    shp.shadow.inherit = False
    return shp


def add_text(slide, text, x, y, w, h, size=16, color=TEXT, bold=False, align=PP_ALIGN.LEFT,
             anchor=MSO_ANCHOR.TOP, font=FONT, line_spacing=1.12, margin=0.0):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.auto_size = MSO_AUTO_SIZE.NONE
    tf.margin_left = Inches(margin)
    tf.margin_right = Inches(margin)
    tf.margin_top = Inches(0)
    tf.margin_bottom = Inches(0)
    tf.vertical_anchor = anchor
    p = tf.paragraphs[0]
    p.alignment = align
    p.line_spacing = line_spacing
    r = p.add_run()
    r.text = text
    r.font.name = font
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = color
    return box


def add_paragraphs(slide, items, x, y, w, h, size=15, color=TEXT, bullet_color=BLUE,
                   line_spacing=1.25, space_after=6, bullet="•", font=FONT):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.auto_size = MSO_AUTO_SIZE.NONE
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.line_spacing = line_spacing
        p.space_after = Pt(space_after)
        if bullet:
            rb = p.add_run()
            rb.text = bullet + " "
            rb.font.name = font
            rb.font.size = Pt(size)
            rb.font.bold = True
            rb.font.color.rgb = bullet_color
        r = p.add_run()
        r.text = item
        r.font.name = font
        r.font.size = Pt(size)
        r.font.color.rgb = color
    return box


def add_footer(slide, idx):
    add_text(slide, "基于 Spring Boot 的校园社团成果与孵化系统", 0.6, 7.08, 7.8, 0.25, size=9, color=MUTED)
    add_text(slide, f"{idx:02d} / {TOTAL:02d}", 11.9, 7.06, 0.9, 0.25, size=9, color=MUTED, align=PP_ALIGN.RIGHT)


def add_header(slide, section, title, subtitle=None):
    add_text(slide, section, 0.62, 0.37, 6.2, 0.26, size=9, color=BLUE, bold=True)
    add_text(slide, title, 0.6, 0.67, 11.9, 0.55, size=28, color=TEXT, bold=True)
    add_rect(slide, 0.62, 1.27, 0.62, 0.06, BLUE, line=None, shape=MSO_SHAPE.RECTANGLE)
    if subtitle:
        add_text(slide, subtitle, 0.62, 1.39, 11.6, 0.3, size=13, color=MUTED)
    add_footer(slide, len(prs.slides))


def card(slide, x, y, w, h, title, body, accent=BLUE, number=None, body_size=13, title_size=15):
    add_rect(slide, x, y, w, h, WHITE, BORDER)
    add_rect(slide, x, y, 0.08, h, accent, line=None, shape=MSO_SHAPE.RECTANGLE)
    if number:
        add_text(slide, number, x + 0.22, y + 0.16, 0.5, 0.36, size=20, color=accent, bold=True)
        tx = x + 0.75
        tw = w - 0.95
    else:
        tx = x + 0.28
        tw = w - 0.5
    add_text(slide, title, tx, y + 0.16, tw, 0.36, size=title_size, color=TEXT, bold=True)
    add_text(slide, body, x + 0.28, y + 0.62, w - 0.52, h - 0.72, size=body_size, color=MUTED, line_spacing=1.3)


def chip(slide, text, x, y, w, h=0.42, fill=SOFT_BLUE, color=BLUE, size=12):
    add_rect(slide, x, y, w, h, fill, line=None, radius=True)
    add_text(slide, text, x, y + 0.01, w, h, size=size, color=color, bold=True, align=PP_ALIGN.CENTER,
             anchor=MSO_ANCHOR.MIDDLE)


# ============================================================
# 1. Cover
# ============================================================
s = prs.slides.add_slide(BLANK)
set_bg(s, NAVY)
# decorative rings
for i, (x, y, d) in enumerate([(9.4, -1.1, 4.6), (10.9, 1.2, 3.2), (-1.5, 5.0, 3.8)]):
    ring = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(y), Inches(d), Inches(d))
    ring.fill.background()
    ring.line.color.rgb = RGBColor(0x2E, 0x5B, 0xC9) if i < 2 else RGBColor(0x14, 0xB8, 0xC8)
    ring.line.width = Pt(1.2)
    ring.line.dash_style = MSO_LINE_DASH_STYLE.SOLID

add_text(s, "哈尔滨信息工程学院 · 软件学院", 0.9, 0.72, 7.5, 0.35, size=13, color=RGBColor(0x9D, 0xB8, 0xF0), bold=True)
add_text(s, "毕业设计答辩", 0.9, 1.12, 3.0, 0.32, size=12, color=RGBColor(0x7F, 0x9A, 0xD6))

add_text(s, "基于 Spring Boot 的", 0.9, 2.05, 7.4, 0.62, size=38, color=WHITE, bold=True)
add_text(s, "校园社团成果与孵化系统", 0.9, 2.72, 8.2, 0.72, size=38, color=WHITE, bold=True)
add_rect(s, 0.92, 3.62, 1.55, 0.07, CYAN, line=None, shape=MSO_SHAPE.RECTANGLE)
add_text(s, "成果展示  ·  评审孵化  ·  资源对接  ·  数据可视化", 0.92, 3.82, 8.2, 0.36, size=14, color=RGBColor(0xC9, 0xD8, 0xF5))

# info block
add_rect(s, 0.9, 4.72, 6.9, 1.55, NAVY_2, line=RGBColor(0x2B, 0x46, 0x82))
info = [
    ("答辩人", "王宏民"),
    ("学  号", "2023020621"),
    ("专  业", "计算机科学与技术"),
    ("指导教师", "张娟  副教授"),
]
for i, (k, v) in enumerate(info):
    col = i % 2
    row = i // 2
    x = 1.12 + col * 3.2
    y = 4.93 + row * 0.55
    add_text(s, k, x, y, 0.75, 0.28, size=10, color=RGBColor(0x86, 0xA2, 0xD6))
    add_text(s, v, x + 0.72, y - 0.01, 2.3, 0.3, size=12, color=WHITE, bold=True)

add_text(s, "2027 年 5 月", 10.0, 5.0, 2.3, 0.3, size=12, color=RGBColor(0xB9, 0xCC, 0xEE), align=PP_ALIGN.RIGHT)
add_text(s, "HARBIN INSTITUTE OF INFORMATION TECHNOLOGY", 0.92, 6.78, 8.0, 0.25, size=9, color=RGBColor(0x5E, 0x78, 0xB2))
s.notes_slide.notes_text_frame.text = "各位老师好，我是计算机科学与技术专业2023级王宏民，毕业设计题目是《基于Spring Boot的校园社团成果与孵化系统》，指导教师是张娟副教授。下面从研究背景、研究内容、系统设计、创新点和总结五个方面汇报。"

# ============================================================
# 2. Background
# ============================================================
s = prs.slides.add_slide(BLANK)
set_bg(s)
add_header(s, "01  RESEARCH", "研究背景", "社团成果数量增长，但展示、评审与转化链路仍然割裂")
add_text(s, "三个现实痛点", 0.62, 1.78, 4.0, 0.35, size=15, color=TEXT, bold=True)

pain = [
    ("展示渠道有限", "成果停留在社团内部，缺少统一展示窗口，优秀项目难以被看见。", "01", BLUE),
    ("孵化机制不完善", "评审、评分、孵化各自为战，缺少从成果到项目的持续培育机制。", "02", CYAN),
    ("资源对接不畅", "成果与企业在信息上不对称，学生找不到资源，企业找不到项目。", "03", ORANGE),
]
y = 2.2
for title, body, num, color in pain:
    card(s, 0.62, y, 5.25, 1.2, title, body, color, num, body_size=12)
    y += 1.36

# right insight panel
add_rect(s, 6.25, 1.78, 6.45, 4.55, NAVY, line=None)
add_text(s, "核心矛盾", 6.62, 2.02, 2.2, 0.3, size=12, color=RGBColor(0x8F, 0xB4, 0xF2), bold=True)
add_text(s, "成果有“存量”，\n转化缺“通道”", 6.62, 2.4, 5.6, 1.15, size=30, color=WHITE, bold=True, line_spacing=1.18)
add_text(s, "信息孤岛  ·  评审分散  ·  资源错配", 6.62, 3.62, 5.6, 0.3, size=13, color=RGBColor(0xC9, 0xD8, 0xF5))
add_rect(s, 6.62, 4.12, 5.55, 0.02, RGBColor(0x3A, 0x5A, 0x98), line=None, shape=MSO_SHAPE.RECTANGLE)
add_text(s, "研究目标", 6.62, 4.32, 2.0, 0.28, size=11, color=RGBColor(0x8F, 0xB4, 0xF2), bold=True)
add_text(s, "构建“成果展示—评审孵化—资源对接”\n一体化平台，让成果可展示、可评审、可转化。", 6.62, 4.62, 5.55, 1.25, size=14, color=WHITE, line_spacing=1.35)

add_text(s, "数据来源：论文第 1 章研究背景与第 2 章需求分析", 0.62, 6.55, 6.0, 0.25, size=9, color=MUTED)
s.notes_slide.notes_text_frame.text = "校园社团成果数量在增长，但存在三个痛点：展示渠道有限、孵化机制不完善、资源对接信息不对称。核心矛盾是成果有存量、转化缺通道，因此本课题要构建一体化平台。"

# ============================================================
# 3. Title & significance
# ============================================================
s = prs.slides.add_slide(BLANK)
set_bg(s)
add_header(s, "02  TITLE", "论文题目及意义", "题目聚焦“成果展示 + 评审孵化 + 资源对接”的一体化能力")
# title breakdown
add_rect(s, 0.62, 1.72, 6.0, 1.18, WHITE, BORDER)
add_text(s, "基于 Spring Boot 的", 0.88, 1.88, 5.5, 0.3, size=12, color=MUTED)
add_text(s, "校园社团成果与孵化系统", 0.88, 2.2, 5.5, 0.42, size=21, color=TEXT, bold=True)
add_rect(s, 0.62, 1.72, 0.08, 1.18, BLUE, line=None, shape=MSO_SHAPE.RECTANGLE)

terms = [
    ("Spring Boot", "后端技术底座：RESTful API、分层架构、权限控制"),
    ("校园社团成果", "业务对象：成果上传、展示、互动、评审"),
    ("孵化系统", "业务目标：评审、孵化、资源对接、持续培育"),
]
y = 3.08
for i, (k, v) in enumerate(terms):
    add_text(s, k, 0.88, y, 2.1, 0.3, size=13, color=BLUE, bold=True)
    add_text(s, v, 2.85, y, 3.55, 0.5, size=12, color=MUTED)
    y += 0.62

# significance cards
add_text(s, "研究意义", 6.95, 1.78, 2.0, 0.32, size=15, color=TEXT, bold=True)
sig = [
    ("理论意义", "丰富高校社团信息化与成果转化研究，探索“展示—评审—孵化—对接”的数字化路径。", BLUE),
    ("实践意义", "提升成果可见性、评审规范性和资源对接效率，为社团管理提供可落地的平台方案。", CYAN),
]
y = 2.2
for title, body, color in sig:
    card(s, 6.95, y, 5.75, 1.42, title, body, color, body_size=12)
    y += 1.58

add_rect(s, 6.95, 5.55, 5.75, 0.66, SOFT_BLUE, line=None)
add_text(s, "五大角色：学生 · 教师 · 专家 · 企业 · 管理员", 7.12, 5.68, 5.45, 0.35, size=13, color=BLUE, bold=True, align=PP_ALIGN.CENTER)
s.notes_slide.notes_text_frame.text = "题目可以拆成三个关键词：Spring Boot是技术底座，校园社团成果是业务对象，孵化系统是业务目标。意义分理论和实践两层：理论上补充社团信息化研究，实践上解决展示、评审和资源对接问题。"

# ============================================================
# 4. Research content & technology
# ============================================================
s = prs.slides.add_slide(BLANK)
set_bg(s)
add_header(s, "03  CONTENT", "主要研究内容与技术介绍", "围绕五类角色，构建八个功能模块")
add_text(s, "八个功能模块", 0.62, 1.78, 3.0, 0.32, size=15, color=TEXT, bold=True)
modules = ["用户认证", "成果管理", "展示互动", "评审孵化", "资源对接", "获奖管理", "通知系统", "管理后台"]
for i, m in enumerate(modules):
    col = i % 4
    row = i // 4
    x = 0.62 + col * 1.55
    y = 2.2 + row * 0.7
    add_rect(s, x, y, 1.4, 0.52, WHITE, BORDER)
    add_text(s, f"{i+1:02d}", x + 0.12, y + 0.13, 0.35, 0.25, size=9, color=BLUE, bold=True)
    add_text(s, m, x + 0.42, y + 0.1, 0.95, 0.3, size=11, color=TEXT, bold=True)

# tech stack panel
add_rect(s, 0.62, 3.72, 6.1, 2.55, WHITE, BORDER)
add_text(s, "技术栈", 0.88, 3.9, 2.0, 0.3, size=15, color=TEXT, bold=True)
tech = [
    ("前端", "Vue 3 + Element Plus + ECharts", BLUE),
    ("后端", "Spring Boot + RESTful API", CYAN),
    ("数据", "MySQL + MyBatis", ORANGE),
    ("安全", "Spring Security + JWT", GREEN),
]
for i, (k, v, c) in enumerate(tech):
    y = 4.32 + i * 0.45
    add_rect(s, 0.88, y + 0.05, 0.06, 0.24, c, line=None, shape=MSO_SHAPE.RECTANGLE)
    add_text(s, k, 1.05, y, 0.65, 0.3, size=11, color=MUTED)
    add_text(s, v, 1.7, y, 4.7, 0.3, size=11, color=TEXT, bold=True)

# right architecture mini
add_rect(s, 7.0, 1.78, 5.7, 4.5, NAVY, line=None)
add_text(s, "前后端分离架构", 7.3, 2.02, 4.0, 0.3, size=13, color=WHITE, bold=True)
layers = [
    ("表现层", "Vue 3 SPA / Element Plus", 2.45),
    ("接口层", "RESTful API / JWT 鉴权", 3.15),
    ("业务层", "认证、成果、评审、资源、企业", 3.85),
    ("数据层", "MySQL / MyBatis", 4.55),
]
for label, desc, y in layers:
    add_rect(s, 7.3, y, 5.05, 0.5, NAVY_2, line=RGBColor(0x2B, 0x46, 0x82))
    add_text(s, label, 7.48, y + 0.09, 0.85, 0.28, size=10, color=RGBColor(0x8F, 0xB4, 0xF2), bold=True)
    add_text(s, desc, 8.35, y + 0.09, 3.8, 0.28, size=10, color=WHITE)
add_text(s, "Nginx / Vite 代理：/api → Spring Boot，/uploads → 文件服务", 7.3, 5.62, 5.1, 0.45, size=9, color=RGBColor(0x9D, 0xB8, 0xF0))
add_text(s, "说明：核心业务由 Spring Boot 提供；文件访问与少量历史兼容接口由 Node.js 辅助服务承担。", 0.62, 6.45, 12.1, 0.24, size=8.5, color=MUTED)
s.notes_slide.notes_text_frame.text = "系统围绕五类角色设计八个模块。技术上采用前后端分离：前端Vue3加Element Plus，后端Spring Boot提供REST接口，MySQL做数据存储，MyBatis做持久化，Spring Security加JWT做认证授权；文件访问和少量历史兼容接口由Node.js辅助服务承担。"

# ============================================================
# 5. Requirements & overall design
# ============================================================
s = prs.slides.add_slide(BLANK)
set_bg(s)
add_header(s, "04  REQUIREMENTS", "系统需求与总体设计", "五类角色协同，七个功能域支撑完整业务闭环")
roles = [
    ("学生", "上传成果、浏览互动\n申请资源、查看进度", BLUE),
    ("教师", "成果评分、孵化评分\n通知与获奖管理", CYAN),
    ("专家", "任务评审、多维度评分\n评审历史", ORANGE),
    ("企业", "资源投递、申请审批\n成果浏览、合作对接", GREEN),
    ("管理员", "用户/成果/资源管理\n统计与系统设置", RGBColor(0x8B, 0x5C, 0xF6)),
]
for i, (r, d, c) in enumerate(roles):
    x = 0.62 + i * 2.48
    add_rect(s, x, 1.78, 2.3, 1.3, WHITE, BORDER)
    add_rect(s, x, 1.78, 2.3, 0.06, c, line=None, shape=MSO_SHAPE.RECTANGLE)
    add_text(s, r, x + 0.16, 1.95, 1.0, 0.3, size=14, color=TEXT, bold=True)
    add_text(s, d, x + 0.16, 2.3, 2.0, 0.66, size=10, color=MUTED, line_spacing=1.25)

add_text(s, "七个功能域", 0.62, 3.38, 2.0, 0.3, size=15, color=TEXT, bold=True)
domains = [
    ("可视化", "统计与大屏"), ("交互", "评论/点赞"), ("成果管理", "上传/审核"),
    ("项目孵化", "评分/跟踪"), ("用户管理", "五类角色"), ("通知", "发布/提醒"), ("资源对接", "申请/审批")
]
for i, (h, sub) in enumerate(domains):
    col = i % 4
    row = i // 4
    x = 0.62 + col * 3.05
    y = 3.8 + row * 1.05
    add_rect(s, x, y, 2.85, 0.85, WHITE, BORDER)
    add_text(s, h, x + 0.18, y + 0.12, 1.6, 0.28, size=12, color=TEXT, bold=True)
    add_text(s, sub, x + 0.18, y + 0.46, 2.4, 0.25, size=9, color=MUTED)

add_rect(s, 9.85, 3.38, 2.85, 2.32, SOFT_BLUE, line=None)
add_text(s, "设计原则", 10.05, 3.55, 1.5, 0.3, size=11, color=BLUE, bold=True)
add_text(s, "1  角色分权\n2  流程可追踪\n3  数据可统计\n4  接口可扩展", 10.05, 3.9, 2.45, 1.55, size=11, color=TEXT, line_spacing=1.55)
s.notes_slide.notes_text_frame.text = "需求分析确定了五类角色：学生、教师、专家、企业、管理员；功能域包括可视化、交互、成果管理、项目孵化、用户管理、通知和资源对接七个部分。设计上坚持角色分权、流程可追踪、数据可统计、接口可扩展。"

# ============================================================
# 6. System design - architecture & database
# ============================================================
s = prs.slides.add_slide(BLANK)
set_bg(s)
add_header(s, "05  DESIGN", "系统设计与实现（一）", "分层架构 + 核心数据模型，支撑多角色业务协同")
# architecture diagram
add_text(s, "系统架构", 0.62, 1.75, 1.5, 0.3, size=14, color=TEXT, bold=True)
arch = [
    ("客户端", "Vue 3 + Element Plus\n浏览器 / 管理端 / 企业端", BLUE, 0.62, 2.2, 2.35),
    ("接入层", "Nginx / Vite Proxy\n统一 /api 入口", CYAN, 3.25, 2.2, 2.35),
    ("应用层", "Spring Boot\nController / Service", ORANGE, 5.88, 2.2, 2.35),
    ("数据层", "MySQL\nMyBatis 持久化", GREEN, 8.51, 2.2, 2.35),
]
for label, desc, c, x, y, w in arch:
    add_rect(s, x, y, w, 1.18, WHITE, BORDER)
    add_rect(s, x, y, w, 0.06, c, line=None, shape=MSO_SHAPE.RECTANGLE)
    add_text(s, label, x + 0.15, y + 0.18, 1.0, 0.3, size=12, color=TEXT, bold=True)
    add_text(s, desc, x + 0.15, y + 0.52, w - 0.3, 0.58, size=9, color=MUTED, line_spacing=1.2)
for x in [3.0, 5.63, 8.26]:
    add_text(s, "→", x, 2.62, 0.3, 0.35, size=18, color=BLUE, bold=True, align=PP_ALIGN.CENTER)

add_rect(s, 0.62, 3.72, 7.55, 2.45, WHITE, BORDER)
add_text(s, "核心数据表", 0.88, 3.9, 2.0, 0.3, size=13, color=TEXT, bold=True)
tables = [
    ("用户域", "student_user / teacher_user / expert_user / enterprise_user / admin_user"),
    ("成果域", "achievement / file / comment / likes"),
    ("孵化域", "achievement.score / incubation_status / review_status"),
    ("资源域", "resource / resource_application / resource_expense"),
    ("支撑域", "notification / award / enterprise_account / recharge_record"),
]
for i, (k, v) in enumerate(tables):
    y = 4.3 + i * 0.35
    add_text(s, k, 0.88, y, 0.8, 0.25, size=9, color=BLUE, bold=True)
    add_text(s, v, 1.7, y, 6.2, 0.25, size=8.5, color=MUTED)

# right design points
add_rect(s, 8.4, 3.72, 4.3, 2.45, NAVY, line=None)
add_text(s, "设计要点", 8.65, 3.92, 1.5, 0.3, size=12, color=WHITE, bold=True)
points = ["按角色划分接口权限", "评审状态字段驱动流程", "附件独立表存储", "统计查询与业务表分离"]
for i, p in enumerate(points):
    y = 4.35 + i * 0.42
    add_text(s, "0" + str(i + 1), 8.68, y, 0.35, 0.25, size=9, color=CYAN, bold=True)
    add_text(s, p, 9.1, y, 3.4, 0.28, size=10, color=RGBColor(0xD5, 0xE2, 0xF8))
s.notes_slide.notes_text_frame.text = "系统采用前后端分离的分层架构：客户端、接入层、Spring Boot应用层和MySQL数据层。数据模型按用户域、成果域、孵化域、资源域和支撑域划分，评审状态、附件、申请和资金流水都有独立表支撑。"

# ============================================================
# 7. Core implementation flow
# ============================================================
s = prs.slides.add_slide(BLANK)
set_bg(s)
add_header(s, "05  DESIGN", "系统设计与实现（二）", "从成果上传到资源落地的核心业务闭环")
steps = [
    ("成果上传", "学生提交\n附件与封面"),
    ("教师评分", "阶段评分\n孵化评分"),
    ("专家评审", "多维度评分\n结论与意见"),
    ("资源申请", "双审资格\n校验后申请"),
    ("企业审批", "查看申请\n通过/拒绝"),
    ("孵化跟踪", "状态与\n数据统计"),
]
for i, (h, sub) in enumerate(steps):
    x = 0.62 + i * 2.03
    add_rect(s, x, 1.82, 1.83, 0.92, NAVY if i % 2 == 0 else NAVY_2, line=None)
    add_text(s, f"0{i+1}", x + 0.12, 1.9, 0.35, 0.22, size=8, color=CYAN, bold=True)
    add_text(s, h, x + 0.12, 2.12, 1.55, 0.28, size=12, color=WHITE, bold=True)
    add_text(s, sub, x + 0.12, 2.43, 1.55, 0.35, size=8, color=RGBColor(0xC9, 0xD8, 0xF5), line_spacing=1.1)
    if i < 5:
        add_text(s, "›", x + 1.85, 2.1, 0.2, 0.3, size=18, color=BLUE, bold=True)

impl = [
    ("成果上传", "多文件上传、封面校验、附件分类存储；成果状态进入待审核。", BLUE),
    ("两阶段评分", "教师先评分，再孵化评分；双项达标后自动进入专家评审。", CYAN),
    ("专家评审", "按创新性、完成度、实用性等维度打分，形成评审结论。", ORANGE),
    ("资源对接", "学生满足双审资格后可申请；企业审批并记录资助明细。", GREEN),
]
for i, (h, body, c) in enumerate(impl):
    col = i % 2
    row = i // 2
    x = 0.62 + col * 6.2
    y = 3.28 + row * 1.35
    card(s, x, y, 5.95, 1.12, h, body, c, body_size=10.5, title_size=12)

add_rect(s, 0.62, 6.12, 12.1, 0.52, SOFT_BLUE, line=None)
add_text(s, "关键控制：身份从 JWT 获取，评审状态驱动流程，资源申请前校验“教师评分 + 专家评审”，资金支出与流水同事务。", 0.82, 6.24, 11.7, 0.28, size=10, color=BLUE, bold=True)
s.notes_slide.notes_text_frame.text = "核心流程是成果上传、教师两阶段评分、专家多维评审、资源申请、企业审批和孵化跟踪。关键控制有三点：身份从JWT取，评审状态驱动流程，资源申请前校验双审资格。"

# ============================================================
# 8. Innovation
# ============================================================
s = prs.slides.add_slide(BLANK)
set_bg(s)
add_header(s, "06  INNOVATION", "创新点", "从“功能堆叠”走向“业务闭环 + 多角色协同”")
innov = [
    ("01", "一体化业务闭环", "把成果展示、评审、孵化、资源对接放在同一条链路中，避免系统之间割裂。", BLUE),
    ("02", "两阶段评分 + 多维评审", "教师阶段评分与孵化评分联动，专家按多维度打分，形成可追溯的评审依据。", CYAN),
    ("03", "双审资格的资源对接", "资源申请前校验教师评分与专家评审结果，减少无效申请，提高对接质量。", ORANGE),
    ("04", "多角色数据可视化", "面向学生、教师、管理员提供 KPI、分布、趋势和大屏展示，支撑管理决策。", GREEN),
]
for i, (num, h, body, c) in enumerate(innov):
    col = i % 2
    row = i // 2
    x = 0.62 + col * 6.15
    y = 1.78 + row * 2.18
    add_rect(s, x, y, 5.9, 1.92, WHITE, BORDER)
    add_text(s, num, x + 0.22, y + 0.18, 0.55, 0.4, size=20, color=c, bold=True)
    add_text(s, h, x + 0.85, y + 0.2, 4.65, 0.35, size=15, color=TEXT, bold=True)
    add_text(s, body, x + 0.85, y + 0.65, 4.7, 1.0, size=11, color=MUTED, line_spacing=1.35)
    add_rect(s, x, y, 0.07, 1.92, c, line=None, shape=MSO_SHAPE.RECTANGLE)

add_text(s, "创新定位：不是算法创新，而是业务整合与工程实现创新", 0.62, 6.45, 8.0, 0.3, size=11, color=MUTED)
s.notes_slide.notes_text_frame.text = "创新点总结为四条：第一是一体化业务闭环；第二是两阶段评分加多维度评审；第三是双审资格的资源对接；第四是多角色数据可视化。整体定位是业务整合和工程实现创新，不是算法创新。"

# ============================================================
# 9. Test & results
# ============================================================
s = prs.slides.add_slide(BLANK)
set_bg(s)
add_header(s, "07  TEST", "系统测试与运行效果", "围绕五个核心模块开展功能测试与非功能测试")
rows = [
    ("成果上传", "正常上传、文件类型/大小、缺少参数", "通过"),
    ("资源申请", "资格校验、重复申请、审批流转", "通过"),
    ("用户管理", "五类角色增删改查、权限隔离", "通过"),
    ("成果评价", "教师评分、专家评审、状态流转", "通过"),
    ("成果管理", "列表、详情、删除、数据一致性", "通过"),
]
tbl_shape = s.shapes.add_table(len(rows) + 1, 3, Inches(0.62), Inches(1.8), Inches(7.55), Inches(3.55))
table = tbl_shape.table
table.columns[0].width = Inches(1.45)
table.columns[1].width = Inches(4.85)
table.columns[2].width = Inches(1.25)
table.rows[0].height = Inches(0.48)
for i in range(1, len(rows) + 1):
    table.rows[i].height = Inches(0.46)
headers = ["测试模块", "测试重点", "结果"]
for j, h in enumerate(headers):
    cell = table.cell(0, j)
    cell.text = h
    cell.fill.solid()
    cell.fill.fore_color.rgb = NAVY
    for p in cell.text_frame.paragraphs:
        p.alignment = PP_ALIGN.CENTER
        for r in p.runs:
            r.font.name = FONT
            r.font.size = Pt(10)
            r.font.bold = True
            r.font.color.rgb = WHITE
for i, (a, b, c) in enumerate(rows, start=1):
    for j, v in enumerate([a, b, c]):
        cell = table.cell(i, j)
        cell.text = v
        cell.fill.solid()
        cell.fill.fore_color.rgb = WHITE if i % 2 else SOFT_BLUE
        for p in cell.text_frame.paragraphs:
            p.alignment = PP_ALIGN.CENTER if j != 1 else PP_ALIGN.LEFT
            for r in p.runs:
                r.font.name = FONT
                r.font.size = Pt(9)
                r.font.color.rgb = TEXT if j != 2 else GREEN
                r.font.bold = (j == 2)

# right results
add_rect(s, 8.55, 1.8, 4.15, 1.35, WHITE, BORDER)
add_text(s, "测试结论", 8.78, 1.95, 1.5, 0.28, size=11, color=BLUE, bold=True)
add_text(s, "五个核心模块主流程全部通过；权限、重复提交、越权访问等异常场景可控。", 8.78, 2.28, 3.7, 0.7, size=10, color=MUTED, line_spacing=1.3)

nonfunc = [
    ("性能", "主要接口响应满足校园使用规模"),
    ("安全", "JWT 鉴权、角色隔离、越权拦截"),
    ("兼容", "主流浏览器与常见分辨率"),
    ("可靠", "持续运行稳定，异常可恢复"),
]
for i, (k, v) in enumerate(nonfunc):
    y = 3.4 + i * 0.62
    add_rect(s, 8.55, y, 0.55, 0.42, SOFT_CYAN, line=None)
    add_text(s, k, 8.58, y + 0.08, 0.5, 0.25, size=9, color=CYAN, bold=True, align=PP_ALIGN.CENTER)
    add_text(s, v, 9.2, y + 0.08, 3.45, 0.3, size=9.5, color=TEXT)

add_rect(s, 0.62, 5.72, 12.1, 0.5, SOFT_BLUE, line=None)
add_text(s, "测试方式：黑盒用例 + 接口测试 + 数据库核对 + 异常/权限测试；结论：达到需求规格与设计目标。", 0.82, 5.84, 11.7, 0.26, size=9.5, color=BLUE, bold=True)
s.notes_slide.notes_text_frame.text = "测试围绕五个核心模块：成果上传、资源申请、用户管理、成果评价、成果管理。功能测试全部通过，非功能测试覆盖性能、安全、兼容和可靠性，系统达到需求和设计目标。"

# ============================================================
# 10. Conclusion & thanks
# ============================================================
s = prs.slides.add_slide(BLANK)
set_bg(s)
add_header(s, "08  CONCLUSION", "总结与致谢", "从“成果沉淀”到“成果转化”的一次完整工程实践")
add_text(s, "完成的工作", 0.62, 1.78, 2.0, 0.3, size=14, color=TEXT, bold=True)
done = [
    "构建五类角色、八个模块的前后端分离平台",
    "打通“上传—评审—孵化—资源对接”业务闭环",
    "实现教师两阶段评分、专家多维度评审",
    "完成资源申请审批、企业合作与数据可视化",
]
add_paragraphs(s, done, 0.62, 2.18, 5.9, 1.8, size=11, bullet_color=BLUE, line_spacing=1.5, space_after=4)

add_text(s, "不足与展望", 6.85, 1.78, 2.0, 0.3, size=14, color=TEXT, bold=True)
future = [
    ("不足", "高并发与缓存能力有限；智能推荐、对象存储仍可完善。"),
    ("展望", "引入 Redis 缓存、对象存储与推荐算法，提升性能与匹配精度。"),
]
y = 2.18
for k, v in future:
    add_rect(s, 6.85, y, 5.8, 0.95, WHITE, BORDER)
    add_text(s, k, 7.05, y + 0.14, 0.55, 0.28, size=10, color=BLUE, bold=True)
    add_text(s, v, 7.65, y + 0.14, 4.75, 0.65, size=10, color=MUTED, line_spacing=1.25)
    y += 1.12

add_rect(s, 0.62, 4.35, 12.1, 0.78, SOFT_BLUE, line=None)
add_text(s, "核心价值：让每一份社团成果，都有被看见、被评审、被托举的机会", 0.85, 4.55, 11.6, 0.32, size=13, color=BLUE, bold=True, align=PP_ALIGN.CENTER)

add_rect(s, 0.62, 5.45, 12.1, 0.9, NAVY, line=None)
add_text(s, "感谢张娟老师的悉心指导，感谢学院和各位老师的帮助！", 0.9, 5.65, 11.5, 0.35, size=15, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
add_text(s, "恳请各位老师批评指正", 0.9, 6.02, 11.5, 0.26, size=11, color=RGBColor(0xC9, 0xD8, 0xF5), align=PP_ALIGN.CENTER)

add_text(s, "答辩人：王宏民     2027 年 5 月", 0.62, 6.62, 6.0, 0.28, size=9, color=MUTED)
s.notes_slide.notes_text_frame.text = "最后总结：完成了五类角色、八个模块的一体化平台，打通了成果到资源的闭环；不足是并发、缓存和智能推荐；后续会引入Redis、对象存储和推荐算法。感谢张娟老师的指导，感谢各位老师。"

out = r"D:\BISHE\毕业设计答辩-王宏民.pptx"
prs.save(out)
print("saved:", out)
print("slides:", len(prs.slides))

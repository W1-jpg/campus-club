/**
 * 数据可视化演示数据：让各图表分布更均衡、更接近真实校园场景
 *
 * 生成内容：
 *  - 8 个学院的学生账号（demo_01 ~ demo_08）
 *  - 30 条成果（10 种类型 / 8 个学院 / 不同评分、评审与孵化状态、近 12 个月）
 *  - 16 条获奖记录（5 个等级 / 4 个年度 / 多学院）
 *  - 12 个资源（6 种类型 / 进行中与已结束）
 *  - 18 条资源申请（待审核 / 已通过 / 已拒绝）
 *
 * 用法：node scripts/seed-visualization.mjs
 * 重复执行会先清理上一轮 demo_ 数据，可反复运行。
 */
import mysql from 'mysql2/promise';

const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || '23db',
  charset: 'utf8mb4'
});

const PASSWORD = 'Demo@12345';
const COLLEGES = ['软件学院', '商学院', '艺术学院', '工程学院', '外国语学院', '传媒学院', '设计学院', '经济学院'];
const TYPES = ['软件', '论文', '文创', '发明', '实践', '艺术', '创业', '竞赛', '调查', '其他'];
const LEVELS = ['国家级', '省级', '市级', '校级', '院级'];
const RES_TYPES = ['资金支持', '导师指导', '场地提供', '设备支持', '技术合作', '实习机会'];

const ACH_TITLES = [
  '智慧校园导航小程序', '基于深度学习的垃圾分类系统', '非遗剪纸数字化保护', '校园二手交易平台',
  '便携式空气质量监测仪', '乡村振兴调研报告', '红色文化 VR 展馆', '智能灌溉控制系统',
  '汉服文创品牌设计', '校园心理树洞', '自动驾驶仿真测试', '区块链学历认证',
  '无障碍出行助手', '校园碳积分系统', '方言语音保护', '机器人书法',
  '光伏充电座椅', '图书馆座位预约', '短视频助农', '智能药盒',
  '实验室安全巡检', '城市骑行数据分析', '数字孪生校园', '旧衣回收平台',
  '校园音乐节策划', '红色旅游路线', 'AI 作文批改', '智能垃圾分类箱',
  '校园气象站', '非遗扎染体验'
];
const SCORES = [95, 88, 76, 92, 84, 56, 90, 73, 86, 97, 81, 64, 89, 94, 78, 85, 91, 70, 87, 93, 59, 82, 96, 75, 88, 90, 62, 83, 79, 92];
const REVIEW = [2, 2, 2, 1, 2, 0, 2, 2, 3, 2, 2, 1, 2, 2, 2, 0, 2, 2, 2, 2, 3, 2, 2, 1, 2, 2, 0, 2, 2, 2];
const INCUBATION = [1, 2, 0, 0, 1, 0, 2, 0, 0, 2, 1, 0, 2, 1, 0, 0, 2, 0, 1, 2, 0, 0, 1, 0, 2, 1, 0, 0, 1, 2];

console.log('[1/5] 清理上一轮演示数据...');
const [oldStudents] = await db.query("SELECT id FROM student_user WHERE username LIKE 'demo\\_%'");
const oldIds = oldStudents.map((r) => r.id);
if (oldIds.length) {
  const ph = oldIds.map(() => '?').join(',');
  await db.query(`DELETE FROM resource_application WHERE student_id IN (${ph})`, oldIds);
  await db.query(`DELETE FROM award WHERE student_id IN (${ph})`, oldIds);
  await db.query(`DELETE FROM achievement WHERE student_id IN (${ph})`, oldIds);
  await db.query(`DELETE FROM student_user WHERE id IN (${ph})`, oldIds);
}
await db.query("DELETE FROM resource WHERE provider='示范合作单位'");
await db.query('DELETE f FROM file f LEFT JOIN achievement a ON f.achievement_id=a.id WHERE a.id IS NULL');
await db.query('DELETE c FROM comment c LEFT JOIN achievement a ON c.achievement_id=a.id WHERE a.id IS NULL');
await db.query('DELETE l FROM likes l LEFT JOIN achievement a ON l.achievement_id=a.id WHERE a.id IS NULL');

console.log('[2/5] 创建 8 个学院的学生账号...');
const studentIds = [];
for (let i = 0; i < COLLEGES.length; i++) {
  const username = `demo_${String(i + 1).padStart(2, '0')}`;
  const [r] = await db.query(
    'INSERT INTO student_user (username,password,real_name,phone,email,status,college) VALUES (?,?,?,?,?,1,?)',
    [username, PASSWORD, `演示学生${i + 1}`, `1390000000${i + 1}`, `${username}@example.com`, COLLEGES[i]]
  );
  studentIds.push(r.insertId);
}

console.log('[3/5] 写入 30 条成果...');
for (let i = 0; i < ACH_TITLES.length; i++) {
  const studentIdx = i % studentIds.length;
  const college = COLLEGES[studentIdx];
  const daysAgo = (i * 11) % 330;
  await db.query(
    `INSERT INTO achievement
      (title, type, description, student_id, college, score, incubation_status, review_status, expert_review, view_count, create_time, update_time)
     VALUES (?,?,?,?,?,?,?,?,?,?, DATE_SUB(NOW(), INTERVAL ? DAY), DATE_SUB(NOW(), INTERVAL ? DAY))`,
    [
      ACH_TITLES[i], TYPES[i % TYPES.length],
      `${ACH_TITLES[i]}——面向校园场景的${TYPES[i % TYPES.length]}类成果，已完成需求分析、原型设计与验证。`,
      studentIds[studentIdx], college, SCORES[i], INCUBATION[i], REVIEW[i],
      REVIEW[i] === 2 ? 1 : 0, ((i * 37) % 900) + 40, daysAgo, daysAgo
    ]
  );
}
// 让之前的 E2E 10 条成果也分布到不同学院/孵化阶段，避免演示时单一学院占比过高
await db.query(
  `UPDATE achievement SET
     college = ELT(MOD(id-1, 8)+1, '软件学院','商学院','艺术学院','工程学院','外国语学院','传媒学院','设计学院','经济学院'),
     score = 86 + MOD(id, 11),
     incubation_status = MOD(id, 3)
   WHERE title LIKE 'E2E成果-%'`
);

console.log('[4/5] 写入 16 条获奖、12 个资源...');
const awardTitles = ['互联网+创新创业大赛', '挑战杯课外学术作品竞赛', '大学生广告艺术大赛', '数学建模竞赛', '机器人大赛', '非遗文创设计大赛', '志愿服务项目大赛', '节能减排竞赛'];
for (let i = 0; i < 16; i++) {
  const studentIdx = (i * 3) % studentIds.length;
  const year = 2023 + (i % 4);
  await db.query(
    `INSERT INTO award (title, level, award_time, description, student_id, college, create_time)
     VALUES (?,?,?,?,?,?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
    [
      `${awardTitles[i % awardTitles.length]}（${LEVELS[i % LEVELS.length]}）`,
      LEVELS[i % LEVELS.length],
      `${year}-${String((i % 9) + 1).padStart(2, '0')}-15`,
      '演示获奖记录，用于验证获奖等级、年度与学院分布。',
      studentIds[studentIdx], COLLEGES[studentIdx], (i * 23) % 300
    ]
  );
}

const resourceIds = [];
for (let i = 0; i < 12; i++) {
  const status = i % 5 === 4 ? '已结束' : '进行中';
  const [r] = await db.query(
    `INSERT INTO resource (title, type, provider, description, publish_time, end_time, status, view_count, apply_count, create_time)
     VALUES (?,?,?,?, DATE_SUB(NOW(), INTERVAL ? DAY), DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
    [
      `${['创新创业基金', '一对一导师辅导', '创客空间工位', '3D 打印设备', '校企技术合作', '暑期实习岗位'][i % 6]}（第 ${i + 1} 期）`,
      RES_TYPES[i % RES_TYPES.length], '示范合作单位',
      '面向在校学生的示范资源，支持成果转化与项目孵化。',
      (i * 17) % 240, 30 + i, status, 80 + i * 37, (i * 5) % 9, (i * 17) % 240
    ]
  );
  resourceIds.push(r.insertId);
}

console.log('[5/5] 写入 18 条资源申请...');
const APP_STATUS = ['已通过', '已通过', '待审核', '已拒绝', '已通过', '已通过'];
for (let i = 0; i < 18; i++) {
  const studentIdx = i % studentIds.length;
  await db.query(
    `INSERT INTO resource_application (resource_id, student_id, student_name, student_college, application_time, status)
     VALUES (?,?,?,?, DATE_SUB(NOW(), INTERVAL ? DAY), ?)`,
    [
      resourceIds[i % resourceIds.length], studentIds[studentIdx],
      `演示学生${studentIdx + 1}`, COLLEGES[studentIdx], (i * 19) % 300, APP_STATUS[i % APP_STATUS.length]
    ]
  );
}

const [[summary]] = await db.query(`
  SELECT
    (SELECT COUNT(*) FROM achievement) AS achievements,
    (SELECT COUNT(DISTINCT college) FROM achievement) AS colleges,
    (SELECT COUNT(*) FROM award) AS awards,
    (SELECT COUNT(*) FROM resource) AS resources,
    (SELECT COUNT(*) FROM resource_application) AS applications
`);
console.log('================ 演示数据完成 ================');
console.log(`成果 ${summary.achievements} 条，覆盖 ${summary.colleges} 个学院`);
console.log(`获奖 ${summary.awards} 条，资源 ${summary.resources} 个，申请 ${summary.applications} 条`);
console.log(`演示账号：demo_01 ~ demo_08 / ${PASSWORD}`);
console.log('==============================================');

await db.end();

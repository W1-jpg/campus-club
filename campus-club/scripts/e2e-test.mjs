/**
 * 端到端测试数据脚本：成果上传 → 教师评分 → 孵化评分 → 专家评审 → 资源申请 → 审批通过
 *
 * 用法：
 *   1. 先启动后端（默认 3100 端口）：$env:PORT=3100; node server.js
 *   2. node scripts/e2e-test.mjs
 *
 * 说明：脚本会创建 3 个测试账号和 10 条成果、10 个资源、10 条申请，
 *      重复运行会先清理上一次生成的 E2E 数据。
 */
import mysql from 'mysql2/promise';

const BASE = process.env.E2E_BASE || 'http://localhost:3100';
const PASSWORD = 'E2e@12345';

const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || '23db',
  charset: 'utf8mb4'
});

async function call(path, { method = 'GET', token, json, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (json) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  } else if (form) {
    body = form;
  }
  const res = await fetch(BASE + path, { method, headers, body });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok || (data && data.code && data.code !== 200)) {
    throw new Error(`${method} ${path} -> HTTP ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function login(userType, username) {
  const r = await call(`/api/auth/login/${userType}`, {
    method: 'POST',
    json: { username, password: PASSWORD }
  });
  return r.data.token;
}

const TYPES = ['软件', '论文', '文创', '发明', '实践', '艺术', '创业', '竞赛', '调查', '其他'];

console.log('[1/7] 清理旧 E2E 数据并创建测试账号...');
const [oldStudents] = await db.query("SELECT id FROM student_user WHERE username='e2e_student'");
for (const row of oldStudents) {
  await db.query('DELETE c FROM comment c JOIN achievement a ON c.achievement_id=a.id WHERE a.student_id=?', [row.id]);
  await db.query('DELETE l FROM likes l JOIN achievement a ON l.achievement_id=a.id WHERE a.student_id=?', [row.id]);
  await db.query('DELETE f FROM file f JOIN achievement a ON f.achievement_id=a.id WHERE a.student_id=?', [row.id]);
  await db.query('DELETE FROM achievement WHERE student_id=?', [row.id]);
  await db.query('DELETE FROM resource_application WHERE student_id=?', [row.id]);
}
await db.query("DELETE FROM resource WHERE title LIKE 'E2E资源-%'");
// 清理历史遗留的孤立附件/评论/点赞，避免被新成果“继承”
await db.query('DELETE f FROM file f LEFT JOIN achievement a ON f.achievement_id=a.id WHERE a.id IS NULL');
await db.query('DELETE c FROM comment c LEFT JOIN achievement a ON c.achievement_id=a.id WHERE a.id IS NULL');
await db.query('DELETE l FROM likes l LEFT JOIN achievement a ON l.achievement_id=a.id WHERE a.id IS NULL');
await db.query("DELETE FROM student_user WHERE username='e2e_student'");
await db.query("DELETE FROM teacher_user WHERE username='e2e_teacher'");
await db.query("DELETE FROM expert_user WHERE username='e2e_expert'");

const [stu] = await db.query(
  'INSERT INTO student_user (username,password,real_name,phone,email,status,college) VALUES (?,?,?,?,?,1,?)',
  ['e2e_student', PASSWORD, '端到端测试学生', '13800000001', 'e2e_student@example.com', '软件学院']
);
const [tea] = await db.query(
  'INSERT INTO teacher_user (username,password,real_name,teacher_no,email,status,college) VALUES (?,?,?,?,?,1,?)',
  ['e2e_teacher', PASSWORD, '端到端测试教师', 'E2E-T001', 'e2e_teacher@example.com', '软件学院']
);
await db.query(
  'INSERT INTO expert_user (username,password,real_name,email,field,title,organization,status) VALUES (?,?,?,?,?,?,?,1)',
  ['e2e_expert', PASSWORD, '端到端测试专家', 'e2e_expert@example.com', '软件开发', '教授', 'E2E 评审中心']
);
const studentId = stu.insertId;
const teacherId = tea.insertId;
console.log(`      学生 id=${studentId}，教师 id=${teacherId}，专家 e2e_expert`);

console.log('[2/7] 登录三类账号...');
const studentToken = await login('student', 'e2e_student');
const teacherToken = await login('teacher', 'e2e_teacher');
const expertToken = await login('expert', 'e2e_expert');
console.log('      登录成功，已获取 JWT');

console.log('[3/7] 上传 10 条成果（含附件）...');
for (let i = 1; i <= 10; i++) {
  const form = new FormData();
  form.append('title', `E2E成果-${String(i).padStart(2, '0')}-${TYPES[i - 1]}类作品`);
  form.append('type', TYPES[i - 1]);
  form.append('description', `这是端到端测试的第 ${i} 条成果，用于验证从上传、评分、评审到资源申请审批的完整流程。`);
  form.append('clubFiles', new Blob([`club file ${i}`], { type: 'text/plain' }), `club-${i}.txt`);
  form.append('achievementFiles', new Blob([`achievement file ${i}`], { type: 'text/plain' }), `achievement-${i}.txt`);
  await call('/api/result/upload', { method: 'POST', token: studentToken, form });
}
const my = await call('/api/result/my', { token: studentToken });
const mine = (my.data || []).filter((a) => String(a.title).startsWith('E2E成果-'));
if (mine.length !== 10) throw new Error(`成果数量不符：${mine.length}`);
console.log(`      已上传 ${mine.length} 条，id: ${mine.map((a) => a.id).join(',')}`);

console.log('[4/7] 教师评分 + 孵化评分...');
for (const a of mine) {
  await call(`/api/result/score?achievementId=${a.id}&score=88`, { method: 'POST', token: teacherToken });
  await call(`/api/result/incubation-score?achievementId=${a.id}&score=90`, { method: 'POST', token: teacherToken });
}
console.log('      10 条成果均已评分（88 / 90），已进入专家评审');

console.log('[5/7] 专家评审通过...');
for (const a of mine) {
  await call('/api/result/review-pass', {
    method: 'POST',
    token: expertToken,
    json: { achievementId: a.id, score: 92, comment: 'E2E 测试：成果质量合格，评审通过。' }
  });
}
console.log('      10 条成果评审通过（review_status=2）');

console.log('[6/7] 创建 10 个资源并由学生申请...');
for (let i = 1; i <= 10; i++) {
  await call('/api/resource', {
    method: 'POST',
    token: teacherToken,
    json: {
      title: `E2E资源-${String(i).padStart(2, '0')}`,
      type: ['资金支持', '导师指导', '场地提供', '设备支持'][i % 4],
      provider: 'E2E 测试合作单位',
      description: `第 ${i} 个测试资源，用于验证资源申请与审批流程。`,
      publishTime: '2026-10-20 10:00:00',
      endTime: '2026-12-31 23:59:59',
      status: '进行中'
    }
  });
}
const resList = await call('/api/resource/list', { token: studentToken });
const resources = (resList.data || []).filter((r) => String(r.title).startsWith('E2E资源-'));
if (resources.length !== 10) throw new Error(`资源数量不符：${resources.length}`);
for (const r of resources) {
  await call('/api/resource/apply', { method: 'POST', token: studentToken, json: { resourceId: r.id } });
}
const apps = await call(`/api/resource/applications/student/${studentId}`, { token: studentToken });
const myApps = (apps.data || []).filter((x) => resources.some((r) => r.id === x.resourceId));
console.log(`      已申请 ${myApps.length} 个资源`);

console.log('[7/7] 教师审批通过...');
for (const app of myApps) {
  await call(`/api/resource/applications/${app.id}/status?status=${encodeURIComponent('已通过')}`, { method: 'PUT', token: teacherToken });
}

const [[checkAch]] = await db.query(
  "SELECT COUNT(*) AS n FROM achievement WHERE student_id=? AND title LIKE 'E2E成果-%' AND review_status=2",
  [studentId]
);
const [[checkApp]] = await db.query(
  "SELECT COUNT(*) AS n FROM resource_application WHERE student_id=? AND status='已通过'",
  [studentId]
);
console.log('================ 测试结果 ================');
console.log(`成果总数（评审通过）：${checkAch.n}`);
console.log(`资源申请（已通过）：${checkApp.n}`);
console.log(`学生账号：e2e_student / ${PASSWORD}`);
console.log(`教师账号：e2e_teacher / ${PASSWORD}`);
console.log(`专家账号：e2e_expert / ${PASSWORD}`);
console.log('==========================================');

await db.end();

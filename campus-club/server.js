import express from 'express';
import mysql from 'mysql2';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

// JWT配置
const secretKey = process.env.JWT_SECRET || 'campus-club-secret-key-2026';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// 配置文件上传
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 配置 MySQL 连接
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: '23db'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 处理跨域请求
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
app.use('/uploads', express.static(uploadDir));

// 路由
app.get('/', (req, res) => {
  res.send('Campus Club API Server');
});

// 认证相关接口
app.post('/api/auth/login/student', (req, res) => {
  console.log('接收到学生登录请求:', req.body);
  const { username, password } = req.body;
  
  // 从student_user表中查询学生信息
  const sql = 'SELECT * FROM student_user WHERE username = ? AND password = ? AND (status IS NULL OR status <> 0)';
  db.query(sql, [username, password], (err, result) => {
    if (err) {
      console.error('Error querying student:', err);
      res.json({
        code: 500,
        msg: '数据库查询失败'
      });
      return;
    }
    
    if (result.length === 0) {
      res.json({
        code: 400,
        msg: '用户名或密码错误'
      });
      return;
    }
    
    const student = result[0];
    res.json({
      code: 200,
      msg: '登录成功',
      data: {
        token: `student-token-${student.id}`,
        user: {
          id: student.id,
          username: student.username,
          userType: 'student',
          college: student.college
        }
      }
    });
  });
});

app.post('/api/auth/login/teacher', (req, res) => {
  console.log('接收到教师登录请求:', req.body);
  const { username, password } = req.body;
  
  // 从teacher_user表中查询教师信息
  const sql = 'SELECT * FROM teacher_user WHERE username = ? AND password = ? AND (status IS NULL OR status <> 0)';
  db.query(sql, [username, password], (err, result) => {
    if (err) {
      console.error('Error querying teacher:', err);
      res.json({
        code: 500,
        msg: '数据库查询失败'
      });
      return;
    }
    
    if (result.length === 0) {
      res.json({
        code: 400,
        msg: '用户名或密码错误'
      });
      return;
    }
    
    const teacher = result[0];
    res.json({
      code: 200,
      msg: '登录成功',
      data: {
        token: `teacher-token-${teacher.id}`,
        user: {
          id: teacher.id,
          username: teacher.username,
          userType: 'teacher',
          college: teacher.college
        }
      }
    });
  });
});

app.post('/api/auth/login/admin', (req, res) => {
  console.log('接收到管理员登录请求:', req.body);
  const { username, password } = req.body;
  
  // 从user表中查询管理员信息（user_type='admin'），并带出 admin_user 的注销状态
  const sql = 'SELECT u.*, (SELECT au.status FROM admin_user au WHERE au.username = u.username LIMIT 1) AS au_status FROM user u WHERE u.username = ? AND u.user_type = ?';
  db.query(sql, [username, 'admin'], (err, result) => {
    if (err) {
      console.error('Error querying admin:', err);
      res.json({
        code: 500,
        msg: '数据库查询失败'
      });
      return;
    }
    
    if (result.length === 0) {
      res.json({
        code: 400,
        msg: '用户名或密码错误'
      });
      return;
    }
    
    const admin = result[0];
    if (admin.au_status === 0) {
      res.json({
        code: 400,
        msg: '账号已注销，无法登录'
      });
      return;
    }
    if (password !== admin.password) {
      res.json({
        code: 400,
        msg: '用户名或密码错误'
      });
      return;
    }
    
    // 生成token
    const token = jwt.sign({ id: admin.id, username: admin.username, userType: 'admin' }, secretKey, { expiresIn: '24h' });
    
    res.json({
      code: 200,
      msg: '登录成功',
      data: {
        token,
        adminId: admin.id,
        username: admin.username,
        realName: admin.real_name
      }
    });
  });
});

// ==================== 账号安全：忘记密码 / 注销账号 ====================
// 角色 -> 用户表映射（白名单，避免表名注入）
const AUTH_USER_TABLES = {
  student: 'student_user',
  teacher: 'teacher_user',
  admin: 'admin_user',
  expert: 'expert_user',
  enterprise: 'enterprise_user'
};

// 忘记密码第一步：用户名 + 真实姓名 身份校验
app.post('/api/auth/verify-identity', (req, res) => {
  const { username, userType, realName } = req.body;
  const table = AUTH_USER_TABLES[userType];
  if (!table) { res.json({ code: 400, msg: '角色类型不正确' }); return; }
  if (!username || !realName) { res.json({ code: 400, msg: '缺少必要参数' }); return; }
  db.query(`SELECT id FROM ${table} WHERE username = ? AND real_name = ? LIMIT 1`, [username, realName], (err, rows) => {
    if (err) { console.error('身份校验失败:', err); res.json({ code: 500, msg: '身份校验失败' }); return; }
    if (!rows.length) { res.json({ code: 400, msg: '用户名与真实姓名不匹配' }); return; }
    res.json({ code: 200, msg: '身份验证通过' });
  });
});

// 忘记密码第二步：重置密码
app.post('/api/auth/reset-password', (req, res) => {
  const { username, userType, realName, newPassword } = req.body;
  const table = AUTH_USER_TABLES[userType];
  if (!table) { res.json({ code: 400, msg: '角色类型不正确' }); return; }
  if (!username || !realName || !newPassword) { res.json({ code: 400, msg: '缺少必要参数' }); return; }
  if (String(newPassword).length < 3) { res.json({ code: 400, msg: '密码至少 3 位' }); return; }
  db.query(`SELECT id FROM ${table} WHERE username = ? AND real_name = ? LIMIT 1`, [username, realName], (err, rows) => {
    if (err) { console.error('重置密码失败:', err); res.json({ code: 500, msg: '重置密码失败' }); return; }
    if (!rows.length) { res.json({ code: 400, msg: '身份信息不匹配' }); return; }
    db.query(`UPDATE ${table} SET password = ? WHERE id = ?`, [newPassword, rows[0].id], (err2) => {
      if (err2) { console.error('重置密码失败:', err2); res.json({ code: 500, msg: '重置密码失败' }); return; }
      // 兼容历史数据：管理员登录读取 user 表，需同步新密码
      if (userType === 'admin') {
        db.query('UPDATE user SET password = ? WHERE username = ? AND user_type = ?', [newPassword, username, 'admin'], () => {});
      }
      res.json({ code: 200, msg: '密码重置成功' });
    });
  });
});

// 注销账号：软删除（status=0）。直接删行会被 award 等外键约束拦住，也便于误操作恢复
const deleteAccount = (userType, username, res) => {
  const table = AUTH_USER_TABLES[userType];
  if (!table) { res.json({ code: 400, msg: '角色类型不正确' }); return; }
  if (!username) { res.json({ code: 400, msg: '缺少必要参数' }); return; }
  db.query(`UPDATE ${table} SET status = 0 WHERE username = ?`, [username], (err, result) => {
    if (err) { console.error('注销账号失败:', err); res.json({ code: 500, msg: '注销失败' }); return; }
    if (!result.affectedRows) { res.json({ code: 400, msg: '账号不存在' }); return; }
    res.json({ code: 200, msg: '账号已注销' });
  });
};

app.post('/api/auth/delete/:userType', (req, res) => {
  deleteAccount(req.params.userType, req.body.username, res);
});
app.post('/api/auth/delete', (req, res) => {
  deleteAccount(req.body.userType, req.body.username, res);
});

// 注册相关接口
app.post('/api/auth/register/student', (req, res) => {
  console.log('接收到学生注册请求:', req.body);
  const { username, password, realName, college, phone, email } = req.body;
  
  // 检查必要参数
  if (!username || !password || !realName) {
    res.json({
      code: 400,
      msg: '缺少必要参数'
    });
    return;
  }
  
  // 检查用户名是否已存在
  const checkSql = 'SELECT * FROM student_user WHERE username = ?';
  db.query(checkSql, [username], (err, result) => {
    if (err) {
      console.error('Error checking username:', err);
      res.json({
        code: 500,
        msg: '数据库查询失败'
      });
      return;
    }
    
    if (result.length > 0) {
      res.json({
        code: 400,
        msg: '用户名已存在'
      });
      return;
    }
    
    // 插入新学生
    const studentSql = 'INSERT INTO student_user (username, password, real_name, phone, email, college) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(studentSql, [username, password, realName, phone || '', email || '', college || ''], (err, studentResult) => {
      if (err) {
        console.error('Error inserting student:', err);
        res.json({
          code: 500,
          msg: '学生注册失败'
        });
        return;
      }
      
      const studentId = studentResult.insertId;
      
      res.json({
        code: 200,
        msg: '注册成功',
        data: {
          token: `student-token-${studentId}`,
          user: {
            id: studentId,
            username: username,
            userType: 'student',
            college: college
          }
        }
      });
    });
  });
});

app.post('/api/auth/register/teacher', (req, res) => {
  console.log('接收到教师注册请求:', req.body);
  const { username, password, realName, college, email, teacherNo } = req.body;
  
  // 检查必要参数
  if (!username || !password || !realName) {
    res.json({
      code: 400,
      msg: '缺少必要参数'
    });
    return;
  }
  
  // 检查用户名是否已存在
  const checkSql = 'SELECT * FROM teacher_user WHERE username = ?';
  db.query(checkSql, [username], (err, result) => {
    if (err) {
      console.error('Error checking username:', err);
      res.json({
        code: 500,
        msg: '数据库查询失败'
      });
      return;
    }
    
    if (result.length > 0) {
      res.json({
        code: 400,
        msg: '用户名已存在'
      });
      return;
    }
    
    // 检查教师编号是否已存在
    if (teacherNo) {
      const checkTeacherNoSql = 'SELECT * FROM teacher_user WHERE teacher_no = ?';
      db.query(checkTeacherNoSql, [teacherNo], (err, teacherNoResult) => {
        if (err) {
          console.error('Error checking teacher_no:', err);
          res.json({
            code: 500,
            msg: '数据库查询失败'
          });
          return;
        }
        
        if (teacherNoResult.length > 0) {
          res.json({
            code: 400,
            msg: '教师编号已存在'
          });
          return;
        }
        
        // 插入新教师
        const teacherSql = 'INSERT INTO teacher_user (username, password, real_name, teacher_no, email, college) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(teacherSql, [username, password, realName, teacherNo, email || '', college || ''], (err, teacherResult) => {
          if (err) {
            console.error('Error inserting teacher:', err);
            res.json({
              code: 500,
              msg: '教师注册失败'
            });
            return;
          }
          
          const teacherId = teacherResult.insertId;
          
          res.json({
            code: 200,
            msg: '注册成功',
            data: {
              token: `teacher-token-${teacherId}`,
              user: {
                id: teacherId,
                username: username,
                userType: 'teacher',
                college: college
              }
            }
          });
        });
      });
    } else {
      // 插入新教师（无教师编号）
      const teacherSql = 'INSERT INTO teacher_user (username, password, real_name, email, college) VALUES (?, ?, ?, ?, ?)';
      db.query(teacherSql, [username, password, realName, email || '', college || ''], (err, teacherResult) => {
        if (err) {
          console.error('Error inserting teacher:', err);
          res.json({
            code: 500,
            msg: '教师注册失败'
          });
          return;
        }
        
        const teacherId = teacherResult.insertId;
        
        res.json({
          code: 200,
          msg: '注册成功',
          data: {
            token: `teacher-token-${teacherId}`,
            user: {
              id: teacherId,
              username: username,
              userType: 'teacher',
              college: college
            }
          }
        });
      });
    }
  });
});

app.post('/api/auth/register/admin', (req, res) => {
  console.log('接收到管理员注册请求:', req.body);
  const { username, password, realName } = req.body;
  
  // 检查必要参数
  if (!username || !password || !realName) {
    res.json({
      code: 400,
      msg: '缺少必要参数'
    });
    return;
  }
  
  // 检查用户名是否已存在
  const checkSql = 'SELECT * FROM user WHERE username = ?';
  db.query(checkSql, [username], (err, result) => {
    if (err) {
      console.error('Error checking username:', err);
      res.json({
        code: 500,
        msg: '数据库查询失败'
      });
      return;
    }
    
    if (result.length > 0) {
      res.json({
        code: 400,
        msg: '用户名已存在'
      });
      return;
    }
    
    // 插入新用户
    const userSql = 'INSERT INTO user (username, password, user_type, college) VALUES (?, ?, ?, ?)';
    db.query(userSql, [username, password, 'admin', 'Computer Science'], (err, userResult) => {
      if (err) {
        console.error('Error inserting user:', err);
        res.json({
          code: 500,
          msg: '用户注册失败'
        });
        return;
      }
      
      const userId = userResult.insertId;
      
      res.json({
        code: 200,
        msg: '注册成功',
        data: {
          token: `admin-token-${userId}`,
          user: {
            id: userId,
            username: username,
            userType: 'admin',
            college: 'Computer Science'
          }
        }
      });
    });
  });
});

// ==================== 专家/企业 登录注册 ====================

// 确保专家和企业用户表存在
db.query(`CREATE TABLE IF NOT EXISTS expert_user (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  real_name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(50),
  field VARCHAR(100),
  title VARCHAR(100),
  organization VARCHAR(200),
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => { if (err) console.error('创建 expert_user 表失败:', err); });
db.query(`ALTER TABLE expert_user ADD COLUMN phone VARCHAR(50)`, (err) => { /* 忽略已存在 */ });

db.query(`CREATE TABLE IF NOT EXISTS enterprise_user (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  real_name VARCHAR(100),
  email VARCHAR(100),
  company_name VARCHAR(200),
  industry VARCHAR(100),
  address VARCHAR(200),
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => { if (err) console.error('创建 enterprise_user 表失败:', err); });

// 专家登录
app.post('/api/auth/login/expert', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) { res.json({ code: 400, msg: '请输入用户名和密码' }); return; }
  db.query('SELECT * FROM expert_user WHERE username = ? AND password = ? AND (status IS NULL OR status <> 0)', [username, password], (err, result) => {
    if (err) { res.json({ code: 500, msg: '数据库查询失败' }); return; }
    if (result.length === 0) { res.json({ code: 400, msg: '用户名或密码错误' }); return; }
    const user = result[0];
    res.json({ code: 200, data: { token: `expert-token-${user.id}`, user: { id: user.id, username: user.username, realName: user.real_name, email: user.email, field: user.field, title: user.title, organization: user.organization, userType: 'expert' } } });
  });
});

// 企业登录
app.post('/api/auth/login/enterprise', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) { res.json({ code: 400, msg: '请输入用户名和密码' }); return; }
  db.query('SELECT * FROM enterprise_user WHERE username = ? AND password = ? AND (status IS NULL OR status <> 0)', [username, password], (err, result) => {
    if (err) { res.json({ code: 500, msg: '数据库查询失败' }); return; }
    if (result.length === 0) { res.json({ code: 400, msg: '用户名或密码错误' }); return; }
    const user = result[0];
    res.json({ code: 200, data: { token: `enterprise-token-${user.id}`, user: { id: user.id, username: user.username, realName: user.real_name, email: user.email, companyName: user.company_name, industry: user.industry, address: user.address, userType: 'enterprise' } } });
  });
});

// 专家注册
app.post('/api/auth/register/expert', (req, res) => {
  const { username, password, confirmPassword, realName, email, field, title, organization } = req.body;
  if (!username || !password || !realName || !email) { res.json({ code: 400, msg: '缺少必要参数' }); return; }
  if (password !== confirmPassword) { res.json({ code: 400, msg: '两次密码不一致' }); return; }
  db.query('SELECT id FROM expert_user WHERE username = ?', [username], (err, result) => {
    if (err) { res.json({ code: 500, msg: '数据库查询失败' }); return; }
    if (result.length > 0) { res.json({ code: 400, msg: '用户名已存在' }); return; }
    db.query('INSERT INTO expert_user (username, password, real_name, email, field, title, organization) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, password, realName, email || '', field || '', title || '', organization || ''], (err, insertResult) => {
        if (err) { res.json({ code: 500, msg: '注册失败' }); return; }
        const userId = insertResult.insertId;
        res.json({ code: 200, msg: '注册成功', data: { token: `expert-token-${userId}`, user: { id: userId, username, userType: 'expert' } } });
      });
  });
});

// 企业注册
app.post('/api/auth/register/enterprise', (req, res) => {
  const { username, password, confirmPassword, realName, email, companyName, industry, address } = req.body;
  if (!username || !password || !realName || !email || !companyName) { res.json({ code: 400, msg: '缺少必要参数' }); return; }
  if (password !== confirmPassword) { res.json({ code: 400, msg: '两次密码不一致' }); return; }
  db.query('SELECT id FROM enterprise_user WHERE username = ?', [username], (err, result) => {
    if (err) { res.json({ code: 500, msg: '数据库查询失败' }); return; }
    if (result.length > 0) { res.json({ code: 400, msg: '用户名已存在' }); return; }
    db.query('INSERT INTO enterprise_user (username, password, real_name, email, company_name, industry, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, password, realName, email || '', companyName, industry || '', address || ''], (err, insertResult) => {
        if (err) { res.json({ code: 500, msg: '注册失败' }); return; }
        const userId = insertResult.insertId;
        res.json({ code: 200, msg: '注册成功', data: { token: `enterprise-token-${userId}`, user: { id: userId, username, userType: 'enterprise' } } });
      });
  });
});

// 上传成果
app.post('/api/result/upload', upload.fields([{ name: 'clubFiles', maxCount: 10 }, { name: 'achievementFiles', maxCount: 10 }]), (req, res) => {
  console.log('接收到上传请求');
  console.log('请求体:', req.body);
  console.log('上传的社团文件:', req.files.clubFiles);
  console.log('上传的成果文件:', req.files.achievementFiles);
  
  const { title, type, description, studentId, college } = req.body;
  const clubFiles = req.files.clubFiles || [];
  const achievementFiles = req.files.achievementFiles || [];

  if (!title || !type || !studentId) {
    console.error('缺少必要参数');
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }

  // 插入成果
  const achievementSql = 'INSERT INTO achievement (title, description, type, student_id) VALUES (?, ?, ?, ?)';
  db.query(achievementSql, [title, description, type, studentId], (err, result) => {
    if (err) {
      console.error('Error inserting achievement:', err);
      res.status(500).json({ code: 500, msg: '上传失败' });
      return;
    }

    const achievementId = result.insertId;
    console.log('成果插入成功，ID:', achievementId);

    // 插入社团文件
    if (clubFiles.length > 0) {
      clubFiles.forEach(file => {
        // 确保文件名是UTF-8编码
        const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const fileSql = 'INSERT INTO file (achievement_id, file_name, file_path, file_size, file_type, file_category) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(fileSql, [achievementId, fileName, file.path, file.size, file.mimetype, 'club'], (err) => {
          if (err) {
            console.error('Error inserting club file:', err);
          } else {
            console.log('社团文件插入成功:', fileName);
          }
        });
      });
    }

    // 插入成果文件
    if (achievementFiles.length > 0) {
      achievementFiles.forEach(file => {
        // 确保文件名是UTF-8编码
        const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const fileSql = 'INSERT INTO file (achievement_id, file_name, file_path, file_size, file_type, file_category) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(fileSql, [achievementId, fileName, file.path, file.size, file.mimetype, 'achievement'], (err) => {
          if (err) {
            console.error('Error inserting achievement file:', err);
          } else {
            console.log('成果文件插入成功:', fileName);
          }
        });
      });
    }

    res.json({ code: 200, msg: '上传成功' });
  });
});

// 获取成果详情（含浏览量、点赞数、评论数、点赞状态、学生姓名）
app.get('/api/result/detail/:id', (req, res) => {
  console.log('接收到获取成果详情请求，ID:', req.params.id, 'userId:', req.query.userId, 'userType:', req.query.userType);
  const { id } = req.params;
  const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;
  const userType = req.query.userType || '';

  // 获取成果信息
  const achievementSql = 'SELECT * FROM achievement WHERE id = ?';
  db.query(achievementSql, [id], (err, achievementResult) => {
    if (err) {
      console.error('Error getting achievement:', err);
      res.status(500).json({ code: 500, msg: '获取成果详情失败' });
      return;
    }

    if (achievementResult.length === 0) {
      res.status(404).json({ code: 404, msg: '成果不存在' });
      return;
    }

    const achievement = achievementResult[0];
    console.log('获取到成果信息:', achievement);

    // 获取文件信息
    const fileSql = 'SELECT * FROM file WHERE achievement_id = ?';
    db.query(fileSql, [id], (err, fileResult) => {
      if (err) {
        console.error('Error getting files:', err);
        res.status(500).json({ code: 500, msg: '获取文件信息失败' });
        return;
      }

      console.log('获取到文件信息:', fileResult);
      // 处理文件路径，区分不同类型的文件
      const clubFiles = [];
      const achievementFiles = [];
      
      fileResult.forEach(file => {
        const fileInfo = {
          id: file.id,
          name: file.file_name,
          url: `http://localhost:${port}/uploads/${path.basename(file.file_path)}`,
          size: file.file_size,
          type: file.file_type,
          createTime: file.create_time
        };
        
        if (file.file_category === 'club') {
          clubFiles.push(fileInfo);
        } else {
          achievementFiles.push(fileInfo);
        }
      });

      console.log('处理后的社团文件信息:', clubFiles);
      console.log('处理后的成果文件信息:', achievementFiles);

      // 组装完整详情：学生姓名、浏览量、点赞数、点赞状态、评论列表
      const buildDetail = async () => {
        const viewCount = achievement.view_count || 0;
        const [stuRows, likeRows, commentRows] = await Promise.all([
          new Promise((resolve) => db.query('SELECT real_name FROM student_user WHERE id = ?', [achievement.student_id], (e, r) => resolve(r || []))),
          new Promise((resolve) => db.query('SELECT COUNT(*) AS cnt FROM likes WHERE achievement_id = ?', [id], (e, r) => resolve(r))),
          new Promise((resolve) => db.query('SELECT * FROM comment WHERE achievement_id = ? ORDER BY create_time DESC', [id], (e, r) => resolve(r || [])))
        ]);
        const likeCount = likeRows?.[0]?.cnt || 0;
        const comments = commentRows.map(c => ({ id: c.id, achievementId: c.achievement_id, userId: c.user_id, userType: c.user_type, content: c.content, createTime: c.create_time }));
        let isLiked = false;
        if (userId) {
          const likedRows = await new Promise((resolve) => db.query('SELECT COUNT(*) AS cnt FROM likes WHERE achievement_id = ? AND user_id = ? AND user_type = ?', [id, userId, userType], (e, r) => resolve(r)));
          isLiked = (likedRows?.[0]?.cnt || 0) > 0;
        }
        res.json({
          code: 200,
          data: {
            ...achievement,
            viewCount,
            college: achievement.college || '',
            studentName: stuRows?.[0]?.real_name || '',
            likeCount,
            commentCount: comments.length,
            isLiked,
            comments,
            clubFiles,
            achievementFiles
          }
        });
      };
      buildDetail().catch((err) => { console.error('组装成果详情失败:', err); res.status(500).json({ code: 500, msg: '获取成果详情失败' }); });
    });
  });
});

// 获取我的成果
app.get('/api/result/my', (req, res) => {
  const { studentId } = req.query;

  const sql = 'SELECT * FROM achievement WHERE student_id = ?';
  db.query(sql, [studentId], (err, result) => {
    if (err) {
      console.error('Error getting my achievements:', err);
      res.status(500).json({ code: 500, msg: '获取成果失败' });
      return;
    }

    // 转换字段名，将下划线命名法转换为驼峰命名法
    const transformedResult = result.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      description: item.description,
      studentId: item.student_id,
      filePath: item.file_path,
      fileName: item.file_name,
      createTime: item.create_time,
      updateTime: item.update_time,
      status: item.status,
      college: item.college,
      score: item.score,
      incubationStatus: item.incubation_status,
      reviewStatus: item.review_status,
      reviewProgress: item.review_progress,
      incubationScore: item.incubation_score,
      expertReview: item.expert_review,
      rejectReason: item.reject_reason
    }));

    res.json({ code: 200, data: transformedResult });
  });
});

// 获取孵化项目详情
app.get('/api/incubation/detail/:id', (req, res) => {
  console.log('接收到获取孵化项目详情请求，ID:', req.params.id);
  const { id } = req.params;

  // 获取成果信息
  const achievementSql = 'SELECT * FROM achievement WHERE id = ?';
  db.query(achievementSql, [id], (err, achievementResult) => {
    if (err) {
      console.error('Error getting achievement:', err);
      res.status(500).json({ code: 500, msg: '获取孵化项目详情失败' });
      return;
    }

    if (achievementResult.length === 0) {
      res.status(404).json({ code: 404, msg: '孵化项目不存在' });
      return;
    }

    const achievement = achievementResult[0];
    console.log('获取到孵化项目信息:', achievement);

    // 获取文件信息
    const fileSql = 'SELECT * FROM file WHERE achievement_id = ? AND file_category = ?';
    db.query(fileSql, [id, 'achievement'], (err, fileResult) => {
      if (err) {
        console.error('Error getting files:', err);
        res.status(500).json({ code: 500, msg: '获取文件信息失败' });
        return;
      }

      console.log('获取到成果文件信息:', fileResult);
      // 处理文件路径
      const achievementFiles = fileResult.map(file => ({
        id: file.id,
        name: file.file_name,
        url: `http://localhost:${port}/uploads/${path.basename(file.file_path)}`,
        size: file.file_size,
        type: file.file_type,
        createTime: file.create_time
      }));

      console.log('处理后的成果文件信息:', achievementFiles);
      res.json({
        code: 200,
        data: {
          ...achievement,
          achievementFiles: achievementFiles
        }
      });
    });
  });
});

// 获取成果列表（用于教师端评分和孵化）
app.get('/api/result/list', (req, res) => {
  console.log('接收到获取成果列表请求:', req.query);
  const { userId, userType, college } = req.query;

  // 获取所有成果
  const achievementSql = 'SELECT * FROM achievement';
  db.query(achievementSql, (err, achievementResult) => {
    if (err) {
      console.error('Error getting achievements:', err);
      res.status(500).json({ code: 500, msg: '获取成果列表失败' });
      return;
    }

    console.log('获取到成果列表:', achievementResult);

    // 处理每个成果的文件信息
    const processAchievements = async () => {
      const achievementsWithFiles = [];

      for (const achievement of achievementResult) {
        // 获取文件信息
        const fileSql = 'SELECT * FROM file WHERE achievement_id = ?';
        const files = await new Promise((resolve, reject) => {
          db.query(fileSql, [achievement.id], (err, fileResult) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(fileResult);
          });
        });

        // 分类文件
        const clubFiles = [];
        const achievementFiles = [];
        
        files.forEach(file => {
          const fileInfo = {
            id: file.id,
            name: file.file_name,
            url: `http://localhost:${port}/uploads/${path.basename(file.file_path)}`,
            size: file.file_size,
            type: file.file_type,
            createTime: file.create_time
          };
          
          if (file.file_category === 'club') {
            clubFiles.push(fileInfo);
          } else {
            achievementFiles.push(fileInfo);
          }
        });

        // 转换字段名，将下划线命名法转换为驼峰命名法
        const transformedAchievement = {
          id: achievement.id,
          title: achievement.title,
          type: achievement.type,
          description: achievement.description,
          studentId: achievement.student_id,
          filePath: achievement.file_path,
          fileName: achievement.file_name,
          createTime: achievement.create_time,
          updateTime: achievement.update_time,
          status: achievement.status,
          college: achievement.college,
          score: achievement.score,
          incubationStatus: achievement.incubation_status,
          reviewStatus: achievement.review_status,
          reviewProgress: achievement.review_progress,
          incubationScore: achievement.incubation_score,
          expertReview: achievement.expert_review,
          rejectReason: achievement.reject_reason,
          clubFiles: clubFiles,
          achievementFiles: achievementFiles
        };
        
        // 添加文件信息到成果对象
        achievementsWithFiles.push(transformedAchievement);
      }

      console.log('处理后的成果列表:', achievementsWithFiles);
      res.json({
        code: 200,
        data: achievementsWithFiles
      });
    };

    processAchievements().catch(err => {
      console.error('Error processing achievements:', err);
      res.status(500).json({ code: 500, msg: '获取成果列表失败' });
    });
  });
});

// ==================== 成果浏览（学生端/教师端）接口支持 ====================

// 确保成果表有 view_count 列，并确保 comment/点赞表存在
db.query(`ALTER TABLE achievement ADD COLUMN view_count INT DEFAULT 0`, (err) => {});
db.query(`CREATE TABLE IF NOT EXISTS comment (
  id INT PRIMARY KEY AUTO_INCREMENT,
  achievement_id INT NOT NULL,
  user_id INT,
  user_type VARCHAR(20),
  content TEXT,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => { if (err) console.error('创建 comment 表失败:', err); });
db.query(`CREATE TABLE IF NOT EXISTS likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  achievement_id INT NOT NULL,
  user_id INT,
  user_type VARCHAR(20),
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_like (achievement_id, user_id, user_type)
)`, (err) => { if (err) console.error('创建 likes 表失败:', err); });

// 成果浏览列表：仅展示已审核通过 (review_status=2) 的成果，按创建时间倒序、分页返回
app.get('/api/result/browse', (req, res) => {
  console.log('接收到成果浏览列表请求:', req.query);
  const { userId, userType, college, type = '', search = '' } = req.query;
  const pageNum = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const pageSize = Math.max(parseInt(req.query.size, 10) || 9, 1);

  let where = " WHERE a.review_status = 2"; // 已审核通过
  const params = [];
  if (userType === 'teacher' && college) { where += ' AND a.college = ?'; params.push(college); }
  if (type) { where += ' AND a.type = ?'; params.push(type); }
  if (search) { where += ' AND (a.title LIKE ? OR a.type LIKE ?)'; params.push('%' + search + '%', '%' + search + '%'); }

  const countSql = 'SELECT COUNT(*) AS cnt FROM achievement a' + where;
  db.query(countSql, params, (e1, cntResult) => {
    if (e1) { console.error('统计成果数量失败:', e1); res.status(500).json({ code: 500, msg: '获取成果列表失败' }); return; }
    const total = cntResult?.[0]?.cnt || 0;
    const offset = (pageNum - 1) * pageSize;

    const isLikedSelect = userId
      ? ', EXISTS(SELECT 1 FROM likes lk WHERE lk.achievement_id = a.id AND lk.user_id = ? AND lk.user_type = ?) AS isLiked'
      : ', 0 AS isLiked';
    const isLikedParams = userId ? [userId, userType] : [];

    const sql = `SELECT a.id, a.title, a.type, a.description, a.student_id AS studentId,
      a.college, a.create_time AS createTime, a.update_time AS updateTime, a.status,
      a.score, a.incubation_status AS incubationStatus, a.review_status AS reviewStatus,
      a.view_count AS viewCount,
      s.real_name AS studentName,
      (SELECT COUNT(*) FROM likes lk2 WHERE lk2.achievement_id = a.id) AS likeCount,
      (SELECT COUNT(*) FROM comment cm WHERE cm.achievement_id = a.id) AS commentCount
      ${isLikedSelect}
      FROM achievement a
      LEFT JOIN student_user s ON a.student_id = s.id
      ${where} ORDER BY a.create_time DESC LIMIT ? OFFSET ?`;

    const sqlParams = [...isLikedParams, ...params, pageSize, offset];
    db.query(sql, sqlParams, (e2, rows) => {
      if (e2) { console.error('获取成果浏览列表失败:', e2); res.status(500).json({ code: 500, msg: '获取成果列表失败' }); return; }
      const list = (rows || []).map(r => ({ ...r, isLiked: r.isLiked === true || r.isLiked === 1 }));
      res.json({ code: 200, data: { list, total, page: pageNum, size: pageSize } });
    });
  });
});

// 浏览量累加
app.post('/api/result/view/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'UPDATE achievement SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?';
  db.query(sql, [id], (err) => {
    if (err) { console.error('累加浏览量失败:', err); res.status(500).json({ code: 500, msg: '操作失败' }); return; }
    res.json({ code: 200, msg: '浏览成功' });
  });
});

// 点赞
app.post('/api/result/like', (req, res) => {
  const { achievementId, userId, userType } = req.query;
  if (!achievementId || !userId || !userType) { res.status(400).json({ code: 400, msg: '缺少参数' }); return; }
  db.query('SELECT id FROM likes WHERE achievement_id = ? AND user_id = ? AND user_type = ?', [achievementId, userId, userType], (err, result) => {
    if (err) { console.error('点赞查询失败:', err); res.status(500).json({ code: 500, msg: '操作失败' }); return; }
    if (result.length > 0) { res.json({ code: 200, msg: '已点赞' }); return; }
    db.query('INSERT INTO likes (achievement_id, user_id, user_type) VALUES (?, ?, ?)', [achievementId, userId, userType], (e) => {
      if (e) { console.error('点赞失败:', e); res.status(500).json({ code: 500, msg: '操作失败' }); return; }
      res.json({ code: 200, msg: '点赞成功' });
    });
  });
});

// 取消点赞
app.post('/api/result/unlike', (req, res) => {
  const { achievementId, userId, userType } = req.query;
  if (!achievementId || !userId || !userType) { res.status(400).json({ code: 400, msg: '缺少参数' }); return; }
  db.query('DELETE FROM likes WHERE achievement_id = ? AND user_id = ? AND user_type = ?', [achievementId, userId, userType], (err) => {
    if (err) { console.error('取消点赞失败:', err); res.status(500).json({ code: 500, msg: '操作失败' }); return; }
    res.json({ code: 200, msg: '已取消点赞' });
  });
});

// 发表评论
app.post('/api/result/comment', (req, res) => {
  const { achievementId, userId, userType, content } = req.body || {};
  if (!achievementId || !content) { res.status(400).json({ code: 400, msg: '缺少参数' }); return; }
  db.query('INSERT INTO comment (achievement_id, user_id, user_type, content) VALUES (?, ?, ?, ?)', [achievementId, userId || null, userType || '', content], (err) => {
    if (err) { console.error('发表评论失败:', err); res.status(500).json({ code: 500, msg: '评论失败' }); return; }
    res.json({ code: 200, msg: '评论成功' });
  });
});

// 第一阶段评分（成果评分）
app.post('/api/result/score', (req, res) => {
  console.log('接收到第一阶段评分请求:', req.query);
  const { achievementId, score } = req.query;

  if (!achievementId || !score) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }

  // 更新第一阶段评分
  const scoreSql = 'UPDATE achievement SET score = ? WHERE id = ?';
  db.query(scoreSql, [score, achievementId], (err, result) => {
    if (err) {
      console.error('Error updating score:', err);
      res.status(500).json({ code: 500, msg: '评分失败' });
      return;
    }

    res.json({ code: 200, msg: '第一阶段评分成功' });
  });
});

// 第二阶段评分（成果孵化）
app.post('/api/result/incubation-score', (req, res) => {
  console.log('接收到第二阶段评分请求:', req.query);
  const { achievementId, score } = req.query;

  if (!achievementId || !score) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }

  // 更新第二阶段评分
  const scoreSql = 'UPDATE achievement SET incubation_score = ? WHERE id = ?';
  db.query(scoreSql, [score, achievementId], (err, result) => {
    if (err) {
      console.error('Error updating incubation score:', err);
      res.status(500).json({ code: 500, msg: '评分失败' });
      return;
    }

    // 检查是否两部分评分都大于80分
    const checkSql = 'SELECT score, incubation_score FROM achievement WHERE id = ?';
    db.query(checkSql, [achievementId], (err, result) => {
      if (err) {
        console.error('Error checking scores:', err);
        res.status(500).json({ code: 500, msg: '评分失败' });
        return;
      }

      if (result.length > 0) {
        const achievement = result[0];
        if (parseInt(achievement.score) > 80 && parseInt(achievement.incubation_score) > 80) {
          // 两部分评分都大于80分，推送到专家评审
          const expertSql = 'UPDATE achievement SET expert_review = 1, review_status = 1 WHERE id = ?';
          db.query(expertSql, [achievementId], (err, result) => {
            if (err) {
              console.error('Error updating expert review status:', err);
              res.status(500).json({ code: 500, msg: '评分失败' });
              return;
            }

            res.json({ code: 200, msg: '第二阶段评分成功，成果已推送到专家评审' });
          });
        } else {
          res.json({ code: 200, msg: '第二阶段评分成功' });
        }
      } else {
        res.status(404).json({ code: 404, msg: '成果不存在' });
      }
    });
  });
});

// 完成孵化
app.post('/api/result/complete-incubation', (req, res) => {
  console.log('接收到完成孵化请求:', req.query);
  const { achievementId } = req.query;

  if (!achievementId) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }

  // 更新孵化状态为完成
  const sql = 'UPDATE achievement SET incubation_status = 2 WHERE id = ?';
  db.query(sql, [achievementId], (err, result) => {
    if (err) {
      console.error('Error updating incubation status:', err);
      res.status(500).json({ code: 500, msg: '操作失败' });
      return;
    }

    res.json({ code: 200, msg: '孵化完成' });
  });
});

// 打回成果（孵化阶段）
app.post('/api/result/incubation-reject', (req, res) => {
  console.log('接收到孵化打回请求:', req.query);
  const { achievementId, reason } = req.query;

  if (!achievementId || !reason) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }

  // 更新孵化状态为打回
  const sql = 'UPDATE achievement SET incubation_status = 3, reject_reason = ? WHERE id = ?';
  db.query(sql, [reason, achievementId], (err, result) => {
    if (err) {
      console.error('Error updating incubation status:', err);
      res.status(500).json({ code: 500, msg: '打回失败' });
      return;
    }

    res.json({ code: 200, msg: '打回成功' });
  });
});

// 更新评审进度
app.post('/api/result/review-progress', (req, res) => {
  console.log('接收到更新评审进度请求:', req.body);
  const { achievementId, progress } = req.body;

  if (!achievementId || progress === undefined) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }

  // 更新评审进度
  const sql = 'UPDATE achievement SET review_progress = ? WHERE id = ?';
  db.query(sql, [progress, achievementId], (err, result) => {
    if (err) {
      console.error('Error updating review progress:', err);
      res.status(500).json({ code: 500, msg: '更新评审进度失败' });
      return;
    }

    res.json({ code: 200, msg: '更新评审进度成功' });
  });
});

// 专家评审通过
app.post('/api/result/review-pass', (req, res) => {
  console.log('接收到专家评审通过请求:', req.body);
  const { achievementId, score, comment } = req.body;

  if (!achievementId || !score) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }

  // 更新评审状态为通过
  const sql = 'UPDATE achievement SET review_status = 2, expert_review = 1, score = ? WHERE id = ?';
  db.query(sql, [score, achievementId], (err, result) => {
    if (err) {
      console.error('Error updating review status:', err);
      res.status(500).json({ code: 500, msg: '评审通过失败' });
      return;
    }

    res.json({ code: 200, msg: '评审通过成功' });
  });
});

// ==================== 专家端评审接口 ====================

// 获取待专家评审的成果列表（教师已评分通过的）
app.get('/api/expert/tasks', (req, res) => {
  // 先确保必要列存在
  db.query(`ALTER TABLE achievement ADD COLUMN review_status INT DEFAULT 0`, (err) => { /* 忽略 */ });
  db.query(`ALTER TABLE achievement ADD COLUMN expert_review INT DEFAULT 0`, (err) => { /* 忽略 */ });
  db.query(`ALTER TABLE achievement ADD COLUMN student_id INT`, (err) => { /* 忽略 */ });

  const sql = `SELECT a.id, a.title, a.type, a.description, a.student_id AS studentId,
    a.college, a.score, a.incubation_score AS incubationScore, a.incubation_status AS incubationStatus,
    COALESCE(a.review_status, 0) AS reviewStatus, COALESCE(a.expert_review, 0) AS expertReview,
    a.expert_score AS expertScore, a.review_progress AS reviewProgress,
    a.create_time AS createTime, s.real_name AS studentName
    FROM achievement a LEFT JOIN student_user s ON a.student_id = s.id
    WHERE a.score > 0 AND (a.expert_score IS NULL OR a.expert_score = 0)
    ORDER BY a.create_time DESC`;
  db.query(sql, (err, result) => {
    if (err) { res.status(500).json({ code: 500, msg: '获取失败' }); return; }
    res.json({ code: 200, data: result || [] });
  });
});

// 获取待评审任务数量
app.get('/api/expert/tasks/count', (req, res) => {
  db.query('SELECT COUNT(*) AS cnt FROM achievement WHERE score > 0', (err, result) => {
    if (err) { res.status(500).json({ code: 500, msg: '获取失败' }); return; }
    res.json({ code: 200, data: result?.[0]?.cnt || 0 });
  });
});

// 获取成果文件（专家查看）
app.get('/api/expert/task/:id/files', (req, res) => {
  db.query('SELECT id, file_name AS name, file_path AS path, file_size AS size, file_type AS type FROM file WHERE achievement_id = ?', [req.params.id], (err, result) => {
    if (err) { res.status(500).json({ code: 500, msg: '获取失败' }); return; }
    const files = (result || []).map(f => ({
      ...f,
      url: f.path ? `http://localhost:${port}/uploads/${path.basename(f.path)}` : null,
      sizeText: f.size ? (f.size < 1024 ? f.size + ' B' : f.size < 1048576 ? (f.size / 1024).toFixed(1) + ' KB' : (f.size / 1048576).toFixed(1) + ' MB') : ''
    }));
    res.json({ code: 200, data: files });
  });
});

// 提交专家评审
app.post('/api/expert/review', (req, res) => {
  const { expertId, achievementId, score, comment, conclusion, dimensionScores, reviewType } = req.body;
  if (!achievementId || score === undefined) { res.status(400).json({ code: 400, msg: '缺少参数' }); return; }
  const sql = 'INSERT INTO expert_reviews (expert_id, achievement_id, score, comment, conclusion, dimension_scores, review_type) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [expertId || 1, achievementId, score, comment || '', conclusion || 'pass', dimensionScores || '[]', reviewType || 'achievement'], (err) => {
    if (err) { console.error('提交评审失败:', err); res.status(500).json({ code: 500, msg: '提交失败' }); return; }
    db.query('UPDATE achievement SET expert_score = ?, expert_comment = ?, review_conclusion = ?, dimension_scores = ?, review_status = 2 WHERE id = ?',
      [score, comment || '', conclusion || 'pass', dimensionScores || '[]', achievementId], (e) => { if (e) console.error(e); });
    res.json({ code: 200, msg: '评审提交成功' });
  });
});

// 获取专家统计数据
app.get('/api/expert/statistics/:expertId', (req, res) => {
  const eid = req.params.expertId;
  Promise.all([
    new Promise(r => db.query('SELECT COUNT(*) AS cnt FROM achievement WHERE score > 0 AND review_status = 2', (_, res) => r(res?.[0]?.cnt || 0))),
    new Promise(r => db.query('SELECT COUNT(*) AS cnt FROM expert_reviews WHERE expert_id = ?', [eid], (_, res) => r(res?.[0]?.cnt || 0))),
    new Promise(r => db.query('SELECT AVG(score) AS avg FROM expert_reviews WHERE expert_id = ?', [eid], (_, res) => r(Number(res?.[0]?.avg || 0).toFixed(1)))),
    new Promise(r => db.query('SELECT COUNT(*) AS cnt FROM expert_reviews WHERE expert_id = ? AND conclusion = ?', [eid, 'excellent'], (_, res) => r(res?.[0]?.cnt || 0)))
  ]).then(([pendingCount, totalReviews, avgScore, excellentCount]) => {
    res.json({ code: 200, data: { pendingCount, totalReviews, avgScore: String(avgScore), excellentCount } });
  }).catch(() => res.status(500).json({ code: 500, msg: '获取失败' }));
});

// 获取专家评审历史
app.get('/api/expert/reviews/:expertId', (req, res) => {
  const sql = `SELECT er.id, er.achievement_id AS achievementId, a.title AS achievementTitle,
    a.type AS achievementType, er.score, er.comment, er.conclusion, er.dimension_scores,
    er.review_time, er.review_type AS reviewType
    FROM expert_reviews er LEFT JOIN achievement a ON er.achievement_id = a.id
    WHERE er.expert_id = ? ORDER BY er.review_time DESC`;
  db.query(sql, [req.params.expertId], (err, result) => {
    if (err) { res.status(500).json({ code: 500, msg: '获取失败' }); return; }
    res.json({ code: 200, data: result || [] });
  });
});

// 确保 expert_reviews 表存在
db.query(`CREATE TABLE IF NOT EXISTS expert_reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  expert_id INT NOT NULL,
  achievement_id INT NOT NULL,
  score DECIMAL(5,1) NOT NULL,
  comment TEXT,
  conclusion VARCHAR(20),
  dimension_scores TEXT,
  review_type VARCHAR(20) DEFAULT 'achievement',
  review_time DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => { if (err) console.error('创建 expert_reviews 表失败:', err); });

// 确保 achievement 表有专家评审相关列
db.query(`ALTER TABLE achievement ADD COLUMN expert_score DECIMAL(5,1)`, (err) => {});
db.query(`ALTER TABLE achievement ADD COLUMN expert_comment TEXT`, (err) => {});
db.query(`ALTER TABLE achievement ADD COLUMN review_conclusion VARCHAR(20)`, (err) => {});
db.query(`ALTER TABLE achievement ADD COLUMN dimension_scores TEXT`, (err) => {});
db.query(`ALTER TABLE achievement ADD COLUMN review_progress INT DEFAULT 0`, (err) => {});

// 专家评审打回
// 教师端打回成果（前端以 query 传参，同时兼容 body）
app.post('/api/result/reject', (req, res) => {
  const achievementId = req.body.achievementId || req.query.achievementId;
  const reason = req.body.reason || req.query.reason;
  if (!achievementId || !reason) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }
  // review_status: 0 待审核 / 1 评审中 / 2 已通过 / 3 已打回
  db.query('UPDATE achievement SET review_status = 3, reject_reason = ? WHERE id = ?', [reason, achievementId], (err) => {
    if (err) {
      console.error('成果打回失败:', err);
      res.status(500).json({ code: 500, msg: '打回失败' });
      return;
    }
    res.json({ code: 200, msg: '打回成功' });
  });
});

app.post('/api/result/review-reject', (req, res) => {
  console.log('接收到专家评审打回请求:', req.body);
  const { achievementId, reason } = req.body;

  if (!achievementId || !reason) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }

  // 更新评审状态为打回
  const sql = 'UPDATE achievement SET review_status = 3, reject_reason = ? WHERE id = ?';
  db.query(sql, [reason, achievementId], (err, result) => {
    if (err) {
      console.error('Error updating review status:', err);
      res.status(500).json({ code: 500, msg: '评审打回失败' });
      return;
    }

    res.json({ code: 200, msg: '评审打回成功' });
  });
});

// 获取我的成果列表
app.get('/api/result/my', (req, res) => {
  console.log('接收到获取我的成果列表请求:', req.query);
  const { studentId, userId, userType } = req.query;

  if (!studentId) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }

  // 获取学生的成果列表
  const sql = 'SELECT * FROM achievement WHERE student_id = ?';
  db.query(sql, [studentId], (err, result) => {
    if (err) {
      console.error('Error getting my achievements:', err);
      res.status(500).json({ code: 500, msg: '获取成果列表失败' });
      return;
    }

    // 处理每个成果的文件信息
    const processAchievements = async () => {
      const achievementsWithFiles = [];

      for (const achievement of result) {
        // 获取文件信息
        const fileSql = 'SELECT * FROM file WHERE achievement_id = ?';
        const files = await new Promise((resolve, reject) => {
          db.query(fileSql, [achievement.id], (err, fileResult) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(fileResult);
          });
        });

        // 分类文件
        const clubFiles = [];
        const achievementFiles = [];
        
        files.forEach(file => {
          const fileInfo = {
            id: file.id,
            name: file.file_name,
            url: `http://localhost:${port}/uploads/${path.basename(file.file_path)}`,
            size: file.file_size,
            type: file.file_type,
            createTime: file.create_time
          };
          
          if (file.file_category === 'club') {
            clubFiles.push(fileInfo);
          } else {
            achievementFiles.push(fileInfo);
          }
        });

        // 转换字段名，将下划线命名法转换为驼峰命名法
        const transformedAchievement = {
          id: achievement.id,
          title: achievement.title,
          type: achievement.type,
          description: achievement.description,
          studentId: achievement.student_id,
          filePath: achievement.file_path,
          fileName: achievement.file_name,
          createTime: achievement.create_time,
          updateTime: achievement.update_time,
          status: achievement.status,
          college: achievement.college,
          score: achievement.score,
          incubationStatus: achievement.incubation_status,
          reviewStatus: achievement.review_status,
          reviewProgress: achievement.review_progress,
          incubationScore: achievement.incubation_score,
          expertReview: achievement.expert_review,
          rejectReason: achievement.reject_reason,
          clubFiles: clubFiles,
          achievementFiles: achievementFiles
        };
        
        // 添加文件信息到成果对象
        achievementsWithFiles.push(transformedAchievement);
      }

      res.json({
        code: 200,
        data: achievementsWithFiles
      });
    };

    processAchievements().catch(err => {
      console.error('Error processing achievements:', err);
      res.status(500).json({ code: 500, msg: '获取成果列表失败' });
    });
  });
});

// 更新成果
app.put('/api/result/update', (req, res) => {
  console.log('接收到更新成果请求:', req.body);
  const { id, title, type, description } = req.body;

  if (!id || !title || !type) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }

  // 更新成果信息
  const sql = 'UPDATE achievement SET title = ?, type = ?, description = ? WHERE id = ?';
  db.query(sql, [title, type, description, id], (err, result) => {
    if (err) {
      console.error('Error updating achievement:', err);
      res.status(500).json({ code: 500, msg: '更新失败' });
      return;
    }

    res.json({ code: 200, msg: '更新成功' });
  });
});

// 删除成果
app.delete('/api/result/delete/:id', (req, res) => {
  console.log('接收到删除成果请求:', req.params);
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }

  // 删除成果
  const sql = 'DELETE FROM achievement WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting achievement:', err);
      res.status(500).json({ code: 500, msg: '删除失败' });
      return;
    }

    res.json({ code: 200, msg: '删除成功' });
  });
});

// 获取学生信息
app.get('/api/student/info', (req, res) => {
  console.log('接收到获取学生信息请求:', req.query);
  const { studentId } = req.query;

  if (!studentId) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }

  // 从student_user表中查询学生信息
  const sql = 'SELECT * FROM student_user WHERE id = ?';
  db.query(sql, [studentId], (err, result) => {
    if (err) {
      console.error('Error querying student:', err);
      res.status(500).json({ code: 500, msg: '获取学生信息失败' });
      return;
    }

    if (result.length === 0) {
      res.status(404).json({ code: 404, msg: '学生不存在' });
      return;
    }

    res.json({
      code: 200,
      data: result[0]
    });
  });
});

// 通知相关接口
app.get('/api/notice/list', (req, res) => {
  console.log('接收到获取通知列表请求');
  // 从notification表中获取通知列表
  const sql = 'SELECT * FROM notification ORDER BY create_time DESC';
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error getting notices:', err);
      res.status(500).json({ code: 500, msg: '获取通知列表失败' });
      return;
    }
    // 转换数据格式
    const notices = result.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      createTime: item.create_time,
      status: item.is_read ? 1 : 0,
      type: item.type
    }));
    res.json({ code: 200, data: notices });
  });
});

app.post('/api/notice/create', (req, res) => {
  console.log('接收到创建通知请求:', req.body);
  const { title, content, publisherId, publisherType, status, noticeType } = req.body;
  // 向notification表中插入新通知
  const sql = 'INSERT INTO notification (title, content, type, is_read) VALUES (?, ?, ?, ?)';
  db.query(sql, [title, content, noticeType || 'system', status === 1], (err, result) => {
    if (err) {
      console.error('Error creating notice:', err);
      res.status(500).json({ code: 500, msg: '创建通知失败' });
      return;
    }
    res.json({ code: 200, msg: '发布成功' });
  });
});

app.put('/api/notice/update', (req, res) => {
  console.log('接收到更新通知请求:', req.body);
  const { id, title, content } = req.body;
  // 更新notification表中的通知
  const sql = 'UPDATE notification SET title = ?, content = ? WHERE id = ?';
  db.query(sql, [title, content, id], (err, result) => {
    if (err) {
      console.error('Error updating notice:', err);
      res.status(500).json({ code: 500, msg: '更新通知失败' });
      return;
    }
    res.json({ code: 200, msg: '更新成功' });
  });
});

app.delete('/api/notice/delete/:id', (req, res) => {
  console.log('接收到删除通知请求:', req.params);
  const { id } = req.params;
  // 从notification表中删除通知
  const sql = 'DELETE FROM notification WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting notice:', err);
      res.status(500).json({ code: 500, msg: '删除通知失败' });
      return;
    }
    res.json({ code: 200, msg: '删除成功' });
  });
});

// 获取学生的个人通知
app.get('/api/notice/student/:id', (req, res) => {
  console.log('接收到获取学生个人通知请求:', req.params);
  const { id } = req.params;
  // 从notification表中获取学生的个人通知
  // 这里简化处理，返回所有通知
  const sql = 'SELECT * FROM notification WHERE type = ? OR type = ? ORDER BY create_time DESC';
  db.query(sql, ['student', 'personal'], (err, result) => {
    if (err) {
      console.error('Error getting student notices:', err);
      res.status(500).json({ code: 500, msg: '获取个人通知失败' });
      return;
    }
    // 转换数据格式
    const notices = result.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      createTime: item.create_time,
      status: item.is_read ? 1 : 0,
      type: item.type
    }));
    res.json({ code: 200, data: notices });
  });
});

// 检查并创建notification表
const createNotificationTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS notification (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      type VARCHAR(255) NOT NULL DEFAULT 'system',
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_read BOOLEAN DEFAULT FALSE
    )
  `;
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error creating notification table:', err);
    } else {
      console.log('Notification table created or already exists');
    }
  });
};

// ==================== 企业端接口 ====================

// 确保企业相关表存在
db.query(`CREATE TABLE IF NOT EXISTS enterprise_bookmark (
  id INT PRIMARY KEY AUTO_INCREMENT,
  enterprise_id INT NOT NULL,
  achievement_id INT NOT NULL,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_enterprise_achievement (enterprise_id, achievement_id)
)`, (err) => { if (err) console.error('创建 enterprise_bookmark 表失败:', err); });

// 确保 resource 表有 enterprise_id 列
db.query(`ALTER TABLE resource ADD COLUMN enterprise_id INT`, (err) => { /* 忽略"列已存在" */ });
db.query(`ALTER TABLE resource ADD COLUMN publish_time DATETIME`, (err) => {});
db.query(`ALTER TABLE resource ADD COLUMN end_time DATETIME`, (err) => {});
db.query(`ALTER TABLE resource ADD COLUMN status VARCHAR(20) DEFAULT "active"`, (err) => {});
db.query(`ALTER TABLE resource ADD COLUMN view_count INT DEFAULT 0`, (err) => {});
db.query(`ALTER TABLE resource ADD COLUMN apply_count INT DEFAULT 0`, (err) => {});
// 确保 resource_application 表有必要的列
db.query(`ALTER TABLE resource_application ADD COLUMN student_name VARCHAR(100)`, (err) => {});
db.query(`ALTER TABLE resource_application ADD COLUMN student_college VARCHAR(100)`, (err) => {});
db.query(`ALTER TABLE resource_application ADD COLUMN application_time DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {});
db.query(`ALTER TABLE resource_application ADD COLUMN status VARCHAR(20) DEFAULT "待审核"`, (err) => {});

// 企业工作台统计
app.get('/api/enterprise/stats/:enterpriseId', (req, res) => {
  const eid = req.params.enterpriseId;
  Promise.all([
    new Promise((resolve) => db.query('SELECT COUNT(*) AS cnt FROM resource WHERE enterprise_id = ?', [eid], (_, r) => resolve(r?.[0]?.cnt || 0))),
    new Promise((resolve) => db.query('SELECT COUNT(*) AS cnt FROM resource_application ra JOIN resource r ON ra.resource_id = r.id WHERE r.enterprise_id = ?', [eid], (_, r) => resolve(r?.[0]?.cnt || 0))),
    new Promise((resolve) => db.query('SELECT COUNT(*) AS cnt FROM enterprise_bookmark WHERE enterprise_id = ?', [eid], (_, r) => resolve(r?.[0]?.cnt || 0)))
  ]).then(([resourceCount, applicationCount, bookmarkCount]) => {
    res.json({ code: 200, data: { resourceCount, applicationCount, bookmarkCount } });
  }).catch(() => res.status(500).json({ code: 500, msg: '获取统计失败' }));
});

// 获取企业资源列表
app.get('/api/enterprise/resources/:enterpriseId', (req, res) => {
  const sql = `SELECT r.id, r.title, r.type, r.provider, r.description, r.publish_time AS publishTime,
    r.end_time AS endTime, r.status, r.view_count AS viewCount,
    COALESCE((SELECT COUNT(*) FROM resource_application ra WHERE ra.resource_id = r.id), 0) AS applyCount
    FROM resource r WHERE r.enterprise_id = ? ORDER BY r.create_time DESC`;
  db.query(sql, [req.params.enterpriseId], (err, result) => {
    if (err) { res.status(500).json({ code: 500, msg: '获取失败' }); return; }
    res.json({ code: 200, data: result || [] });
  });
});

// 投递新资源
app.post('/api/enterprise/resources', (req, res) => {
  const { title, type, provider, description, publishTime, endTime, enterpriseId } = req.body;
  if (!title || !type || !enterpriseId) { res.status(400).json({ code: 400, msg: '缺少必要参数' }); return; }
  const sql = 'INSERT INTO resource (title, type, provider, description, publish_time, end_time, status, enterprise_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [title, type, provider || '', description || '', publishTime || new Date(), endTime || null, 'active', enterpriseId], (err) => {
    if (err) { res.status(500).json({ code: 500, msg: '投递失败' }); return; }
    res.json({ code: 200, msg: '资源投递成功' });
  });
});

// 下架资源
app.delete('/api/enterprise/resources/:id', (req, res) => {
  db.query('UPDATE resource SET status = ? WHERE id = ?', ['inactive', req.params.id], (err) => {
    if (err) { res.status(500).json({ code: 500, msg: '下架失败' }); return; }
    res.json({ code: 200, msg: '已下架' });
  });
});

// 获取企业收到的申请列表
app.get('/api/enterprise/applications/:enterpriseId', (req, res) => {
  const sql = `SELECT ra.id, ra.resource_id AS resourceId, r.title AS resourceTitle,
    ra.student_id AS studentId, ra.student_name AS studentName, ra.student_college AS studentCollege,
    ra.status, ra.application_time AS applicationTime,
    COALESCE((SELECT a.title FROM achievement a WHERE a.student_id = ra.student_id AND a.review_status = 2 LIMIT 1), '') AS achievementTitle
    FROM resource_application ra
    JOIN resource r ON ra.resource_id = r.id
    WHERE r.enterprise_id = ?
    ORDER BY ra.application_time DESC`;
  db.query(sql, [req.params.enterpriseId], (err, result) => {
    if (err) { res.status(500).json({ code: 500, msg: '获取失败' }); return; }
    res.json({ code: 200, data: result || [] });
  });
});

// 审批申请（批准/拒绝）
app.put('/api/enterprise/applications/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) { res.status(400).json({ code: 400, msg: '缺少状态' }); return; }
  db.query('UPDATE resource_application SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
    if (err) { res.status(500).json({ code: 500, msg: '操作失败' }); return; }
    res.json({ code: 200, msg: '已' + status });
  });
});

// 浏览成果（企业端，含收藏状态 + 完整字段）
app.get('/api/enterprise/achievements', (req, res) => {
  // 先确保必要的列存在
  ['college','review_status','incubation_score','review_conclusion','expert_score','teacher_comment','expert_comment','dimension_scores','community_name'].forEach(col => {
    db.query(`ALTER TABLE achievement ADD COLUMN ${col} VARCHAR(255)`, (err) => {});
  });

  const { enterpriseId, search = '' } = req.query;
  let where = ''; let params = [];
  if (search) { where = ' WHERE (a.title LIKE ? OR a.type LIKE ?)'; params = ['%' + search + '%', '%' + search + '%']; }
  const sql = `SELECT a.id, a.title, a.type, a.description, a.college, a.score,
    a.student_id AS studentId, s.real_name AS studentName,
    a.review_status AS reviewStatus, a.incubation_status AS incubationStatus,
    a.incubation_score AS incubationScore, a.review_conclusion AS reviewConclusion,
    a.expert_score AS expertScore, a.teacher_comment AS teacherComment,
    a.expert_comment AS expertComment, a.dimension_scores,
    a.community_name AS communityName, a.create_time AS createTime,
    (SELECT COUNT(*) FROM enterprise_bookmark b WHERE b.achievement_id = a.id AND b.enterprise_id = ?) AS isBookmarked
    FROM achievement a
    LEFT JOIN student_user s ON a.student_id = s.id` + where + ' ORDER BY a.create_time DESC';
  db.query(sql, [enterpriseId || 0, ...params], (err, result) => {
    if (err) {
      console.error('获取成果列表失败:', err);
      // 降级查询
      const fallback = 'SELECT a.*, s.real_name AS studentName FROM achievement a LEFT JOIN student_user s ON a.student_id = s.id ORDER BY a.create_time DESC';
      db.query(fallback, [enterpriseId || 0, ...params], (err2, result2) => {
        if (err2) { res.status(500).json({ code: 500, msg: '获取失败' }); return; }
        res.json({ code: 200, data: { achievements: (result2 || []).map(a => ({ ...a, isBookmarked: false })) } });
      });
      return;
    }
    res.json({ code: 200, data: { achievements: (result || []).map(a => ({ ...a, isBookmarked: a.isBookmarked > 0 })) } });
  });
});

// 收藏/取消收藏
app.post('/api/enterprise/bookmark', (req, res) => {
  const { enterpriseId, achievementId } = req.body;
  if (!enterpriseId || !achievementId) { res.status(400).json({ code: 400, msg: '缺少参数' }); return; }
  db.query('SELECT id FROM enterprise_bookmark WHERE enterprise_id = ? AND achievement_id = ?', [enterpriseId, achievementId], (err, result) => {
    if (err) { res.status(500).json({ code: 500, msg: '操作失败' }); return; }
    if (result.length > 0) {
      db.query('DELETE FROM enterprise_bookmark WHERE id = ?', [result[0].id], () => res.json({ code: 200, msg: '已取消收藏', data: { bookmarked: false } }));
    } else {
      db.query('INSERT INTO enterprise_bookmark (enterprise_id, achievement_id) VALUES (?, ?)', [enterpriseId, achievementId], () => res.json({ code: 200, msg: '收藏成功', data: { bookmarked: true } }));
    }
  });
});

// 获取成果文件（企业查看）
app.get('/api/enterprise/achievement/:id/files', (req, res) => {
  const sql = 'SELECT id, file_name AS name, file_path AS path, file_size AS size, file_type AS type FROM file WHERE achievement_id = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) { res.status(500).json({ code: 500, msg: '获取失败' }); return; }
    const files = (result || []).map(f => ({
      ...f,
      url: f.path ? `http://localhost:${port}/uploads/${path.basename(f.path)}` : null,
      sizeText: f.size ? (f.size < 1024 ? f.size + ' B' : f.size < 1048576 ? (f.size / 1024).toFixed(1) + ' KB' : (f.size / 1048576).toFixed(1) + ' MB') : ''
    }));
    res.json({ code: 200, data: files });
  });
});

// 获取成果评审详情（企业查看）
app.get('/api/enterprise/achievement/:id/review-detail', (req, res) => {
  db.query('SELECT review_comment AS comment, review_conclusion AS conclusion, dimension_scores AS dimensionScores, expert_score AS expertScore FROM achievement WHERE id = ?', [req.params.id], (err, result) => {
    if (err) { res.status(500).json({ code: 500, msg: '获取失败' }); return; }
    res.json({ code: 200, data: result?.[0] || {} });
  });
});

// ==================== 资源相关接口 ====================
app.get('/api/resource/list', (req, res) => {
  console.log('接收到获取资源列表请求');
  const sql = 'SELECT id, title, type, provider, description, publish_time as publishTime, end_time as endTime, status, view_count as viewCount, apply_count as applyCount FROM resource';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('获取资源列表失败:', err);
      res.status(500).json({ code: 500, msg: '获取资源列表失败' });
      return;
    }
    res.json({ code: 200, data: results });
  });
});

app.get('/api/resource/type/:type', (req, res) => {
  console.log('接收到根据类型获取资源请求:', req.params);
  const { type } = req.params;
  const sql = 'SELECT id, title, type, provider, description, publish_time as publishTime, end_time as endTime, status, view_count as viewCount, apply_count as applyCount FROM resource WHERE type = ?';
  db.query(sql, [type], (err, results) => {
    if (err) {
      console.error('根据类型获取资源失败:', err);
      res.status(500).json({ code: 500, msg: '根据类型获取资源失败' });
      return;
    }
    res.json({ code: 200, data: results });
  });
});

app.get('/api/resource/:id', (req, res) => {
  console.log('接收到获取资源详情请求:', req.params);
  const { id } = req.params;
  const sql = 'SELECT id, title, type, provider, description, publish_time as publishTime, end_time as endTime, status, view_count as viewCount, apply_count as applyCount FROM resource WHERE id = ?';
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('获取资源详情失败:', err);
      res.status(500).json({ code: 500, msg: '获取资源详情失败' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ code: 404, msg: '资源不存在' });
      return;
    }
    res.json({ code: 200, data: results[0] });
  });
});

app.post('/api/resource', (req, res) => {
  console.log('接收到创建资源请求:', req.body);
  const { title, type, provider, description, publishTime, endTime, status } = req.body;
  const sql = 'INSERT INTO resource (title, type, provider, description, publish_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [title, type, provider, description, publishTime, endTime, status], (err, results) => {
    if (err) {
      console.error('创建资源失败:', err);
      res.status(500).json({ code: 500, msg: '创建资源失败' });
      return;
    }
    res.json({ code: 200, msg: '资源发布成功' });
  });
});

app.delete('/api/resource/:id', (req, res) => {
  console.log('接收到删除资源请求:', req.params);
  const { id } = req.params;
  const sql = 'DELETE FROM resource WHERE id = ?';
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('删除资源失败:', err);
      res.status(500).json({ code: 500, msg: '删除资源失败' });
      return;
    }
    if (results.affectedRows === 0) {
      res.status(404).json({ code: 404, msg: '资源不存在' });
      return;
    }
    res.json({ code: 200, msg: '资源删除成功' });
  });
});

app.get('/api/resource/applications/student/:studentId', (req, res) => {
  console.log('接收到获取学生申请列表请求:', req.params);
  const { studentId } = req.params;
  const sql = 'SELECT id, resource_id as resourceId, student_id as studentId, student_name as studentName, student_college as studentCollege, status, application_time as applicationTime FROM resource_application WHERE student_id = ?';
  db.query(sql, [studentId], (err, results) => {
    if (err) {
      console.error('获取学生申请列表失败:', err);
      res.status(500).json({ code: 500, msg: '获取学生申请列表失败' });
      return;
    }
    res.json({ code: 200, data: results });
  });
});

app.get('/api/resource/applications/resource/:resourceId', (req, res) => {
  console.log('接收到获取资源申请列表请求:', req.params);
  const { resourceId } = req.params;
  const sql = 'SELECT id, resource_id as resourceId, student_id as studentId, student_name as studentName, student_college as studentCollege, status, application_time as applicationTime FROM resource_application WHERE resource_id = ?';
  db.query(sql, [resourceId], (err, results) => {
    if (err) {
      console.error('获取资源申请列表失败:', err);
      res.status(500).json({ code: 500, msg: '获取资源申请列表失败' });
      return;
    }
    res.json({ code: 200, data: results });
  });
});

app.post('/api/resource/apply', (req, res) => {
  console.log('接收到申请资源请求:', req.body);
  const { resourceId, studentId, studentName, studentCollege } = req.body;

  if (!resourceId || !studentId) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }

  // 双审资格校验：学生必须有教师评分且专家评审通过的项目
  const checkSql = `SELECT id, title FROM achievement WHERE student_id = ? AND score > 0 AND review_status = 2`;
  db.query(checkSql, [studentId], (err, qualifiedList) => {
    if (err) {
      console.error('双审校验失败:', err);
      res.status(500).json({ code: 500, msg: '系统错误' });
      return;
    }
    if (qualifiedList.length === 0) {
      res.json({ code: 400, msg: '您的项目尚未通过教师评分和专家双审，请先上传成果并等待双审通过后再申请' });
      return;
    }

    // 检查是否重复申请
    db.query('SELECT id FROM resource_application WHERE resource_id = ? AND student_id = ?', [resourceId, studentId], (dupErr, dupResult) => {
      if (dupErr) { res.status(500).json({ code: 500, msg: '系统错误' }); return; }
      if (dupResult.length > 0) { res.json({ code: 400, msg: '您已申请过该资源，请勿重复申请' }); return; }

      const sql = 'INSERT INTO resource_application (resource_id, student_id, student_name, student_college) VALUES (?, ?, ?, ?)';
      db.query(sql, [resourceId, studentId, studentName, studentCollege], (err) => {
        if (err) { res.status(500).json({ code: 500, msg: '申请资源失败' }); return; }
        db.query('UPDATE resource SET apply_count = apply_count + 1 WHERE id = ?', [resourceId], (e) => { if (e) console.error(e); });
        res.json({ code: 200, msg: '申请提交成功' });
      });
    });
  });
});

app.put('/api/resource/applications/:id/status', (req, res) => {
  console.log('接收到更新申请状态请求:', req.params, req.query);
  const { id } = req.params;
  const { status } = req.query;
  const sql = 'UPDATE resource_application SET status = ? WHERE id = ?';
  db.query(sql, [status, id], (err, results) => {
    if (err) {
      console.error('更新申请状态失败:', err);
      res.status(500).json({ code: 500, msg: '更新申请状态失败' });
      return;
    }
    if (results.affectedRows === 0) {
      res.status(404).json({ code: 404, msg: '申请不存在' });
      return;
    }
    res.json({ code: 200, msg: `申请${status}成功` });
  });
});

// 获奖相关接口
// 创建获奖表和获奖文件表
const createAwardTables = () => {
  // 先创建student_user表（如果不存在）
  const studentUserTableSql = `
    CREATE TABLE IF NOT EXISTS student_user (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(100) NOT NULL,
      real_name VARCHAR(50),
      phone VARCHAR(20),
      email VARCHAR(100),
      college VARCHAR(50),
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TINYINT DEFAULT 1
    )
  `;

  // 创建获奖表
  const awardTableSql = `
    CREATE TABLE IF NOT EXISTS award (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      level VARCHAR(50) NOT NULL,
      award_time DATE NOT NULL,
      description TEXT,
      student_id BIGINT NOT NULL,
      college VARCHAR(255),
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  // 创建获奖文件表
  const awardFileTableSql = `
    CREATE TABLE IF NOT EXISTS award_file (
      id INT PRIMARY KEY AUTO_INCREMENT,
      award_id INT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(255) NOT NULL,
      file_size INT,
      file_type VARCHAR(100),
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  // 先创建student_user表
  db.query(studentUserTableSql, (err, result) => {
    if (err) {
      console.error('Error creating student_user table:', err);
    } else {
      console.log('Student_user table created or already exists');
      
      // 创建award表
      db.query(awardTableSql, (err, result) => {
        if (err) {
          console.error('Error creating award table:', err);
        } else {
          console.log('Award table created or already exists');
          
          // 创建award_file表
          db.query(awardFileTableSql, (err, result) => {
            if (err) {
              console.error('Error creating award_file table:', err);
            } else {
              console.log('Award_file table created or already exists');
              
              // 添加外键约束（如果失败则静默忽略，因为表可能已存在且数据不兼容）
              const addForeignKeySql1 = `
                ALTER TABLE award ADD CONSTRAINT fk_award_student FOREIGN KEY (student_id) REFERENCES student_user(id)
              `;
              db.query(addForeignKeySql1, (err, result) => {
                if (err) {
                  // 忽略外键约束相关的错误（已存在、类型不匹配等）
                  if (!['ER_DUP_KEY', 'ER_CANNOT_ADD_FOREIGN', 'ER_DUP_KEYNAME'].includes(err.code)) {
                    console.error('Error adding foreign key to award table:', err);
                  }
                } else {
                  console.log('Foreign key added to award table');
                }
              });

              const addForeignKeySql2 = `
                ALTER TABLE award_file ADD CONSTRAINT fk_award_file_award FOREIGN KEY (award_id) REFERENCES award(id) ON DELETE CASCADE
              `;
              db.query(addForeignKeySql2, (err, result) => {
                if (err) {
                  // 忽略外键约束相关的错误
                  if (!['ER_DUP_KEY', 'ER_CANNOT_ADD_FOREIGN', 'ER_DUP_KEYNAME'].includes(err.code)) {
                    console.error('Error adding foreign key to award_file table:', err);
                  }
                } else {
                  console.log('Foreign key added to award_file table');
                }
              });
            }
          });
        }
      });
    }
  });
};

// 管理员相关接口
// 创建管理员表
const createAdminTable = () => {
  const adminTableSql = `
    CREATE TABLE IF NOT EXISTS admin_user (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(100) NOT NULL,
      real_name VARCHAR(50),
      email VARCHAR(100),
      role VARCHAR(20) DEFAULT 'admin',
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TINYINT DEFAULT 1
    )
  `;
  
  db.query(adminTableSql, (err, result) => {
    if (err) {
      console.error('Error creating admin_user table:', err);
    } else {
      console.log('Admin_user table created or already exists');
      
      // 检查是否有默认管理员账号，如果没有则创建
      const checkAdminSql = 'SELECT * FROM admin_user WHERE username = ?';
      db.query(checkAdminSql, ['admin'], (err, result) => {
        if (err) {
          console.error('Error checking admin user:', err);
        } else if (result.length === 0) {
          // 创建默认管理员账号
          const insertAdminSql = 'INSERT INTO admin_user (username, password, real_name, email, role, status) VALUES (?, ?, ?, ?, ?, ?)';
          db.query(insertAdminSql, ['admin', 'admin123', '管理员', 'admin@example.com', 'admin', 1], (err, result) => {
            if (err) {
              console.error('Error creating default admin user:', err);
            } else {
              console.log('Default admin user created successfully');
            }
          });
        }
      });
    }
  });
};

// 上传获奖材料
app.post('/api/award/upload', upload.fields([{ name: 'awardFiles', maxCount: 10 }]), (req, res) => {
  console.log('接收到获奖上传请求');
  console.log('请求体:', req.body);
  console.log('上传的获奖文件:', req.files.awardFiles);
  
  const { title, level, awardTime, description, studentId, college } = req.body;
  const awardFiles = req.files.awardFiles || [];
  
  // 处理日期格式，确保是YYYY-MM-DD格式
  let formattedAwardTime = awardTime;
  if (awardTime) {
    const date = new Date(awardTime);
    if (!isNaN(date.getTime())) {
      formattedAwardTime = date.toISOString().split('T')[0];
    }
  }

  if (!title || !level || !awardTime || !studentId) {
    console.error('缺少必要参数');
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }

  // 插入获奖信息
  const awardSql = 'INSERT INTO award (title, level, award_time, description, student_id, college) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(awardSql, [title, level, formattedAwardTime, description, studentId, college], (err, result) => {
    if (err) {
      console.error('Error inserting award:', err);
      res.status(500).json({ code: 500, msg: '上传失败' });
      return;
    }

    const awardId = result.insertId;
    console.log('获奖信息插入成功，ID:', awardId);

    // 插入获奖文件
    if (awardFiles.length > 0) {
      awardFiles.forEach(file => {
        // 确保文件名是UTF-8编码
        const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const fileSql = 'INSERT INTO award_file (award_id, file_name, file_path, file_size, file_type) VALUES (?, ?, ?, ?, ?)';
        db.query(fileSql, [awardId, fileName, file.path, file.size, file.mimetype], (err) => {
          if (err) {
            console.error('Error inserting award file:', err);
          } else {
            console.log('获奖文件插入成功:', fileName);
          }
        });
      });
    }

    res.json({ code: 200, msg: '上传成功' });
  });
});

// 获取获奖列表（用于教师端）
app.get('/api/award/list', (req, res) => {
  console.log('接收到获取获奖列表请求');

  // 获取所有获奖信息
  const awardSql = 'SELECT * FROM award';
  db.query(awardSql, (err, awardResult) => {
    if (err) {
      console.error('Error getting awards:', err);
      res.status(500).json({ code: 500, msg: '获取获奖列表失败' });
      return;
    }

    console.log('获取到获奖列表:', awardResult);

    // 处理每个获奖信息的文件信息
    const processAwards = async () => {
      const awardsWithFiles = [];

      for (const award of awardResult) {
        // 获取文件信息
        const fileSql = 'SELECT * FROM award_file WHERE award_id = ?';
        const files = await new Promise((resolve, reject) => {
          db.query(fileSql, [award.id], (err, fileResult) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(fileResult);
          });
        });

        // 处理文件路径
        const awardFiles = files.map(file => ({
          id: file.id,
          name: file.file_name,
          url: `http://localhost:${port}/uploads/${path.basename(file.file_path)}`,
          size: file.file_size,
          type: file.file_type,
          createTime: file.create_time
        }));

        // 获取学生信息
        const studentSql = 'SELECT username FROM student_user WHERE id = ?';
        const student = await new Promise((resolve, reject) => {
          db.query(studentSql, [award.student_id], (err, studentResult) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(studentResult.length > 0 ? studentResult[0] : null);
          });
        });

        // 构建获奖信息对象
        const transformedAward = {
          id: award.id,
          title: award.title,
          level: award.level,
          awardTime: award.award_time,
          description: award.description,
          studentId: award.student_id,
          studentName: student ? student.username : '未知',
          college: award.college,
          createTime: award.create_time,
          files: awardFiles
        };
        
        awardsWithFiles.push(transformedAward);
      }

      console.log('处理后的获奖列表:', awardsWithFiles);
      res.json({
        code: 200,
        data: awardsWithFiles
      });
    };

    processAwards().catch(err => {
      console.error('Error processing awards:', err);
      res.status(500).json({ code: 500, msg: '获取获奖列表失败' });
    });
  });
});

// 获取获奖详情
app.get('/api/award/:id', (req, res) => {
  console.log('接收到获取获奖详情请求，ID:', req.params.id);
  const { id } = req.params;

  // 获取获奖信息
  const awardSql = 'SELECT * FROM award WHERE id = ?';
  db.query(awardSql, [id], (err, awardResult) => {
    if (err) {
      console.error('Error getting award:', err);
      res.status(500).json({ code: 500, msg: '获取获奖详情失败' });
      return;
    }

    if (awardResult.length === 0) {
      res.status(404).json({ code: 404, msg: '获奖信息不存在' });
      return;
    }

    const award = awardResult[0];
    console.log('获取到获奖信息:', award);

    // 获取文件信息
    const fileSql = 'SELECT * FROM award_file WHERE award_id = ?';
    db.query(fileSql, [id], (err, fileResult) => {
      if (err) {
        console.error('Error getting files:', err);
        res.status(500).json({ code: 500, msg: '获取文件信息失败' });
        return;
      }

      console.log('获取到文件信息:', fileResult);
      // 处理文件路径
      const awardFiles = fileResult.map(file => ({
        id: file.id,
        name: file.file_name,
        url: `http://localhost:${port}/uploads/${path.basename(file.file_path)}`,
        size: file.file_size,
        type: file.file_type,
        createTime: file.create_time
      }));

      // 获取学生信息
      const studentSql = 'SELECT username FROM student_user WHERE id = ?';
      db.query(studentSql, [award.student_id], (err, studentResult) => {
        if (err) {
          console.error('Error getting student:', err);
          res.status(500).json({ code: 500, msg: '获取学生信息失败' });
          return;
        }

        const studentName = studentResult.length > 0 ? studentResult[0].username : '未知';

        console.log('处理后的获奖文件信息:', awardFiles);
        res.json({
          code: 200,
          data: {
            ...award,
            studentName: studentName,
            files: awardFiles
          }
        });
      });
    });
  });
});

// 管理员登录
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }
  
  const sql = 'SELECT * FROM admin_user WHERE username = ?';
  db.query(sql, [username], (err, result) => {
    if (err) {
      console.error('Error querying admin user:', err);
      res.status(500).json({ code: 500, msg: '登录失败' });
      return;
    }
    
    if (result.length === 0) {
      res.status(401).json({ code: 401, msg: '用户名或密码错误' });
      return;
    }
    
    const admin = result[0];
    if (password !== admin.password) {
      res.status(401).json({ code: 401, msg: '用户名或密码错误' });
      return;
    }
    
    // 生成token
    const token = jwt.sign({ id: admin.id, username: admin.username, userType: 'admin' }, secretKey, { expiresIn: '24h' });
    
    res.json({
      code: 200,
      msg: '登录成功',
      data: {
        token,
        adminId: admin.id,
        username: admin.username,
        realName: admin.real_name
      }
    });
  });
});

// 获取管理员统计数据（真实聚合）
app.get('/api/admin/stats', (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM student_user)        AS studentCount,
      (SELECT COUNT(*) FROM teacher_user)        AS teacherCount,
      (SELECT COUNT(*) FROM club)                AS clubCount,
      (SELECT COUNT(*) FROM achievement)         AS resultCount,
      (SELECT COUNT(*) FROM award)               AS awardCount,
      (SELECT COUNT(*) FROM resource)            AS resourceCount,
      (SELECT COUNT(*) FROM resource_application) AS applicationCount
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error('Error getting admin stats:', err);
      res.status(500).json({ code: 500, msg: '获取统计数据失败' });
      return;
    }
    res.json({ code: 200, data: rows[0] });
  });
});

// 学生管理
app.get('/api/admin/students', (req, res) => {
  const { page = 1, pageSize = 10, search = '' } = req.query;
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);
  const offset = (pageNum - 1) * size;
  
  let sql = 'SELECT * FROM student_user';
  let countSql = 'SELECT COUNT(*) as total FROM student_user';
  
  if (search) {
    const searchCondition = ` WHERE username LIKE ? OR real_name LIKE ? OR college LIKE ?`;
    sql += searchCondition;
    countSql += searchCondition;
  }
  
  sql += ` LIMIT ? OFFSET ?`;
  
  const params = search ? [`%${search}%`, `%${search}%`, `%${search}%`, size, offset] : [size, offset];
  const countParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
  
  // 获取总数
  db.query(countSql, countParams, (err, countResult) => {
    if (err) {
      console.error('Error counting students:', err);
      res.status(500).json({ code: 500, msg: '获取学生列表失败' });
      return;
    }
    
    const total = countResult[0].total;
    
    // 获取学生列表
    db.query(sql, params, (err, result) => {
      if (err) {
        console.error('Error querying students:', err);
        res.status(500).json({ code: 500, msg: '获取学生列表失败' });
        return;
      }
      
      res.json({
        code: 200,
        data: {
          students: result,
          total
        }
      });
    });
  });
});

app.post('/api/admin/students', (req, res) => {
  const { id, username, password, real_name, phone, email, college } = req.body;
  
  if (!id || !username || !password) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }
  
  const sql = 'INSERT INTO student_user (id, username, password, real_name, phone, email, college) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [id, username, password, real_name, phone, email, college], (err, result) => {
    if (err) {
      console.error('Error adding student:', err);
      res.status(500).json({ code: 500, msg: '添加学生失败' });
      return;
    }
    
    res.json({ code: 200, msg: '添加学生成功' });
  });
});

app.put('/api/admin/students/:id', (req, res) => {
  const { id } = req.params;
  const { username, real_name, phone, email, college } = req.body;
  
  const sql = 'UPDATE student_user SET username = ?, real_name = ?, phone = ?, email = ?, college = ? WHERE id = ?';
  db.query(sql, [username, real_name, phone, email, college, id], (err, result) => {
    if (err) {
      console.error('Error updating student:', err);
      res.status(500).json({ code: 500, msg: '编辑学生失败' });
      return;
    }
    
    res.json({ code: 200, msg: '编辑学生成功' });
  });
});

app.delete('/api/admin/students/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM student_user WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting student:', err);
      res.status(500).json({ code: 500, msg: '删除学生失败' });
      return;
    }
    
    res.json({ code: 200, msg: '删除学生成功' });
  });
});

// 教师管理
app.get('/api/admin/teachers', (req, res) => {
  const { page = 1, pageSize = 10, search = '' } = req.query;
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);
  const offset = (pageNum - 1) * size;
  
  let sql = 'SELECT * FROM teacher_user';
  let countSql = 'SELECT COUNT(*) as total FROM teacher_user';
  
  if (search) {
    const searchCondition = ` WHERE username LIKE ? OR real_name LIKE ? OR college LIKE ?`;
    sql += searchCondition;
    countSql += searchCondition;
  }
  
  sql += ` LIMIT ? OFFSET ?`;
  
  const params = search ? [`%${search}%`, `%${search}%`, `%${search}%`, size, offset] : [size, offset];
  const countParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
  
  // 获取总数
  db.query(countSql, countParams, (err, countResult) => {
    if (err) {
      console.error('Error counting teachers:', err);
      res.status(500).json({ code: 500, msg: '获取教师列表失败' });
      return;
    }
    
    const total = countResult[0].total;
    
    // 获取教师列表
    db.query(sql, params, (err, result) => {
      if (err) {
        console.error('Error querying teachers:', err);
        res.status(500).json({ code: 500, msg: '获取教师列表失败' });
        return;
      }
      
      res.json({
        code: 200,
        data: {
          teachers: result,
          total
        }
      });
    });
  });
});

app.post('/api/admin/teachers', (req, res) => {
  const { id, username, password, real_name, phone, email, college } = req.body;
  
  if (!id || !username || !password) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }
  
  const sql = 'INSERT INTO teacher_user (id, username, password, real_name, phone, email, college) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [id, username, password, real_name, phone, email, college], (err, result) => {
    if (err) {
      console.error('Error adding teacher:', err);
      res.status(500).json({ code: 500, msg: '添加教师失败' });
      return;
    }
    
    res.json({ code: 200, msg: '添加教师成功' });
  });
});

app.put('/api/admin/teachers/:id', (req, res) => {
  const { id } = req.params;
  const { username, real_name, phone, email, college } = req.body;
  
  const sql = 'UPDATE teacher_user SET username = ?, real_name = ?, phone = ?, email = ?, college = ? WHERE id = ?';
  db.query(sql, [username, real_name, phone, email, college, id], (err, result) => {
    if (err) {
      console.error('Error updating teacher:', err);
      res.status(500).json({ code: 500, msg: '编辑教师失败' });
      return;
    }
    
    res.json({ code: 200, msg: '编辑教师成功' });
  });
});

app.delete('/api/admin/teachers/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM teacher_user WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting teacher:', err);
      res.status(500).json({ code: 500, msg: '删除教师失败' });
      return;
    }
    
    res.json({ code: 200, msg: '删除教师成功' });
  });
});



// 成果管理
app.get('/api/admin/results', (req, res) => {
  const { page = 1, pageSize = 10, search = '' } = req.query;
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);
  const offset = (pageNum - 1) * size;
  
  let sql = 'SELECT a.*, s.username as student_name FROM achievement a LEFT JOIN student_user s ON a.student_id = s.id';
  let countSql = 'SELECT COUNT(*) as total FROM achievement';
  
  if (search) {
    const searchCondition = ` WHERE a.title LIKE ? OR s.username LIKE ?`;
    sql += searchCondition;
    countSql += searchCondition;
  }
  
  sql += ` LIMIT ? OFFSET ?`;
  
  const params = search ? [`%${search}%`, `%${search}%`, size, offset] : [size, offset];
  const countParams = search ? [`%${search}%`, `%${search}%`] : [];
  
  // 获取总数
  db.query(countSql, countParams, (err, countResult) => {
    if (err) {
      console.error('Error counting results:', err);
      res.status(500).json({ code: 500, msg: '获取成果列表失败' });
      return;
    }
    
    const total = countResult[0].total;
    
    // 获取成果列表
    db.query(sql, params, (err, result) => {
      if (err) {
        console.error('Error querying results:', err);
        res.status(500).json({ code: 500, msg: '获取成果列表失败' });
        return;
      }
      
      res.json({
        code: 200,
        data: {
          results: result,
          total
        }
      });
    });
  });
});

app.get('/api/admin/results/:id', (req, res) => {
  const { id } = req.params;
  
  // 获取成果信息
  const resultSql = 'SELECT a.*, s.username as student_name FROM achievement a LEFT JOIN student_user s ON a.student_id = s.id WHERE a.id = ?';
  db.query(resultSql, [id], (err, resultResult) => {
    if (err) {
      console.error('Error getting result:', err);
      res.status(500).json({ code: 500, msg: '获取成果详情失败' });
      return;
    }
    
    if (resultResult.length === 0) {
      res.status(404).json({ code: 404, msg: '成果不存在' });
      return;
    }
    
    const result = resultResult[0];
    
    // 获取成果文件
    const fileSql = 'SELECT * FROM file WHERE achievement_id = ?';
    db.query(fileSql, [id], (err, fileResult) => {
      if (err) {
        console.error('Error getting result files:', err);
        res.status(500).json({ code: 500, msg: '获取成果文件失败' });
        return;
      }
      
      res.json({
        code: 200,
        data: {
          ...result,
          files: fileResult
        }
      });
    });
  });
});

app.delete('/api/admin/results/:id', (req, res) => {
  const { id } = req.params;
  
  // 先删除成果文件
  const deleteFilesSql = 'DELETE FROM file WHERE achievement_id = ?';
  db.query(deleteFilesSql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting result files:', err);
      res.status(500).json({ code: 500, msg: '删除成果失败' });
      return;
    }
    
    // 再删除成果
    const deleteResultSql = 'DELETE FROM achievement WHERE id = ?';
    db.query(deleteResultSql, [id], (err, result) => {
      if (err) {
        console.error('Error deleting result:', err);
        res.status(500).json({ code: 500, msg: '删除成果失败' });
        return;
      }
      
      res.json({ code: 200, msg: '删除成果成功' });
    });
  });
});

// 通知管理
app.get('/api/admin/notices', (req, res) => {
  // 确保表存在
  db.query(`CREATE TABLE IF NOT EXISTS notification (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(255) DEFAULT 'system',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
  )`, () => {
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const pageNum = parseInt(page) || 1;
    const size = parseInt(pageSize) || 10;
    const offset = (pageNum - 1) * size;

    let where = ''; const params = [];
    if (search) { where = ' WHERE title LIKE ?'; params.push('%' + search + '%'); }

    db.query('SELECT COUNT(*) as total FROM notification' + where, params, (err, cr) => {
      if (err) { res.json({ code: 200, data: { notices: [], total: 0 } }); return; }
      const total = cr[0]?.total || 0;
      db.query('SELECT * FROM notification' + where + ' ORDER BY create_time DESC LIMIT ? OFFSET ?', [...params, size, offset], (err2, result) => {
        if (err2) { res.json({ code: 200, data: { notices: [], total: 0 } }); return; }
        res.json({ code: 200, data: { notices: result || [], total } });
      });
    });
  });
});

app.post('/api/admin/notices', (req, res) => {
  const { title, content } = req.body;
  
  if (!title || !content) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }
  
  const sql = "INSERT INTO notification (title, content, type) VALUES (?, ?, 'system')";
  db.query(sql, [title, content], (err, result) => {
    if (err) {
      console.error('Error adding notice:', err);
      res.status(500).json({ code: 500, msg: '添加通知失败' });
      return;
    }
    
    res.json({ code: 200, msg: '添加通知成功' });
  });
});

app.put('/api/admin/notices/:id', (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  
  const sql = 'UPDATE notification SET title = ?, content = ? WHERE id = ?';
  db.query(sql, [title, content, id], (err, result) => {
    if (err) {
      console.error('Error updating notice:', err);
      res.status(500).json({ code: 500, msg: '编辑通知失败' });
      return;
    }
    
    res.json({ code: 200, msg: '编辑通知成功' });
  });
});

app.delete('/api/admin/notices/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM notification WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting notice:', err);
      res.status(500).json({ code: 500, msg: '删除通知失败' });
      return;
    }
    
    res.json({ code: 200, msg: '删除通知成功' });
  });
});

// 资源管理
app.get('/api/admin/resources', (req, res) => {
  const { page = 1, pageSize = 10, search = '' } = req.query;
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);
  const offset = (pageNum - 1) * size;
  
  let sql = 'SELECT * FROM resource';
  let countSql = 'SELECT COUNT(*) as total FROM resource';
  
  if (search) {
    const searchCondition = ` WHERE title LIKE ? OR type LIKE ?`;
    sql += searchCondition;
    countSql += searchCondition;
  }
  
  sql += ` LIMIT ? OFFSET ?`;
  
  const params = search ? [`%${search}%`, `%${search}%`, size, offset] : [size, offset];
  const countParams = search ? [`%${search}%`, `%${search}%`] : [];
  
  // 获取总数
  db.query(countSql, countParams, (err, countResult) => {
    if (err) {
      console.error('Error counting resources:', err);
      res.status(500).json({ code: 500, msg: '获取资源列表失败' });
      return;
    }
    
    const total = countResult[0].total;
    
    // 获取资源列表
    db.query(sql, params, (err, result) => {
      if (err) {
        console.error('Error querying resources:', err);
        res.status(500).json({ code: 500, msg: '获取资源列表失败' });
        return;
      }
      
      res.json({
        code: 200,
        data: {
          resources: result,
          total
        }
      });
    });
  });
});

app.post('/api/admin/resources', upload.single('resourceFile'), (req, res) => {
  const { title, type, description, provider } = req.body;
  const file = req.file;
  
  if (!title || !type) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }
  
  let filePath = '';
  if (file) {
    filePath = file.path;
  }
  
  const sql = 'INSERT INTO resource (title, type, description, provider, file_path) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [title, type, description, provider, filePath], (err, result) => {
    if (err) {
      console.error('Error adding resource:', err);
      res.status(500).json({ code: 500, msg: '添加资源失败' });
      return;
    }
    
    res.json({ code: 200, msg: '添加资源成功' });
  });
});

app.put('/api/admin/resources/:id', upload.single('resourceFile'), (req, res) => {
  const { id } = req.params;
  const { title, type, description, provider } = req.body;
  const file = req.file;
  
  let updateSql = 'UPDATE resource SET title = ?, type = ?, description = ?, provider = ?';
  const params = [title, type, description, provider];
  
  if (file) {
    updateSql += ', file_path = ?';
    params.push(file.path);
  }
  
  updateSql += ' WHERE id = ?';
  params.push(id);
  
  db.query(updateSql, params, (err, result) => {
    if (err) {
      console.error('Error updating resource:', err);
      res.status(500).json({ code: 500, msg: '编辑资源失败' });
      return;
    }
    
    res.json({ code: 200, msg: '编辑资源成功' });
  });
});

app.delete('/api/admin/resources/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM resource WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting resource:', err);
      res.status(500).json({ code: 500, msg: '删除资源失败' });
      return;
    }
    
    res.json({ code: 200, msg: '删除资源成功' });
  });
});

// 获奖管理
app.get('/api/admin/awards', (req, res) => {
  const { page = 1, pageSize = 10, search = '' } = req.query;
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);
  const offset = (pageNum - 1) * size;
  
  let sql = 'SELECT a.*, s.username as student_name FROM award a LEFT JOIN student_user s ON a.student_id = s.id';
  let countSql = 'SELECT COUNT(*) as total FROM award';
  
  if (search) {
    const searchCondition = ` WHERE a.title LIKE ? OR s.username LIKE ?`;
    sql += searchCondition;
    countSql += searchCondition;
  }
  
  sql += ` LIMIT ? OFFSET ?`;
  
  const params = search ? [`%${search}%`, `%${search}%`, size, offset] : [size, offset];
  const countParams = search ? [`%${search}%`, `%${search}%`] : [];
  
  // 获取总数
  db.query(countSql, countParams, (err, countResult) => {
    if (err) {
      console.error('Error counting awards:', err);
      res.status(500).json({ code: 500, msg: '获取获奖列表失败' });
      return;
    }
    
    const total = countResult[0].total;
    
    // 获取获奖列表
    db.query(sql, params, (err, result) => {
      if (err) {
        console.error('Error querying awards:', err);
        res.status(500).json({ code: 500, msg: '获取获奖列表失败' });
        return;
      }
      
      res.json({
        code: 200,
        data: {
          awards: result,
          total
        }
      });
    });
  });
});

app.get('/api/admin/awards/:id', (req, res) => {
  const { id } = req.params;
  
  // 获取获奖信息
  const awardSql = 'SELECT a.*, s.username as student_name FROM award a LEFT JOIN student_user s ON a.student_id = s.id WHERE a.id = ?';
  db.query(awardSql, [id], (err, awardResult) => {
    if (err) {
      console.error('Error getting award:', err);
      res.status(500).json({ code: 500, msg: '获取获奖详情失败' });
      return;
    }
    
    if (awardResult.length === 0) {
      res.status(404).json({ code: 404, msg: '获奖信息不存在' });
      return;
    }
    
    const award = awardResult[0];
    
    // 获取获奖文件
    const fileSql = 'SELECT * FROM award_file WHERE award_id = ?';
    db.query(fileSql, [id], (err, fileResult) => {
      if (err) {
        console.error('Error getting award files:', err);
        res.status(500).json({ code: 500, msg: '获取获奖文件失败' });
        return;
      }
      
      res.json({
        code: 200,
        data: {
          ...award,
          files: fileResult
        }
      });
    });
  });
});

app.delete('/api/admin/awards/:id', (req, res) => {
  const { id } = req.params;
  
  // 先删除获奖文件
  const deleteFilesSql = 'DELETE FROM award_file WHERE award_id = ?';
  db.query(deleteFilesSql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting award files:', err);
      res.status(500).json({ code: 500, msg: '删除获奖记录失败' });
      return;
    }
    
    // 再删除获奖
    const deleteAwardSql = 'DELETE FROM award WHERE id = ?';
    db.query(deleteAwardSql, [id], (err, result) => {
      if (err) {
        console.error('Error deleting award:', err);
        res.status(500).json({ code: 500, msg: '删除获奖记录失败' });
        return;
      }
      
      res.json({ code: 200, msg: '删除获奖记录成功' });
    });
  });
});

// 系统设置
app.get('/api/admin/system-settings', (req, res) => {
  res.json({
    code: 200,
    data: {
      systemName: '校园社团成果展示与孵化系统',
      systemVersion: '1.0.0',
      systemDescription: '用于展示和孵化校园社团成果的系统',
      contactEmail: 'admin@example.com',
      contactPhone: '1234567890'
    }
  });
});

app.put('/api/admin/system-settings', (req, res) => {
  const { systemName, systemVersion, systemDescription, contactEmail, contactPhone } = req.body;
  
  // 这里可以实现保存系统设置的逻辑
  res.json({ code: 200, msg: '保存系统设置成功' });
});

app.get('/api/admin/database-settings', (req, res) => {
  res.json({
    code: 200,
    data: {
      host: 'localhost',
      port: '3306',
      database: '23db',
      username: 'root',
      password: 'root'
    }
  });
});

app.put('/api/admin/database-settings', (req, res) => {
  const { host, port, database, username, password } = req.body;
  
  // 这里可以实现保存数据库设置的逻辑
  res.json({ code: 200, msg: '保存数据库设置成功' });
});

app.get('/api/admin/file-settings', (req, res) => {
  res.json({
    code: 200,
    data: {
      uploadDir: './uploads',
      maxFileSize: '50',
      allowedFileTypes: 'pdf,doc,docx,zip,rar,jpg,png,jpeg'
    }
  });
});

app.put('/api/admin/file-settings', (req, res) => {
  const { uploadDir, maxFileSize, allowedFileTypes } = req.body;
  
  // 这里可以实现保存文件上传设置的逻辑
  res.json({ code: 200, msg: '保存文件上传设置成功' });
});

// 管理员注销账号
app.delete('/api/admin/delete-account', (req, res) => {
  const { adminId } = req.body;
  
  if (!adminId) {
    res.status(400).json({ code: 400, msg: '缺少必要参数' });
    return;
  }
  
  const sql = 'DELETE FROM admin_user WHERE id = ?';
  db.query(sql, [adminId], (err, result) => {
    if (err) {
      console.error('Error deleting admin account:', err);
      res.status(500).json({ code: 500, msg: '注销账号失败' });
      return;
    }
    
    res.json({ code: 200, msg: '账号注销成功' });
  });
});



// ==================== 管理员 - 专家管理 ====================
app.get('/api/admin/experts', (req, res) => {
  const { search, page = 1, pageSize = 10 } = req.query;
  let where = ''; const params = [];
  if (search) { where = ' WHERE username LIKE ? OR real_name LIKE ? OR field LIKE ? OR title LIKE ? OR organization LIKE ?'; params.push(...Array(5).fill('%' + search + '%')); }
  db.query('SELECT COUNT(*) AS total FROM expert_user' + where, params, (err, cr) => {
    if (err) { res.status(500).json({ code: 500, msg: '查询失败' }); return; }
    const total = cr[0].total;
    const offset = (page - 1) * pageSize;
    db.query('SELECT * FROM expert_user' + where + ' ORDER BY create_time DESC LIMIT ? OFFSET ?', [...params, parseInt(pageSize), offset], (err2, result) => {
      if (err2) { res.status(500).json({ code: 500, msg: '查询失败' }); return; }
      res.json({ code: 200, data: { experts: result || [], total } });
    });
  });
});
app.post('/api/admin/experts', (req, res) => {
  const { username, password, real_name, email, phone, field, title, organization } = req.body;
  if (!username || !password) { res.status(400).json({ code: 400, msg: '缺少必要参数' }); return; }
  db.query('SELECT id FROM expert_user WHERE username = ?', [username], (err, r) => {
    if (err) { res.status(500).json({ code: 500, msg: '查询失败' }); return; }
    if (r.length > 0) { res.json({ code: 400, msg: '用户名已存在' }); return; }
    db.query('INSERT INTO expert_user (username,password,real_name,email,phone,field,title,organization) VALUES (?,?,?,?,?,?,?,?)',
      [username,password,real_name||'',email||'',phone||'',field||'',title||'',organization||''], (err2) => {
        if (err2) { res.status(500).json({ code: 500, msg: '添加失败' }); return; }
        res.json({ code: 200, msg: '添加成功' });
      });
  });
});
app.put('/api/admin/experts/:id', (req, res) => {
  const { username, password, real_name, email, phone, field, title, organization } = req.body;
  let sql = 'UPDATE expert_user SET real_name=?,email=?,phone=?,field=?,title=?,organization=?';
  const params = [real_name||'',email||'',phone||'',field||'',title||'',organization||''];
  if (password) { sql += ',password=?'; params.push(password); }
  sql += ' WHERE id=?'; params.push(req.params.id);
  db.query(sql, params, (err) => { if (err) { res.status(500).json({ code: 500, msg: '更新失败' }); return; } res.json({ code: 200, msg: '更新成功' }); });
});
app.delete('/api/admin/experts/:id', (req, res) => {
  db.query('DELETE FROM expert_user WHERE id = ?', [req.params.id], (err) => { if (err) { res.status(500).json({ code: 500, msg: '删除失败' }); return; } res.json({ code: 200, msg: '删除成功' }); });
});

// ==================== 管理员 - 企业管理 ====================
app.get('/api/admin/enterprises', (req, res) => {
  const { search, page = 1, pageSize = 10 } = req.query;
  let where = ''; const params = [];
  if (search) { where = ' WHERE company_name LIKE ? OR username LIKE ? OR industry LIKE ?'; params.push(...Array(3).fill('%' + search + '%')); }
  db.query('SELECT COUNT(*) AS total FROM enterprise_user' + where, params, (err, cr) => {
    if (err) { res.status(500).json({ code: 500, msg: '查询失败' }); return; }
    const total = cr[0].total;
    const offset = (page - 1) * pageSize;
    db.query('SELECT * FROM enterprise_user' + where + ' ORDER BY create_time DESC LIMIT ? OFFSET ?', [...params, parseInt(pageSize), offset], (err2, result) => {
      if (err2) { res.status(500).json({ code: 500, msg: '查询失败' }); return; }
      res.json({ code: 200, data: { enterprises: result || [], total } });
    });
  });
});
app.post('/api/admin/enterprises', (req, res) => {
  const { username, password, real_name, email, company_name, industry, address } = req.body;
  if (!username || !password || !company_name) { res.status(400).json({ code: 400, msg: '缺少必要参数' }); return; }
  db.query('SELECT id FROM enterprise_user WHERE username = ?', [username], (err, r) => {
    if (err) { res.status(500).json({ code: 500, msg: '查询失败' }); return; }
    if (r.length > 0) { res.json({ code: 400, msg: '用户名已存在' }); return; }
    db.query('INSERT INTO enterprise_user (username,password,real_name,email,company_name,industry,address) VALUES (?,?,?,?,?,?,?)',
      [username,password,real_name||'',email||'',company_name,industry||'',address||''], (err2) => {
        if (err2) { res.status(500).json({ code: 500, msg: '添加失败' }); return; }
        res.json({ code: 200, msg: '添加成功' });
      });
  });
});
app.put('/api/admin/enterprises/:id', (req, res) => {
  const { username, password, real_name, email, company_name, industry, address } = req.body;
  let sql = 'UPDATE enterprise_user SET real_name=?,email=?,company_name=?,industry=?,address=?';
  const params = [real_name||'',email||'',company_name||'',industry||'',address||''];
  if (password) { sql += ',password=?'; params.push(password); }
  sql += ' WHERE id=?'; params.push(req.params.id);
  db.query(sql, params, (err) => { if (err) { res.status(500).json({ code: 500, msg: '更新失败' }); return; } res.json({ code: 200, msg: '更新成功' }); });
});
app.delete('/api/admin/enterprises/:id', (req, res) => {
  db.query('DELETE FROM enterprise_user WHERE id = ?', [req.params.id], (err) => { if (err) { res.status(500).json({ code: 500, msg: '删除失败' }); return; } res.json({ code: 200, msg: '删除成功' }); });
});

// 管理员查看所有评审记录
app.get('/api/admin/reviews', (req, res) => {
  const sql = `SELECT er.id, er.achievement_id AS achievementId, a.title AS achievementTitle,
    er.score, er.comment, er.conclusion, er.review_type AS reviewType, er.review_time
    FROM expert_reviews er LEFT JOIN achievement a ON er.achievement_id = a.id
    ORDER BY er.review_time DESC`;
  db.query(sql, (err, result) => {
    if (err) { res.status(500).json({ code: 500, msg: '获取失败' }); return; }
    res.json({ code: 200, data: result || [] });
  });
});

// 管理员查看所有资源申请
app.get('/api/admin/applications', (req, res) => {
  const sql = `SELECT ra.id, r.title AS resourceTitle, ra.student_name AS studentName,
    ra.student_college AS studentCollege, ra.status, ra.application_time AS applicationTime
    FROM resource_application ra LEFT JOIN resource r ON ra.resource_id = r.id
    ORDER BY ra.application_time DESC`;
  db.query(sql, (err, result) => {
    if (err) { res.status(500).json({ code: 500, msg: '获取失败' }); return; }
    res.json({ code: 200, data: result || [] });
  });
});

// 获取学生通知列表
app.get('/api/notifications', (req, res) => {
  db.query(`CREATE TABLE IF NOT EXISTS notification (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(255) DEFAULT 'system',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
  )`, () => {
    db.query('SELECT * FROM notification ORDER BY create_time DESC LIMIT 20', (err, result) => {
      if (err) { res.json({ code: 200, data: [] }); return; }
      res.json({ code: 200, data: result || [] });
    });
  });
});

// ==================== 专家通知 ====================
// 通知列表（字段与前端一致：type / title / content / is_read / related_id / create_time）
app.get('/api/expert/notifications/:expertId', (req, res) => {
  const expertId = Number(req.params.expertId) || 0;
  const sql = 'SELECT * FROM expert_notifications WHERE expert_id = ? ORDER BY is_read ASC, create_time DESC';
  db.query(sql, [expertId], (err, rows) => {
    if (err) {
      console.error('获取专家通知失败:', err);
      res.status(500).json({ code: 500, msg: '获取通知失败' });
      return;
    }
    res.json({ code: 200, data: rows || [] });
  });
});

// 标记单条已读
app.put('/api/expert/notifications/:id/read', (req, res) => {
  db.query('UPDATE expert_notifications SET is_read = 1 WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      console.error('标记通知已读失败:', err);
      res.status(500).json({ code: 500, msg: '标记已读失败' });
      return;
    }
    res.json({ code: 200, msg: '已读' });
  });
});

// 创建专家通知表，并依据真实待评审成果生成评审任务提醒（幂等）
const createExpertNotificationsTable = () => {
  const tableSql = `
    CREATE TABLE IF NOT EXISTS expert_notifications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      expert_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      type ENUM('review_task','system','reminder') DEFAULT 'review_task',
      is_read TINYINT DEFAULT 0,
      related_id INT DEFAULT NULL,
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_expert_type_related (expert_id, type, related_id)
    )
  `;
  db.query(tableSql, (err) => {
    if (err) {
      console.error('Error creating expert_notifications table:', err);
      return;
    }
    const seedSql = `
      INSERT IGNORE INTO expert_notifications (expert_id, title, content, type, related_id)
      SELECT e.id, CONCAT('待评审成果：', a.title),
             CONCAT('成果「', a.title, '」等待评审，请及时处理。'),
             'review_task', a.id
      FROM expert_user e
      JOIN achievement a ON COALESCE(a.review_status, 0) = 0
    `;
    db.query(seedSql, (err2) => {
      if (err2) console.error('生成专家评审提醒失败:', err2);
    });
  });
};

// 创建club表
const createClubTable = () => {
  const clubTableSql = `
    CREATE TABLE IF NOT EXISTS club (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  
  db.query(clubTableSql, (err, result) => {
    if (err) {
      console.error('Error creating club table:', err);
    } else {
      console.log('Club table created or already exists');
    }
  });
};

// ==================== 可视化数据接口（真实聚合，无 Mock） ====================
// Promise 化查询
const vq = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });

// 最近 n 个月的 'YYYY-MM' 标签
const vRecentMonths = (n = 12) => {
  const labels = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return labels;
};

// 将 [{ym,value}] 按连续月份补零
const vFillMonths = (rows, months) => {
  const map = new Map(rows.map((r) => [String(r.ym), Number(r.value)]));
  return months.map((m) => map.get(m) || 0);
};

// 可视化总览：按角色返回真实统计 + 多维分布 + 趋势
app.get('/api/visualization/dashboard', async (req, res) => {
  try {
    const userType = String(req.query.userType || 'admin');
    const userId = Number(req.query.userId) || 0;
    // 学生只看自己的数据；教师/管理员看全量
    const personal = userType === 'student' && userId > 0;
    const A = personal ? 'WHERE student_id = ?' : '';
    const A2 = personal ? 'WHERE a.student_id = ?' : '';
    const P = personal ? [userId] : [];

    const months = vRecentMonths(12);
    const achMonthWhere = personal
      ? 'WHERE student_id = ? AND create_time >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)'
      : 'WHERE create_time >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)';
    const appMonthWhere = personal
      ? 'WHERE student_id = ? AND application_time >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)'
      : 'WHERE application_time >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)';
    const appScope = personal ? 'WHERE student_id = ?' : '';

    const [
      kpiRows, typeDist, orgDist, collegeDist, reviewDist, incubationDist, scoreDist,
      achMonthly, awardLevelDist, awardYearly, awardOrgDist,
      resTypeDist, resStatusDist, resTop, resTotals,
      appStatusDist, appMonthly,
    ] = await Promise.all([
      vq(
        `SELECT
           (SELECT COUNT(*) FROM achievement ${A}) AS achievementCount,
           (SELECT COUNT(*) FROM student_user) AS studentCount,
           (SELECT COUNT(*) FROM teacher_user) AS teacherCount,
           (SELECT COUNT(*) FROM club) AS clubCount,
           (SELECT COUNT(*) FROM award ${A}) AS awardCount,
           (SELECT COUNT(*) FROM resource) AS resourceCount,
           (SELECT COUNT(*) FROM resource_application ${appScope}) AS applicationCount,
           (SELECT COUNT(*) FROM enterprise_user) AS enterpriseCount,
           (SELECT COUNT(*) FROM expert_user) AS expertCount,
           (SELECT COALESCE(SUM(view_count),0) FROM achievement ${A}) AS viewTotal,
           (SELECT COUNT(*) FROM achievement ${personal ? 'WHERE student_id = ? AND' : 'WHERE'} review_status = 0) AS reviewPending,
           (SELECT COUNT(*) FROM achievement ${personal ? 'WHERE student_id = ? AND' : 'WHERE'} incubation_status = 1) AS incubationOngoing,
           (SELECT COUNT(*) FROM achievement ${personal ? 'WHERE student_id = ? AND' : 'WHERE'} incubation_status = 2) AS incubationDone,
           (SELECT COUNT(*) FROM resource_application ${personal ? "WHERE student_id = ? AND status <> '已通过' AND status <> '已拒绝'" : "WHERE status <> '已通过' AND status <> '已拒绝'"}) AS applicationPending,
           (SELECT COUNT(*) FROM likes ${personal ? 'JOIN achievement a ON likes.achievement_id = a.id WHERE a.student_id = ?' : ''}) AS likeCount,
           (SELECT COUNT(*) FROM comment ${personal ? 'JOIN achievement a ON comment.achievement_id = a.id WHERE a.student_id = ?' : ''}) AS commentCount`,
        personal ? new Array(10).fill(userId) : []
      ),
      vq(`SELECT COALESCE(NULLIF(type,''),'未分类') AS name, COUNT(*) AS value FROM achievement ${A} GROUP BY name ORDER BY value DESC`, P),
      vq(`SELECT COALESCE(NULLIF(a.community_name,''), NULLIF(a.college,''), NULLIF(s.college,''), '未标注') AS name, COUNT(*) AS value FROM achievement a LEFT JOIN student_user s ON a.student_id = s.id ${A2} GROUP BY name ORDER BY value DESC`, P),
      vq(`SELECT COALESCE(NULLIF(a.college,''), NULLIF(s.college,''), '未标注') AS name, COUNT(*) AS value FROM achievement a LEFT JOIN student_user s ON a.student_id = s.id ${A2} GROUP BY name ORDER BY value DESC`, P),
      vq(`SELECT CASE review_status WHEN 0 THEN '待审核' WHEN 1 THEN '评审中' WHEN 2 THEN '已通过' WHEN 3 THEN '已打回' ELSE '未提交' END AS name, COUNT(*) AS value FROM achievement ${A} GROUP BY name`, P),
      vq(`SELECT CASE incubation_status WHEN 0 THEN '培育中' WHEN 1 THEN '已落地' WHEN 2 THEN '已终止' ELSE '未开始' END AS name, COUNT(*) AS value FROM achievement ${A} GROUP BY name`, P),
      vq(`SELECT CASE WHEN score IS NULL THEN '未评分' WHEN score < 60 THEN '60分以下' WHEN score < 70 THEN '60-69分' WHEN score < 80 THEN '70-79分' WHEN score < 90 THEN '80-89分' ELSE '90分以上' END AS name, COUNT(*) AS value FROM achievement ${A} GROUP BY name`, P),
      vq(`SELECT DATE_FORMAT(create_time,'%Y-%m') AS ym, COUNT(*) AS value FROM achievement ${achMonthWhere} GROUP BY ym`, P),
      vq(`SELECT COALESCE(NULLIF(level,''),'未定级') AS name, COUNT(*) AS value FROM award ${A} GROUP BY name ORDER BY value DESC`, P),
      vq(`SELECT YEAR(award_time) AS ym, COUNT(*) AS value FROM award ${personal ? 'WHERE student_id = ? AND award_time IS NOT NULL' : 'WHERE award_time IS NOT NULL'} GROUP BY ym ORDER BY ym`, P),
      vq(`SELECT COALESCE(NULLIF(college,''),'未标注') AS name, COUNT(*) AS value FROM award ${A} GROUP BY name ORDER BY value DESC`, P),
      vq(`SELECT COALESCE(NULLIF(type,''),'未分类') AS name, COUNT(*) AS value FROM resource GROUP BY name ORDER BY value DESC`),
      vq(`SELECT COALESCE(NULLIF(status,''),'未知') AS name, COUNT(*) AS value FROM resource GROUP BY name`),
      vq(`SELECT title, COALESCE(apply_count,0) AS applyCount, COALESCE(view_count,0) AS viewCount FROM resource ORDER BY apply_count DESC, view_count DESC LIMIT 10`),
      vq(`SELECT COALESCE(SUM(view_count),0) AS totalViews, COALESCE(SUM(apply_count),0) AS totalApplies FROM resource`),
      vq(`SELECT COALESCE(NULLIF(status,''),'待审核') AS name, COUNT(*) AS value FROM resource_application ${appScope} GROUP BY name`, P),
      vq(`SELECT DATE_FORMAT(application_time,'%Y-%m') AS ym, COUNT(*) AS value FROM resource_application ${appMonthWhere} GROUP BY ym`, P),
    ]);

    const scoreOrder = ['90分以上', '80-89分', '70-79分', '60-69分', '60分以下', '未评分'];
    const sortByOrder = (rows, order) =>
      [...rows].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
    // 统一转成数字，避免 mysql2 对聚合值返回字符串
    const kpis = Object.fromEntries(
      Object.entries(kpiRows[0] || {}).map(([k, v]) => [k, Number(v) || 0])
    );

    res.json({
      code: 200,
      data: {
        role: userType,
        scope: personal ? 'personal' : 'global',
        generatedAt: new Date().toISOString(),
        kpis,
        achievement: {
          typeDist,
          orgDist,
          collegeDist,
          reviewStatusDist: sortByOrder(reviewDist, ['待审核', '评审中', '已通过', '已打回', '未提交']),
          incubationStatusDist: sortByOrder(incubationDist, ['培育中', '已落地', '已终止', '未开始']),
          scoreDist: sortByOrder(scoreDist, scoreOrder),
          monthly: { labels: months, values: vFillMonths(achMonthly, months) },
        },
        award: {
          levelDist: awardLevelDist,
          yearly: {
            labels: awardYearly.map((r) => String(r.ym)),
            values: awardYearly.map((r) => Number(r.value)),
          },
          orgDist: awardOrgDist,
        },
        resource: {
          typeDist: resTypeDist,
          statusDist: resStatusDist,
          topApplied: resTop,
          totalViews: Number(resTotals[0]?.totalViews || 0),
          totalApplies: Number(resTotals[0]?.totalApplies || 0),
        },
        application: {
          statusDist: appStatusDist,
          monthly: { labels: months, values: vFillMonths(appMonthly, months) },
        },
      },
    });
  } catch (err) {
    console.error('Error building visualization dashboard:', err);
    res.status(500).json({ code: 500, msg: '获取可视化数据失败' });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  // 创建notification表
  createNotificationTable();
  // 创建获奖相关表
  createAwardTables();
  // 创建管理员表
  createAdminTable();
  // 创建club表
  createClubTable();
  // 创建专家通知表
  createExpertNotificationsTable();
});

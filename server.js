import express from 'express';
import mysql from 'mysql2';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

// JWT配置
const secretKey = 'your-secret-key'; // 实际应用中应使用环境变量

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
  password: 'root',
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
  const sql = 'SELECT * FROM student_user WHERE username = ? AND password = ?';
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
  const sql = 'SELECT * FROM teacher_user WHERE username = ? AND password = ?';
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
  
  // 从user表中查询管理员信息（user_type='admin'）
  const sql = 'SELECT * FROM user WHERE username = ? AND user_type = ?';
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

app.post('/api/auth/delete', (req, res) => {
  console.log('接收到注销请求');
  res.json({
    code: 200,
    msg: '注销成功'
  });
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

// 获取成果详情
app.get('/api/result/detail/:id', (req, res) => {
  console.log('接收到获取成果详情请求，ID:', req.params.id);
  const { id } = req.params;

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
      res.json({
        code: 200,
        data: {
          ...achievement,
          clubFiles: clubFiles,
          achievementFiles: achievementFiles
        }
      });
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

// 专家评审打回
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
      type VARCHAR(255) NOT NULL,
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

// 资源相关接口
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
  const sql = 'INSERT INTO resource_application (resource_id, student_id, student_name, student_college) VALUES (?, ?, ?, ?)';
  db.query(sql, [resourceId, studentId, studentName, studentCollege], (err, results) => {
    if (err) {
      console.error('申请资源失败:', err);
      res.status(500).json({ code: 500, msg: '申请资源失败' });
      return;
    }
    // 更新资源的申请次数
    const updateSql = 'UPDATE resource SET apply_count = apply_count + 1 WHERE id = ?';
    db.query(updateSql, [resourceId], (updateErr) => {
      if (updateErr) {
        console.error('更新资源申请次数失败:', updateErr);
      }
    });
    res.json({ code: 200, msg: '申请提交成功' });
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

// 获取管理员统计数据
app.get('/api/admin/stats', (req, res) => {
  // 这里可以实现获取统计数据的逻辑
  res.json({
    code: 200,
    data: {
      studentCount: 100,
      teacherCount: 50,
      clubCount: 20,
      resultCount: 150,
      awardCount: 80,
      resourceCount: 120
    }
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
  const { page = 1, pageSize = 10, search = '' } = req.query;
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);
  const offset = (pageNum - 1) * size;
  
  let sql = 'SELECT * FROM notification';
  let countSql = 'SELECT COUNT(*) as total FROM notification';
  
  if (search) {
    const searchCondition = ` WHERE title LIKE ?`;
    sql += searchCondition;
    countSql += searchCondition;
  }
  
  sql += ` ORDER BY create_time DESC LIMIT ? OFFSET ?`;
  
  const params = search ? [`%${search}%`, size, offset] : [size, offset];
  const countParams = search ? [`%${search}%`] : [];
  
  // 获取总数
  db.query(countSql, countParams, (err, countResult) => {
    if (err) {
      console.error('Error counting notices:', err);
      res.status(500).json({ code: 500, msg: '获取通知列表失败' });
      return;
    }
    
    const total = countResult[0].total;
    
    // 获取通知列表
    db.query(sql, params, (err, result) => {
      if (err) {
        console.error('Error querying notices:', err);
        res.status(500).json({ code: 500, msg: '获取通知列表失败' });
        return;
      }
      
      res.json({
        code: 200,
        data: {
          notices: result,
          total
        }
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
  
  const sql = 'INSERT INTO notification (title, content) VALUES (?, ?)';
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
});

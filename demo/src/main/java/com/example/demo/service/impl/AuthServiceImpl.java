package com.example.demo.service.impl;

import com.example.demo.entity.AdminUser;
import com.example.demo.entity.StudentUser;
import com.example.demo.entity.TeacherUser;
import com.example.demo.repository.AdminUserRepository;
import com.example.demo.repository.StudentUserRepository;
import com.example.demo.repository.TeacherUserRepository;
import com.example.demo.service.AuthService;
import com.example.demo.util.JwtUtil;
import com.example.demo.vo.LoginVO;
import com.example.demo.vo.RegisterVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AuthServiceImpl implements AuthService {

    @Value("${wechat.app-id:wxf41b0159f69b064b}")
    private String wechatAppId;

    @Value("${wechat.app-secret:}")
    private String wechatAppSecret;

    @Autowired
    private StudentUserRepository studentUserRepository;
    @Autowired
    private TeacherUserRepository teacherUserRepository;
    @Autowired
    private AdminUserRepository adminUserRepository;
    @Autowired
    private BCryptPasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    // ==================== 密码兼容 ====================

    /** 兼容 BCrypt 与历史明文密码 */
    private boolean passwordMatches(String raw, String stored) {
        if (raw == null || stored == null) {
            return false;
        }
        if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
            return passwordEncoder.matches(raw, stored);
        }
        return stored.equals(raw);
    }

    private String encodeIfPlain(String raw, String stored) {
        if (stored != null && stored.startsWith("$2")) {
            return stored;
        }
        return passwordEncoder.encode(raw);
    }

    // ==================== 学生登录 ====================
    @Override
    public String loginStudent(LoginVO loginVO) {
        StudentUser student = studentUserRepository.findByUsername(loginVO.getUsername());
        if (student == null) {
            throw new RuntimeException("学生用户不存在");
        }
        if (!passwordMatches(loginVO.getPassword(), student.getPassword())) {
            throw new RuntimeException("密码错误");
        }
        if (student.getPassword() == null || !student.getPassword().startsWith("$2")) {
            student.setPassword(passwordEncoder.encode(loginVO.getPassword()));
            studentUserRepository.save(student);
        }
        return jwtUtil.generateToken(student.getId(), student.getUsername(), "student", student.getCollege());
    }

    // ==================== 教师登录 ====================
    @Override
    public String loginTeacher(LoginVO loginVO) {
        TeacherUser teacher = teacherUserRepository.findByUsername(loginVO.getUsername());
        if (teacher == null) {
            throw new RuntimeException("教师用户不存在");
        }
        if (!passwordMatches(loginVO.getPassword(), teacher.getPassword())) {
            throw new RuntimeException("密码错误");
        }
        if (teacher.getPassword() == null || !teacher.getPassword().startsWith("$2")) {
            teacher.setPassword(passwordEncoder.encode(loginVO.getPassword()));
            teacherUserRepository.save(teacher);
        }
        return jwtUtil.generateToken(teacher.getId(), teacher.getUsername(), "teacher", teacher.getCollege());
    }

    // ==================== 管理员登录 ====================
    @Override
    public String loginAdmin(LoginVO loginVO) {
        AdminUser admin = adminUserRepository.findByUsername(loginVO.getUsername());
        if (admin != null) {
            if (!passwordMatches(loginVO.getPassword(), admin.getPassword())) {
                throw new RuntimeException("密码错误");
            }
            return jwtUtil.generateToken(admin.getId(), admin.getUsername(), "admin", null);
        }

        // 兼容 Express 注册在 user 表里的管理员
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id, username, password FROM user WHERE username = ? AND user_type = 'admin' LIMIT 1",
                loginVO.getUsername());
        if (rows.isEmpty()) {
            throw new RuntimeException("管理员用户不存在");
        }
        Map<String, Object> row = rows.get(0);
        String stored = String.valueOf(row.get("password"));
        if (!passwordMatches(loginVO.getPassword(), stored)) {
            throw new RuntimeException("密码错误");
        }
        if (!stored.startsWith("$2")) {
            jdbcTemplate.update("UPDATE user SET password = ? WHERE id = ?",
                    passwordEncoder.encode(loginVO.getPassword()), row.get("id"));
        }
        return jwtUtil.generateToken(((Number) row.get("id")).longValue(), String.valueOf(row.get("username")), "admin", null);
    }

    // ==================== 专家登录 ====================
    @Override
    public String loginExpert(LoginVO loginVO) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT * FROM expert_user WHERE username = ? LIMIT 1", loginVO.getUsername());
        if (rows.isEmpty()) {
            throw new RuntimeException("专家用户不存在");
        }
        return loginFromRow(rows.get(0), "expert", loginVO.getPassword());
    }

    // ==================== 企业登录 ====================
    @Override
    public String loginEnterprise(LoginVO loginVO) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT * FROM enterprise_user WHERE username = ? LIMIT 1", loginVO.getUsername());
        if (rows.isEmpty()) {
            throw new RuntimeException("企业用户不存在");
        }
        return loginFromRow(rows.get(0), "enterprise", loginVO.getPassword());
    }

    private String loginFromRow(Map<String, Object> row, String userType, String rawPassword) {
        Object status = row.get("status");
        if (status instanceof Number && ((Number) status).intValue() == 0) {
            throw new RuntimeException("账号已注销，无法登录");
        }
        String stored = row.get("password") == null ? null : String.valueOf(row.get("password"));
        if (!passwordMatches(rawPassword, stored)) {
            throw new RuntimeException("密码错误");
        }
        Long id = ((Number) row.get("id")).longValue();
        String username = String.valueOf(row.get("username"));
        String college = row.get("college") == null ? "" : String.valueOf(row.get("college"));
        if (!stored.startsWith("$2")) {
            String table = "expert".equals(userType) ? "expert_user" : "enterprise_user";
            jdbcTemplate.update("UPDATE " + table + " SET password = ? WHERE id = ?",
                    passwordEncoder.encode(rawPassword), id);
        }
        return jwtUtil.generateToken(id, username, userType, college);
    }

    // ==================== 注册 ====================
    @Override
    public void register(String userType, RegisterVO registerVO) {
        if (registerVO.getUsername() == null || registerVO.getUsername().trim().isEmpty()) {
            throw new RuntimeException("用户名不能为空");
        }
        if (registerVO.getPassword() == null || registerVO.getPassword().length() < 6) {
            throw new RuntimeException("密码至少 6 位");
        }
        String username = registerVO.getUsername().trim();
        String encodedPwd = passwordEncoder.encode(registerVO.getPassword());

        switch (userType) {
            case "student":
                if (studentUserRepository.findByUsername(username) != null) {
                    throw new RuntimeException("用户名已存在");
                }
                StudentUser student = new StudentUser();
                student.setUsername(username);
                student.setPassword(encodedPwd);
                student.setRealName(registerVO.getRealName());
                student.setPhone(registerVO.getPhone());
                student.setEmail(registerVO.getEmail());
                student.setCollege(registerVO.getCollege());
                studentUserRepository.save(student);
                break;
            case "teacher":
                if (teacherUserRepository.findByUsername(username) != null) {
                    throw new RuntimeException("用户名已存在");
                }
                TeacherUser teacher = new TeacherUser();
                teacher.setUsername(username);
                teacher.setPassword(encodedPwd);
                teacher.setRealName(registerVO.getRealName());
                teacher.setTeacherNo(registerVO.getTeacherNo());
                teacher.setEmail(registerVO.getEmail());
                teacher.setCollege(registerVO.getCollege());
                teacherUserRepository.save(teacher);
                break;
            case "expert":
                if (!jdbcTemplate.queryForList("SELECT id FROM expert_user WHERE username = ?", username).isEmpty()) {
                    throw new RuntimeException("用户名已存在");
                }
                jdbcTemplate.update(
                        "INSERT INTO expert_user (username, password, real_name, email, field, title, organization, status) VALUES (?,?,?,?,?,?,?,1)",
                        username, encodedPwd, registerVO.getRealName(), registerVO.getEmail(),
                        registerVO.getField(), registerVO.getTitle(), registerVO.getOrganization());
                break;
            case "enterprise":
                if (!jdbcTemplate.queryForList("SELECT id FROM enterprise_user WHERE username = ?", username).isEmpty()) {
                    throw new RuntimeException("用户名已存在");
                }
                jdbcTemplate.update(
                        "INSERT INTO enterprise_user (username, password, real_name, email, company_name, industry, address) VALUES (?,?,?,?,?,?,?)",
                        username, encodedPwd, registerVO.getRealName(), registerVO.getEmail(),
                        registerVO.getCompanyName(), registerVO.getIndustry(), registerVO.getAddress());
                break;
            default:
                // 禁止公开注册管理员
                throw new RuntimeException("该角色不允许自助注册");
        }
    }

    // ==================== 用户信息 ====================
    @Override
    public Map<String, Object> getUserInfo(String userType, String username) {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("username", username);
        info.put("userType", userType);

        if ("student".equals(userType)) {
            StudentUser s = studentUserRepository.findByUsername(username);
            if (s != null) {
                info.put("id", s.getId());
                info.put("realName", s.getRealName());
                info.put("college", s.getCollege());
            }
        } else if ("teacher".equals(userType)) {
            TeacherUser t = teacherUserRepository.findByUsername(username);
            if (t != null) {
                info.put("id", t.getId());
                info.put("realName", t.getRealName());
                info.put("college", t.getCollege());
            }
        } else if ("admin".equals(userType)) {
            AdminUser a = adminUserRepository.findByUsername(username);
            if (a != null) {
                info.put("id", a.getId());
                info.put("realName", a.getRealName());
            } else {
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                        "SELECT id, username FROM user WHERE username = ? AND user_type = 'admin' LIMIT 1", username);
                if (!rows.isEmpty()) {
                    info.put("id", rows.get(0).get("id"));
                }
            }
        } else {
            String table = "expert".equals(userType) ? "expert_user" : "enterprise_user";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT * FROM " + table + " WHERE username = ? LIMIT 1", username);
            if (!rows.isEmpty()) {
                Map<String, Object> row = rows.get(0);
                info.put("id", row.get("id"));
                info.put("realName", row.get("real_name"));
                info.put("college", row.get("college"));
                if ("enterprise".equals(userType)) {
                    info.put("companyName", row.get("company_name"));
                }
            }
        }
        return info;
    }

    // ==================== 忘记密码 ====================
    @Override
    public boolean verifyIdentity(String userType, String username, String realName) {
        String table = userTable(userType);
        if (table == null) {
            return false;
        }
        if ("admin".equals(userType)) {
            if (!jdbcTemplate.queryForList(
                    "SELECT id FROM admin_user WHERE username = ? AND real_name = ? LIMIT 1", username, realName).isEmpty()) {
                return true;
            }
            return !jdbcTemplate.queryForList(
                    "SELECT id FROM user WHERE username = ? AND user_type = 'admin' LIMIT 1", username).isEmpty()
                    && realName != null && !realName.isEmpty();
        }
        return !jdbcTemplate.queryForList(
                "SELECT id FROM " + table + " WHERE username = ? AND real_name = ? LIMIT 1", username, realName).isEmpty();
    }

    @Override
    public void resetPassword(String userType, String username, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new RuntimeException("密码至少 6 位");
        }
        String table = userTable(userType);
        if (table == null) {
            throw new RuntimeException("角色类型不正确");
        }
        String encoded = passwordEncoder.encode(newPassword);
        jdbcTemplate.update("UPDATE " + table + " SET password = ? WHERE username = ?", encoded, username);
        if ("admin".equals(userType)) {
            jdbcTemplate.update("UPDATE user SET password = ? WHERE username = ? AND user_type = 'admin'", encoded, username);
        }
    }

    private String userTable(String userType) {
        if (userType == null) return null;
        switch (userType) {
            case "student": return "student_user";
            case "teacher": return "teacher_user";
            case "admin": return "admin_user";
            case "expert": return "expert_user";
            case "enterprise": return "enterprise_user";
            default: return null;
        }
    }

    // ==================== 微信小程序登录 ====================
    @Override
    public String wxLogin(String code, String nickName, String avatarUrl, String userType) {
        if (code == null || code.isEmpty()) {
            throw new RuntimeException("登录凭证不能为空");
        }
        if (userType == null) userType = "student";

        String openid;
        try {
            String url = "https://api.weixin.qq.com/sns/jscode2session"
                    + "?appid=" + wechatAppId
                    + "&secret=" + wechatAppSecret
                    + "&js_code=" + code
                    + "&grant_type=authorization_code";
            RestTemplate rest = new RestTemplate();
            String result = rest.getForObject(url, String.class);
            openid = extractJsonValue(result, "openid");
            if (openid == null || openid.isEmpty()) {
                throw new RuntimeException("获取微信openid失败: " + result);
            }
        } catch (Exception e) {
            throw new RuntimeException("微信登录失败: " + e.getMessage());
        }

        if ("student".equals(userType)) {
            StudentUser student = studentUserRepository.findByOpenid(openid);
            if (student == null) {
                student = new StudentUser();
                student.setOpenid(openid);
                student.setNickName(nickName);
                student.setAvatar(avatarUrl);
                student.setUsername("wx_" + openid.substring(0, Math.min(12, openid.length())));
                student.setPassword(passwordEncoder.encode(openid));
                student.setRealName(nickName);
                student = studentUserRepository.save(student);
            }
            return jwtUtil.generateToken(student.getId(), student.getUsername(), "student", student.getCollege());
        }

        throw new RuntimeException("当前仅支持学生角色微信登录");
    }

    private String extractJsonValue(String json, String key) {
        String search = "\"" + key + "\":\"";
        int start = json.indexOf(search);
        if (start == -1) return null;
        start += search.length();
        int end = json.indexOf("\"", start);
        if (end == -1) return null;
        return json.substring(start, end);
    }

    // ==================== 获取用户ID ====================
    @Override
    public Long getStudentId(String username) {
        StudentUser student = studentUserRepository.findByUsername(username);
        return student != null ? student.getId() : null;
    }

    @Override
    public Long getTeacherId(String username) {
        TeacherUser teacher = teacherUserRepository.findByUsername(username);
        return teacher != null ? teacher.getId() : null;
    }

    @Override
    public Long getAdminId(String username) {
        AdminUser admin = adminUserRepository.findByUsername(username);
        if (admin != null) {
            return admin.getId();
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT id FROM user WHERE username = ? AND user_type = 'admin' LIMIT 1", username);
        return rows.isEmpty() ? null : ((Number) rows.get(0).get("id")).longValue();
    }

    @Override
    public String getStudentCollege(String username) {
        StudentUser student = studentUserRepository.findByUsername(username);
        return student != null ? student.getCollege() : null;
    }

    @Override
    public String getTeacherCollege(String username) {
        TeacherUser teacher = teacherUserRepository.findByUsername(username);
        return teacher != null ? teacher.getCollege() : null;
    }

    @Override
    public void deleteAccount(String userType, String username) {
        switch (userType) {
            case "student":
                StudentUser student = studentUserRepository.findByUsername(username);
                if (student != null) studentUserRepository.delete(student);
                break;
            case "teacher":
                TeacherUser teacher = teacherUserRepository.findByUsername(username);
                if (teacher != null) teacherUserRepository.delete(teacher);
                break;
            case "admin":
                AdminUser admin = adminUserRepository.findByUsername(username);
                if (admin != null) adminUserRepository.delete(admin);
                jdbcTemplate.update("DELETE FROM user WHERE username = ? AND user_type = 'admin'", username);
                break;
            case "expert":
                jdbcTemplate.update("DELETE FROM expert_user WHERE username = ?", username);
                break;
            case "enterprise":
                jdbcTemplate.update("DELETE FROM enterprise_user WHERE username = ?", username);
                break;
            default:
                throw new RuntimeException("无效的用户类型");
        }
    }
}

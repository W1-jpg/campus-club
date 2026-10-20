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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

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

    // ==================== 学生登录 ====================
    @Override
    public String loginStudent(LoginVO loginVO) {
        if (loginVO.getUsername() == null || loginVO.getUsername().isEmpty() ||
                loginVO.getPassword() == null || loginVO.getPassword().isEmpty()) {
            throw new RuntimeException("用户名或密码不能为空");
        }

        StudentUser student = studentUserRepository.findByUsername(loginVO.getUsername());
        if (student == null) {
            throw new RuntimeException("学生用户不存在");
        }

        if (!passwordEncoder.matches(loginVO.getPassword(), student.getPassword())) {
            throw new RuntimeException("密码错误");
        }

        return jwtUtil.generateToken(loginVO.getUsername(), "student");
    }

    // ==================== 教师登录 ====================
    @Override
    public String loginTeacher(LoginVO loginVO) {
        if (loginVO.getUsername() == null || loginVO.getUsername().isEmpty() ||
                loginVO.getPassword() == null || loginVO.getPassword().isEmpty()) {
            throw new RuntimeException("用户名或密码不能为空");
        }

        TeacherUser teacher = teacherUserRepository.findByUsername(loginVO.getUsername());
        if (teacher == null) {
            throw new RuntimeException("教师用户不存在");
        }

        if (!passwordEncoder.matches(loginVO.getPassword(), teacher.getPassword())) {
            throw new RuntimeException("密码错误");
        }

        return jwtUtil.generateToken(loginVO.getUsername(), "teacher");
    }

    // ==================== 管理员登录 ====================
    @Override
    public String loginAdmin(LoginVO loginVO) {
        if (loginVO.getUsername() == null || loginVO.getUsername().isEmpty() ||
                loginVO.getPassword() == null || loginVO.getPassword().isEmpty()) {
            throw new RuntimeException("用户名或密码不能为空");
        }

        AdminUser admin = adminUserRepository.findByUsername(loginVO.getUsername());
        if (admin == null) {
            throw new RuntimeException("管理员用户不存在");
        }

        if (!passwordEncoder.matches(loginVO.getPassword(), admin.getPassword())) {
            throw new RuntimeException("密码错误");
        }

        return jwtUtil.generateToken(loginVO.getUsername(), "admin");
    }

    // ==================== 注册 ====================
    @Override
    public void register(String userType, RegisterVO registerVO) {
        String encodedPwd = passwordEncoder.encode(registerVO.getPassword());

        switch (userType) {
            case "student":
                StudentUser student = new StudentUser();
                student.setUsername(registerVO.getUsername());
                student.setPassword(encodedPwd);
                student.setRealName(registerVO.getRealName());
                student.setPhone(registerVO.getPhone());
                student.setEmail(registerVO.getEmail());
                student.setCollege(registerVO.getCollege());
                studentUserRepository.save(student);
                break;
            case "teacher":
                TeacherUser teacher = new TeacherUser();
                teacher.setUsername(registerVO.getUsername());
                teacher.setPassword(encodedPwd);
                teacher.setRealName(registerVO.getRealName());
                teacher.setTeacherNo(registerVO.getTeacherNo());
                teacher.setEmail(registerVO.getEmail());
                teacher.setCollege(registerVO.getCollege());
                teacherUserRepository.save(teacher);
                break;
            case "admin":
                AdminUser admin = new AdminUser();
                admin.setUsername(registerVO.getUsername());
                admin.setPassword(encodedPwd);
                admin.setRealName(registerVO.getRealName());
                adminUserRepository.save(admin);
                break;
            default:
                throw new RuntimeException("无效的用户类型");
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
                student.setUsername("wx_" + openid.substring(0, 12));
                student.setPassword(passwordEncoder.encode(openid));
                student.setRealName(nickName);
                student = studentUserRepository.save(student);
            }
            return jwtUtil.generateToken(student.getUsername(), "student");
        }

        throw new RuntimeException("当前仅支持学生角色微信登录，教师/专家/企业请使用账号密码登录");
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
        return admin != null ? admin.getId() : null;
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
                if (student != null) {
                    studentUserRepository.delete(student);
                }
                break;
            case "teacher":
                TeacherUser teacher = teacherUserRepository.findByUsername(username);
                if (teacher != null) {
                    teacherUserRepository.delete(teacher);
                }
                break;
            case "admin":
                AdminUser admin = adminUserRepository.findByUsername(username);
                if (admin != null) {
                    adminUserRepository.delete(admin);
                }
                break;
            default:
                throw new RuntimeException("无效的用户类型");
        }
    }
}

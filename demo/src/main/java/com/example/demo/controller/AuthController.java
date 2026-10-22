package com.example.demo.controller;

import com.example.demo.config.JwtUser;
import com.example.demo.service.AuthService;
import com.example.demo.service.EmailCodeService;
import com.example.demo.util.Result;
import com.example.demo.vo.LoginVO;
import com.example.demo.vo.RegisterVO;
import com.example.demo.vo.WxLoginVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 认证控制器：登录、注册、邮箱验证码、找回密码、注销
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private EmailCodeService emailCodeService;

    // ==================== 登录 ====================

    @PostMapping("/login/student")
    public Result<?> loginStudent(@RequestBody LoginVO vo) {
        return login("student", vo);
    }

    @PostMapping("/login/teacher")
    public Result<?> loginTeacher(@RequestBody LoginVO vo) {
        return login("teacher", vo);
    }

    @PostMapping("/login/admin")
    public Result<?> loginAdmin(@RequestBody LoginVO vo) {
        return login("admin", vo);
    }

    @PostMapping("/login/expert")
    public Result<?> loginExpert(@RequestBody LoginVO vo) {
        return login("expert", vo);
    }

    @PostMapping("/login/enterprise")
    public Result<?> loginEnterprise(@RequestBody LoginVO vo) {
        return login("enterprise", vo);
    }

    private Result<?> login(String userType, LoginVO vo) {
        try {
            if (vo == null || vo.getUsername() == null || vo.getUsername().trim().isEmpty()
                    || vo.getPassword() == null || vo.getPassword().isEmpty()) {
                return Result.error("用户名或密码不能为空");
            }
            String username = vo.getUsername().trim();
            vo.setUsername(username);

            String token;
            switch (userType) {
                case "student": token = authService.loginStudent(vo); break;
                case "teacher": token = authService.loginTeacher(vo); break;
                case "admin": token = authService.loginAdmin(vo); break;
                case "expert": token = authService.loginExpert(vo); break;
                case "enterprise": token = authService.loginEnterprise(vo); break;
                default: return Result.error("角色类型不正确");
            }

            Map<String, Object> info = authService.getUserInfo(userType, username);
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("token", token);
            data.put("user", info);

            if ("student".equals(userType)) {
                data.put("studentId", info.get("id"));
                data.put("college", info.get("college"));
            } else if ("teacher".equals(userType)) {
                data.put("teacherId", info.get("id"));
                data.put("college", info.get("college"));
            } else if ("admin".equals(userType)) {
                data.put("adminId", info.get("id"));
            } else if ("expert".equals(userType)) {
                data.put("expertId", info.get("id"));
            } else if ("enterprise".equals(userType)) {
                data.put("enterpriseId", info.get("id"));
            }
            return Result.success(data);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    // ==================== 注册 ====================

    @PostMapping("/send-code")
    public Result<?> sendCode(@RequestBody Map<String, Object> body) {
        try {
            String purpose = body.get("purpose") == null ? "reset" : String.valueOf(body.get("purpose"));
            String username = body.get("username") == null ? "" : String.valueOf(body.get("username")).trim();
            if ("register".equals(purpose)) {
                String email = body.get("email") == null ? "" : String.valueOf(body.get("email")).trim();
                emailCodeService.sendRegisterCode(email, username);
                return Result.success("验证码已发送", null);
            }
            String userType = body.get("userType") == null ? "" : String.valueOf(body.get("userType"));
            if (username.isEmpty() || userType.isEmpty()) {
                return Result.error("缺少用户名或角色");
            }
            emailCodeService.sendResetCode(userType, username);
            return Result.success("验证码已发送", null);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/register/{userType}")
    public Result<?> register(@PathVariable String userType, @RequestBody RegisterVO vo) {
        try {
            if (vo.getEmail() == null || vo.getEmail().trim().isEmpty()) {
                return Result.error("请填写邮箱");
            }
            emailCodeService.verifyRegisterCode(vo.getEmail(), vo.getCode());
            authService.register(userType, vo);
            return Result.success(null);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/verify-identity")
    public Result<?> verifyIdentity(@RequestBody Map<String, Object> body) {
        try {
            String username = String.valueOf(body.get("username"));
            String userType = String.valueOf(body.get("userType"));
            String realName = String.valueOf(body.get("realName"));
            if (authService.verifyIdentity(userType, username, realName)) {
                return Result.success("身份验证通过");
            }
            return Result.error("用户名与真实姓名不匹配");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public Result<?> resetPassword(@RequestBody Map<String, Object> body) {
        try {
            String username = String.valueOf(body.get("username"));
            String userType = String.valueOf(body.get("userType"));
            String realName = String.valueOf(body.get("realName"));
            String code = String.valueOf(body.get("code"));
            String newPassword = String.valueOf(body.get("newPassword"));

            if (!authService.verifyIdentity(userType, username, realName)) {
                return Result.error("身份信息不匹配");
            }
            emailCodeService.verifyResetCode(userType, username, code);
            authService.resetPassword(userType, username, newPassword);
            return Result.success("密码重置成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    // ==================== 微信登录 ====================

    @PostMapping("/wx-login")
    public Result<?> wxLogin(@RequestBody WxLoginVO vo) {
        try {
            String token = authService.wxLogin(vo.getCode(), vo.getNickName(), vo.getAvatarUrl(), vo.getUserType());
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("token", token);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    // ==================== 注销 ====================

    @PostMapping("/delete/{userType}")
    public Result<?> deleteAccount(@PathVariable String userType,
                                   @RequestParam(required = false) String username,
                                   @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) {
                return Result.error("未登录或登录已过期");
            }
            boolean admin = "admin".equals(user.getUserType());
            if (!admin) {
                if (!user.getUserType().equals(userType)
                        || (username != null && !username.equals(user.getUsername()))) {
                    return Result.error("只能注销自己的账号");
                }
                username = user.getUsername();
            }
            if (username == null || username.isEmpty()) {
                return Result.error("缺少用户名");
            }
            authService.deleteAccount(userType, username);
            return Result.success("账号注销成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}

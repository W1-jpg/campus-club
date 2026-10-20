package com.example.demo.controller;

import com.example.demo.service.AuthService;
import com.example.demo.util.Result;
import com.example.demo.vo.LoginVO;
import com.example.demo.vo.RegisterVO;
import com.example.demo.vo.WxLoginVO;
import javax.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 认证控制器：处理登录/注册请求
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * 学生登录接口
     * 关键修复：添加@Valid + BindingResult，触发LoginVO的参数校验
     */
    @PostMapping("/login/student")
    public Result<?> loginStudent(@Valid @RequestBody LoginVO loginVO, BindingResult bindingResult) {
        // 第一步：拦截空值/全空格（LoginVO的@NotBlank注解生效）
        if (bindingResult.hasErrors()) {
            String errorMsg = bindingResult.getFieldError().getDefaultMessage();
            return Result.error(errorMsg);
        }

        // 第二步：手动trim，防止空格绕过校验
        String username = loginVO.getUsername().trim();
        String password = loginVO.getPassword().trim();
        if (username.isEmpty() || password.isEmpty()) {
            return Result.error("用户名或密码不能为空");
        }

        // 第三步：执行业务逻辑（仅传递处理后的参数）
        try {
            LoginVO validLoginVO = new LoginVO();
            validLoginVO.setUsername(username);
            validLoginVO.setPassword(password);
            String token = authService.loginStudent(validLoginVO);
            // 仅当token非空时返回成功（双重保障）
            if (token == null || token.isEmpty()) {
                return Result.error("登录失败：Token生成失败");
            }
            // 获取学生ID和学院信息
            Long studentId = authService.getStudentId(username);
            String college = authService.getStudentCollege(username);
            // 返回token、studentId和college
            return Result.success("{\"token\":\"" + token + "\",\"studentId\":\"" + studentId + "\",\"college\":\"" + college + "\"}");
        } catch (Exception e) {
            // 明确返回错误信息，禁止吞掉异常
            return Result.error(e.getMessage());
        }
    }

    // 教师登录接口（同学生接口，添加完整校验）
    @PostMapping("/login/teacher")
    public Result<?> loginTeacher(@Valid @RequestBody LoginVO loginVO, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String errorMsg = bindingResult.getFieldError().getDefaultMessage();
            return Result.error(errorMsg);
        }

        String username = loginVO.getUsername().trim();
        String password = loginVO.getPassword().trim();
        if (username.isEmpty() || password.isEmpty()) {
            return Result.error("用户名或密码不能为空");
        }

        try {
            LoginVO validLoginVO = new LoginVO();
            validLoginVO.setUsername(username);
            validLoginVO.setPassword(password);
            String token = authService.loginTeacher(validLoginVO);
            if (token == null || token.isEmpty()) {
                return Result.error("登录失败：Token生成失败");
            }
            // 获取教师ID和学院信息
            Long teacherId = authService.getTeacherId(username);
            String college = authService.getTeacherCollege(username);
            // 返回token、teacherId和college
            return Result.success("{\"token\":\"" + token + "\",\"teacherId\":\"" + teacherId + "\",\"college\":\"" + college + "\"}");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    // 管理员登录接口（同学生接口，添加完整校验）
    @PostMapping("/login/admin")
    public Result<?> loginAdmin(@Valid @RequestBody LoginVO loginVO, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String errorMsg = bindingResult.getFieldError().getDefaultMessage();
            return Result.error(errorMsg);
        }

        String username = loginVO.getUsername().trim();
        String password = loginVO.getPassword().trim();
        if (username.isEmpty() || password.isEmpty()) {
            return Result.error("用户名或密码不能为空");
        }

        try {
            LoginVO validLoginVO = new LoginVO();
            validLoginVO.setUsername(username);
            validLoginVO.setPassword(password);
            String token = authService.loginAdmin(validLoginVO);
            if (token == null || token.isEmpty()) {
                return Result.error("登录失败：Token生成失败");
            }
            // 获取管理员ID
            Long adminId = authService.getAdminId(username);
            // 返回token和adminId
            return Result.success("{\"token\":\"" + token + "\",\"adminId\":\"" + adminId + "\"}");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 注册接口（可选：添加参数校验）
     */
    @PostMapping("/register/{userType}")
    public Result<?> register(@PathVariable String userType, @Valid @RequestBody RegisterVO registerVO, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            String errorMsg = bindingResult.getFieldError().getDefaultMessage();
            return Result.error(errorMsg);
        }

        try {
            authService.register(userType, registerVO);
            return Result.success(null);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 微信小程序登录接口
     * 接收 code + nickName + avatarUrl + userType → 返回 JWT
     */
    @PostMapping("/wx-login")
    public Result<?> wxLogin(@RequestBody WxLoginVO vo) {
        try {
            String token = authService.wxLogin(vo.getCode(), vo.getNickName(), vo.getAvatarUrl(), vo.getUserType());
            if (token == null || token.isEmpty()) {
                return Result.error("登录失败：无法生成凭证");
            }
            return Result.success("{\"token\":\"" + token + "\"}");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 注销账号接口
     */
    @PostMapping("/delete/{userType}")
    public Result<?> deleteAccount(@PathVariable String userType, @RequestParam String username) {
        try {
            authService.deleteAccount(userType, username);
            return Result.success("账号注销成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

}
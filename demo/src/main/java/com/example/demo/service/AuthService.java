package com.example.demo.service;

import com.example.demo.vo.LoginVO;
import com.example.demo.vo.RegisterVO;

import java.util.Map;

public interface AuthService {
    // 统一方法签名：只接收 LoginVO/RegisterVO，不额外传 userType
    String loginStudent(LoginVO loginVO);
    String loginTeacher(LoginVO loginVO);
    String loginAdmin(LoginVO loginVO);
    String loginExpert(LoginVO loginVO);
    String loginEnterprise(LoginVO loginVO);

    void register(String userType, RegisterVO registerVO);

    /** 登录后返回给前端的用户信息 */
    Map<String, Object> getUserInfo(String userType, String username);

    /** 忘记密码第一步：用户名 + 真实姓名 */
    boolean verifyIdentity(String userType, String username, String realName);

    /** 忘记密码第二步：重置密码 */
    void resetPassword(String userType, String username, String newPassword);
    // 获取用户ID
    Long getStudentId(String username);
    Long getTeacherId(String username);
    Long getAdminId(String username);
    
    // 获取学生学院
    String getStudentCollege(String username);
    
    // 获取教师学院
    String getTeacherCollege(String username);
    
    // 微信小程序登录
    String wxLogin(String code, String nickName, String avatarUrl, String userType);

    // 注销账号
    void deleteAccount(String userType, String username);
}
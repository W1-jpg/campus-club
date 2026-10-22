package com.example.demo.vo;

import lombok.Data;

@Data
public class RegisterVO {
    /** 邮箱验证码 */
    private String code;
    private String username;
    private String password;
    private String realName;
    private String phone;      // 学生专用
    private String teacherNo;  // 教师专用
    private String email;
    private String college;    // 学生专用

    // 专家专用
    private String field;
    private String title;
    private String organization;

    // 企业专用
    private String companyName;
    private String industry;
    private String address;
}
package com.example.demo.vo;

import lombok.Data;

@Data
public class RegisterVO {
    private String username;
    private String password;
    private String realName;
    private String phone;      // 学生专用
    private String teacherNo;  // 教师专用
    private String email;
    private String college;    // 学生专用
}
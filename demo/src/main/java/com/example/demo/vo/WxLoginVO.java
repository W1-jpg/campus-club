package com.example.demo.vo;

import lombok.Data;

/**
 * 微信小程序登录请求 VO
 */
@Data
public class WxLoginVO {
    private String code;          // wx.login 获取的临时 code
    private String nickName;      // 微信昵称
    private String avatarUrl;     // 微信头像 URL
    private String userType;      // 用户角色: student/teacher/expert/enterprise
}

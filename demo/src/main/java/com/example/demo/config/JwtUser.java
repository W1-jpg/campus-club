package com.example.demo.config;

/**
 * 从 JWT 中解析出的当前登录用户
 */
public class JwtUser {

    private final Long id;
    private final String username;
    private final String userType;
    private final String college;

    public JwtUser(Long id, String username, String userType, String college) {
        this.id = id;
        this.username = username;
        this.userType = userType;
        this.college = college;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getUserType() {
        return userType;
    }

    public String getCollege() {
        return college;
    }

    public boolean isEnterprise() {
        return "enterprise".equalsIgnoreCase(userType);
    }

    public boolean isAdmin() {
        return "admin".equalsIgnoreCase(userType);
    }
}

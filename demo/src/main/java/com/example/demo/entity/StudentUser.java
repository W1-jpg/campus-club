package com.example.demo.entity;

import javax.persistence.*;
import lombok.Data;
import java.util.Date;

@Data
@Entity
@Table(name = "student_user")
public class StudentUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username")
    private String username;

    @Column(name = "password")
    private String password;

    @Column(name = "real_name") // 映射数据库的real_name字段
    private String realName;

    @Column(name = "phone")
    private String phone;

    @Column(name = "email")
    private String email;

    @Column(name = "create_time")
    private Date createTime = new Date();

    @Column(name = "status")
    private Integer status = 1;
    
    @Column(name = "college")
    private String college;

    @Column(name = "openid", length = 64, unique = true)
    private String openid;

    @Column(name = "nick_name", length = 100)
    private String nickName;

    @Column(name = "avatar", length = 500)
    private String avatar;
}

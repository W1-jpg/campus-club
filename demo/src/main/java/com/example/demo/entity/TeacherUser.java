package com.example.demo.entity;

import javax.persistence.*;
import lombok.Data;
import java.util.Date;

@Data
@Entity
@Table(name = "teacher_user")
public class TeacherUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username")
    private String username;

    @Column(name = "password")
    private String password;

    @Column(name = "real_name")
    private String realName;

    @Column(name = "teacher_no")
    private String teacherNo;

    @Column(name = "email")
    private String email;

    @Column(name = "create_time")
    private Date createTime = new Date();

    @Column(name = "status")
    private Integer status = 1;

    @Column(name = "college")
    private String college;
}
package com.example.demo.entity;

import lombok.Data;

import javax.persistence.*;
import java.util.Date;

@Data
@Entity
@Table(name = "achievement")
public class Achievement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String type;
    private String description;
    private Long studentId;
    private String college;
    private String filePath;
    private String fileName;

    @Column(name = "create_time")
    private Date createTime;

    @Column(name = "update_time")
    private Date updateTime;

    private Integer status;
    private Integer score;
    @Column(name = "incubation_status")
    private Integer incubationStatus;
    @Column(name = "review_status")
    private Integer reviewStatus;
}
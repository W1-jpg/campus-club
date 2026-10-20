package com.example.demo.entity;

import lombok.Data;

import javax.persistence.*;
import java.util.Date;

@Data
@Entity
@Table(name = "comment")
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "achievement_id")
    private Long achievementId;

    private Long userId;
    private String userType;
    private String content;

    @Column(name = "create_time")
    private Date createTime;
}


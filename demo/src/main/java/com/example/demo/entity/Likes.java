package com.example.demo.entity;

import lombok.Data;

import javax.persistence.*;
import java.util.Date;

@Data
@Entity
@Table(name = "likes", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"achievement_id", "user_id", "user_type"})
})
public class Likes {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "achievement_id")
    private Long achievementId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_type")
    private String userType;

    @Column(name = "create_time")
    private Date createTime;
}


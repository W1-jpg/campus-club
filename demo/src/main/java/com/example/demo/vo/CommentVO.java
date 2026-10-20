package com.example.demo.vo;

import lombok.Data;

import java.util.Date;

@Data
public class CommentVO {
    private Long id;
    private Long achievementId;
    private Long userId;
    private String userType;
    private String content;
    private Date createTime;
}

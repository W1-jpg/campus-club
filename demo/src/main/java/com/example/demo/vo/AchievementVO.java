package com.example.demo.vo;

import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class AchievementVO {
    private Long id;
    private String title;
    private String type;
    private String description;
    private Long studentId;
    private String filePath;
    private String fileName;
    private Date createTime;
    private Date updateTime;
    private Integer status;
    private Integer score;
    private Integer incubationStatus;
    private Integer reviewStatus;
    private long likeCount;
    private boolean isLiked;
    private List<CommentVO> comments;
}

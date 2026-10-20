package com.example.demo.entity;

import javax.persistence.*;
import lombok.Data;

import java.util.Date;

@Data
@Entity
@Table(name = "resource")
public class Resource {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String type;
    private String provider;
    private String description;

    @Column(name = "publish_time")
    private Date publishTime;

    @Column(name = "end_time")
    private Date endTime;

    private String status;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(name = "apply_count")
    private Integer applyCount;

    @Column(name = "create_time")
    private Date createTime;

    @Column(name = "update_time")
    private Date updateTime;

    /** 资源发布企业ID */
    @Column(name = "enterprise_id")
    private Long enterpriseId;
}

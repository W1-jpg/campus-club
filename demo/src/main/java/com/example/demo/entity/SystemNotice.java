package com.example.demo.entity;

import javax.persistence.*;
import lombok.Data;
import java.util.Date;

@Data
@Entity
@Table(name = "system_notice")
public class SystemNotice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title")
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "publisher_id")
    private Long publisherId;

    @Column(name = "publisher_type")
    private String publisherType;

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "create_time")
    private Date createTime = new Date();

    @Column(name = "update_time")
    private Date updateTime = new Date();

    @Column(name = "status")
    private Integer status = 1;
}

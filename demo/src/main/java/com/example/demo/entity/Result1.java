package com.example.demo.entity;

import javax.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "result")
@Data
public class Result1 {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String type;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    private Integer status = 0;

    @Column(name = "create_time", updatable = false)
    private LocalDateTime createTime = LocalDateTime.now();
}
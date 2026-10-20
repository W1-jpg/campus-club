package com.example.demo.repository;

import com.example.demo.entity.Result1;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResultRepository extends JpaRepository<Result1, Long> {
    // 根据学生ID查询成果列表
    List<Result1> findByStudentId(Long studentId);
}
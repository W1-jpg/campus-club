package com.example.demo.repository;

import com.example.demo.entity.SystemNotice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemNoticeRepository extends JpaRepository<SystemNotice, Long> {
    List<SystemNotice> findByStatusOrderByCreateTimeDesc(Integer status);
    List<SystemNotice> findByStudentIdAndStatusOrderByCreateTimeDesc(Long studentId, Integer status);
}
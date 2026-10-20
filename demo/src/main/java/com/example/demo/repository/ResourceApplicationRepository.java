package com.example.demo.repository;

import com.example.demo.entity.ResourceApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceApplicationRepository extends JpaRepository<ResourceApplication, Long> {
    List<ResourceApplication> findByResourceId(Long resourceId);
    List<ResourceApplication> findByStudentId(Long studentId);
    List<ResourceApplication> findByResourceIdAndStatus(Long resourceId, String status);
}
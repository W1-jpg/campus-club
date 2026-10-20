package com.example.demo.repository;

import com.example.demo.entity.TeacherUser;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeacherUserRepository extends JpaRepository<TeacherUser, Long> {
    TeacherUser findByUsername(String username);
}
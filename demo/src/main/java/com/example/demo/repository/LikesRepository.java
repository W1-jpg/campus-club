package com.example.demo.repository;

import com.example.demo.entity.Likes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LikesRepository extends JpaRepository<Likes, Long> {
    Optional<Likes> findByAchievementIdAndUserIdAndUserType(Long achievementId, Long userId, String userType);
    long countByAchievementId(Long achievementId);
}

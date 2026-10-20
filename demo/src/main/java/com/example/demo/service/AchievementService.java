package com.example.demo.service;

import com.example.demo.entity.Achievement;
import com.example.demo.entity.Comment;
import com.example.demo.vo.AchievementVO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AchievementService {
    // 成果相关
    Achievement createAchievement(Achievement achievement);
    Achievement uploadAchievement(Achievement achievement, MultipartFile file);
    List<Achievement> getAllAchievements();
    Achievement getAchievementById(Long id);
    List<Achievement> getAchievementsByStudentId(Long studentId);
    List<Achievement> getAchievementsByCollege(String college);

    // 评论相关
    Comment addComment(Comment comment);
    List<Comment> getCommentsByAchievementId(Long achievementId);

    // 点赞相关
    boolean likeAchievement(Long achievementId, Long userId, String userType);
    boolean unlikeAchievement(Long achievementId, Long userId, String userType);
    long getLikeCount(Long achievementId);
    boolean isLiked(Long achievementId, Long userId, String userType);

    // 转换VO
    AchievementVO convertToVO(Achievement achievement, Long userId, String userType);
    
    // 删除成果
    void deleteAchievement(Long id);
    
    // 评分相关
    void scoreAchievement(Long achievementId, Integer score);
    // 打回相关
    void rejectAchievement(Long achievementId, String reason);
    // 孵化相关
    void completeIncubation(Long achievementId);
    // 专家评审相关
    List<Achievement> getAchievementsByCollegeAndReviewStatus(String college, Integer reviewStatus);
}

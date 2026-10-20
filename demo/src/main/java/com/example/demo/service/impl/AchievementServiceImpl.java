package com.example.demo.service.impl;

import com.example.demo.entity.Achievement;
import com.example.demo.entity.Comment;
import com.example.demo.entity.Likes;
import com.example.demo.entity.SystemNotice;
import com.example.demo.repository.AchievementRepository;
import com.example.demo.repository.CommentRepository;
import com.example.demo.repository.LikesRepository;
import com.example.demo.service.AchievementService;
import com.example.demo.service.SystemNoticeService;
import com.example.demo.vo.AchievementVO;
import com.example.demo.vo.CommentVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AchievementServiceImpl implements AchievementService {

    @Autowired
    private AchievementRepository achievementRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private LikesRepository likesRepository;

    @Autowired
    private SystemNoticeService systemNoticeService;

    @Value("${file.upload.path}")
    private String uploadPath;

    @Override
    public Achievement createAchievement(Achievement achievement) {
        achievement.setCreateTime(new Date());
        achievement.setUpdateTime(new Date());
        achievement.setStatus(1);
        return achievementRepository.save(achievement);
    }

    @Override
    public Achievement uploadAchievement(Achievement achievement, MultipartFile file) {
        achievement.setCreateTime(new Date());
        achievement.setUpdateTime(new Date());
        achievement.setStatus(1);

        // 处理文件上传
        if (file != null && !file.isEmpty()) {
            // 确保上传目录存在
            File uploadDir = new File(uploadPath);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null ? originalFilename.substring(originalFilename.lastIndexOf('.')) : "";
            String filename = UUID.randomUUID().toString() + extension;
            String filePath = uploadPath + filename;

            // 保存文件
            try {
                file.transferTo(new File(filePath));
                achievement.setFilePath(filePath);
                achievement.setFileName(originalFilename);
            } catch (IOException e) {
                e.printStackTrace();
                throw new RuntimeException("文件上传失败: " + e.getMessage());
            }
        }

        return achievementRepository.save(achievement);
    }

    @Override
    public List<Achievement> getAllAchievements() {
        return achievementRepository.findByStatus(1);
    }

    @Override
    public Achievement getAchievementById(Long id) {
        return achievementRepository.findById(id).orElse(null);
    }

    @Override
    public List<Achievement> getAchievementsByStudentId(Long studentId) {
        return achievementRepository.findByStudentId(studentId);
    }

    @Override
    public List<Achievement> getAchievementsByCollege(String college) {
        return achievementRepository.findByCollege(college);
    }

    @Override
    public Comment addComment(Comment comment) {
        comment.setCreateTime(new Date());
        return commentRepository.save(comment);
    }

    @Override
    public List<Comment> getCommentsByAchievementId(Long achievementId) {
        return commentRepository.findByAchievementId(achievementId);
    }

    @Override
    public boolean likeAchievement(Long achievementId, Long userId, String userType) {
        if (likesRepository.findByAchievementIdAndUserIdAndUserType(achievementId, userId, userType).isPresent()) {
            return false; // 已经点赞过
        }
        Likes like = new Likes();
        like.setAchievementId(achievementId);
        like.setUserId(userId);
        like.setUserType(userType);
        like.setCreateTime(new Date());
        likesRepository.save(like);
        return true;
    }

    @Override
    public boolean unlikeAchievement(Long achievementId, Long userId, String userType) {
        likesRepository.findByAchievementIdAndUserIdAndUserType(achievementId, userId, userType)
                .ifPresent(likesRepository::delete);
        return true;
    }

    @Override
    public long getLikeCount(Long achievementId) {
        return likesRepository.countByAchievementId(achievementId);
    }

    @Override
    public boolean isLiked(Long achievementId, Long userId, String userType) {
        return likesRepository.findByAchievementIdAndUserIdAndUserType(achievementId, userId, userType).isPresent();
    }

    @Override
    public AchievementVO convertToVO(Achievement achievement, Long userId, String userType) {
        AchievementVO vo = new AchievementVO();
        vo.setId(achievement.getId());
        vo.setTitle(achievement.getTitle());
        vo.setType(achievement.getType());
        vo.setDescription(achievement.getDescription());
        vo.setStudentId(achievement.getStudentId());
        vo.setFilePath(achievement.getFilePath());
        vo.setFileName(achievement.getFileName());
        vo.setCreateTime(achievement.getCreateTime());
        vo.setUpdateTime(achievement.getUpdateTime());
        vo.setStatus(achievement.getStatus());
        vo.setScore(achievement.getScore());
        vo.setIncubationStatus(achievement.getIncubationStatus());
        vo.setReviewStatus(achievement.getReviewStatus());
        vo.setLikeCount(getLikeCount(achievement.getId()));
        vo.setLiked(isLiked(achievement.getId(), userId, userType));
        vo.setComments(getCommentsByAchievementId(achievement.getId()).stream()
                .map(this::convertToCommentVO)
                .collect(Collectors.toList()));
        return vo;
    }

    @Override
    public void scoreAchievement(Long achievementId, Integer score) {
        Achievement achievement = achievementRepository.findById(achievementId).orElse(null);
        if (achievement != null) {
            achievement.setScore(score);
            achievement.setUpdateTime(new Date());
            // 当评分高于80分时，自动进入孵化中状态
            if (score > 80) {
                achievement.setIncubationStatus(1); // 1表示孵化中
            }
            achievementRepository.save(achievement);
        }
    }

    @Override
    public void rejectAchievement(Long achievementId, String reason) {
        Achievement achievement = achievementRepository.findById(achievementId).orElse(null);
        if (achievement != null) {
            achievement.setStatus(2); // 2表示已打回
            achievement.setUpdateTime(new Date());
            // 可以在Achievement实体中添加rejectReason字段来存储打回原因
            achievementRepository.save(achievement);
        }
    }

    @Override
    public void completeIncubation(Long achievementId) {
        Achievement achievement = achievementRepository.findById(achievementId).orElse(null);
        if (achievement != null) {
            achievement.setIncubationStatus(2); // 2表示孵化完成
            achievement.setReviewStatus(1); // 1表示待评审
            achievement.setUpdateTime(new Date());
            achievementRepository.save(achievement);
        }
    }

    @Override
    public List<Achievement> getAchievementsByCollegeAndReviewStatus(String college, Integer reviewStatus) {
        return achievementRepository.findByCollegeAndReviewStatus(college, reviewStatus);
    }

    private CommentVO convertToCommentVO(Comment comment) {
        CommentVO vo = new CommentVO();
        vo.setId(comment.getId());
        vo.setAchievementId(comment.getAchievementId());
        vo.setUserId(comment.getUserId());
        vo.setUserType(comment.getUserType());
        vo.setContent(comment.getContent());
        vo.setCreateTime(comment.getCreateTime());
        return vo;
    }

    @Override
    public void deleteAchievement(Long id) {
        achievementRepository.deleteById(id);
    }
}

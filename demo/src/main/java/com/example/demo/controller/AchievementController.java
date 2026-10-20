package com.example.demo.controller;

import com.example.demo.entity.Achievement;
import com.example.demo.entity.Comment;
import com.example.demo.service.AchievementService;
import com.example.demo.util.Result;
import com.example.demo.vo.AchievementVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/result")
public class AchievementController {

    @Autowired
    private AchievementService achievementService;

    /**
     * 上传成果
     */
    @PostMapping("/upload")
    public Result<?> uploadAchievement(
            @RequestParam String title,
            @RequestParam String type,
            @RequestParam String description,
            @RequestParam Long studentId,
            @RequestParam String college,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            Achievement achievement = new Achievement();
            achievement.setTitle(title);
            achievement.setType(type);
            achievement.setDescription(description);
            achievement.setStudentId(studentId);
            achievement.setCollege(college);

            Achievement saved = achievementService.uploadAchievement(achievement, file);
            return Result.success(saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取所有成果
     */
    @GetMapping("/list")
    public Result<?> getAchievements(@RequestParam(required = false) Long userId, @RequestParam(required = false) String userType, @RequestParam(required = false) String college) {
        try {
            List<Achievement> achievements;
            if ("teacher".equals(userType) && college != null && !college.isEmpty()) {
                // 教师只能看到本学院的成果
                achievements = achievementService.getAchievementsByCollege(college);
            } else {
                // 学生和管理员可以看到所有成果
                achievements = achievementService.getAllAchievements();
            }
            List<AchievementVO> vos = achievements.stream()
                    .map(achievement -> achievementService.convertToVO(achievement, userId, userType))
                    .collect(Collectors.toList());
            return Result.success(vos);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取成果详情
     */
    @GetMapping("/detail/{id}")
    public Result<?> getAchievementDetail(@PathVariable Long id, @RequestParam(required = false) Long userId, @RequestParam(required = false) String userType) {
        try {
            Achievement achievement = achievementService.getAchievementById(id);
            if (achievement == null) {
                return Result.error("成果不存在");
            }
            AchievementVO vo = achievementService.convertToVO(achievement, userId, userType);
            return Result.success(vo);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 添加评论
     */
    @PostMapping("/comment")
    public Result<?> addComment(@RequestBody Comment comment) {
        try {
            Comment saved = achievementService.addComment(comment);
            return Result.success(saved);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 点赞
     */
    @PostMapping("/like")
    public Result<?> likeAchievement(@RequestParam Long achievementId, @RequestParam Long userId, @RequestParam String userType) {
        try {
            boolean result = achievementService.likeAchievement(achievementId, userId, userType);
            return Result.success(result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 取消点赞
     */
    @PostMapping("/unlike")
    public Result<?> unlikeAchievement(@RequestParam Long achievementId, @RequestParam Long userId, @RequestParam String userType) {
        try {
            boolean result = achievementService.unlikeAchievement(achievementId, userId, userType);
            return Result.success(result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取用户成果
     */
    @GetMapping("/my")
    public Result<?> getMyAchievements(@RequestParam Long studentId, @RequestParam(required = false) Long userId, @RequestParam(required = false) String userType) {
        try {
            List<Achievement> achievements = achievementService.getAchievementsByStudentId(studentId);
            List<AchievementVO> vos = achievements.stream()
                    .map(achievement -> achievementService.convertToVO(achievement, userId, userType))
                    .collect(Collectors.toList());
            return Result.success(vos);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 修改成果
     */
    @PutMapping("/update")
    public Result<?> updateAchievement(@RequestBody Achievement achievement) {
        try {
            Achievement updated = achievementService.createAchievement(achievement);
            return Result.success(updated);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 删除成果
     */
    @DeleteMapping("/delete/{id}")
    public Result<?> deleteAchievement(@PathVariable Long id) {
        try {
            Achievement achievement = achievementService.getAchievementById(id);
            if (achievement == null) {
                return Result.error("成果不存在");
            }
            achievementService.deleteAchievement(id);
            return Result.success("删除成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 评分成果
     */
    @PostMapping("/score")
    public Result<?> scoreAchievement(@RequestParam Long achievementId, @RequestParam Integer score) {
        try {
            achievementService.scoreAchievement(achievementId, score);
            return Result.success("评分成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 打回成果
     */
    @PostMapping("/reject")
    public Result<?> rejectAchievement(@RequestParam Long achievementId, @RequestParam String reason) {
        try {
            achievementService.rejectAchievement(achievementId, reason);
            return Result.success("打回成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 完成孵化
     */
    @PostMapping("/complete-incubation")
    public Result<?> completeIncubation(@RequestParam Long achievementId) {
        try {
            achievementService.completeIncubation(achievementId);
            return Result.success("孵化完成");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取特定学院和评审状态的成果
     */
    @GetMapping("/college/{college}/review/{status}")
    public Result<?> getAchievementsByCollegeAndReviewStatus(@PathVariable String college, @PathVariable Integer status, @RequestParam(required = false) Long userId, @RequestParam(required = false) String userType) {
        try {
            List<Achievement> achievements = achievementService.getAchievementsByCollegeAndReviewStatus(college, status);
            List<AchievementVO> vos = achievements.stream()
                    .map(achievement -> achievementService.convertToVO(achievement, userId, userType))
                    .collect(Collectors.toList());
            return Result.success(vos);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}

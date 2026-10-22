package com.example.demo.controller;

import com.example.demo.config.JwtUser;
import com.example.demo.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 专家端：待评审任务、成果文件、提交评审、统计、历史、通知
 */
@RestController
@RequestMapping("/api/expert")
public class ExpertController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/tasks")
    public Result<?> tasks(@AuthenticationPrincipal JwtUser user) {
        try {
            if (!isExpertOrAdmin(user)) return Result.error("没有评审权限");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT a.id, a.title, a.type, a.description, a.student_id AS studentId, a.college, " +
                            "a.score, a.incubation_score AS incubationScore, a.incubation_status AS incubationStatus, " +
                            "COALESCE(a.review_status,0) AS reviewStatus, COALESCE(a.expert_review,0) AS expertReview, " +
                            "a.expert_score AS expertScore, a.review_progress AS reviewProgress, " +
                            "a.create_time AS createTime, s.real_name AS studentName " +
                            "FROM achievement a LEFT JOIN student_user s ON a.student_id = s.id " +
                            "WHERE a.score > 0 AND (a.expert_score IS NULL OR a.expert_score = 0) " +
                            "ORDER BY a.create_time DESC");
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error("获取失败");
        }
    }

    @GetMapping("/tasks/count")
    public Result<?> taskCount(@AuthenticationPrincipal JwtUser user) {
        try {
            if (!isExpertOrAdmin(user)) return Result.error("没有评审权限");
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM achievement WHERE score > 0", Integer.class);
            return Result.success(count == null ? 0 : count);
        } catch (Exception e) {
            return Result.error("获取失败");
        }
    }

    @GetMapping("/task/{id}/files")
    public Result<?> taskFiles(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        try {
            if (!isExpertOrAdmin(user)) return Result.error("没有评审权限");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT id, file_name, file_path, file_size, file_type FROM file WHERE achievement_id = ?", id);
            List<Map<String, Object>> files = new ArrayList<>();
            for (Map<String, Object> row : rows) {
                Map<String, Object> f = new LinkedHashMap<>();
                f.put("id", row.get("id"));
                f.put("name", row.get("file_name"));
                f.put("path", row.get("file_path"));
                long size = row.get("file_size") instanceof Number ? ((Number) row.get("file_size")).longValue() : 0L;
                f.put("size", size);
                f.put("type", row.get("file_type"));
                f.put("url", "/uploads/" + basename(String.valueOf(row.get("file_path"))));
                f.put("sizeText", sizeText(size));
                files.add(f);
            }
            return Result.success(files);
        } catch (Exception e) {
            return Result.error("获取失败");
        }
    }

    @PostMapping("/review")
    public Result<?> review(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        try {
            if (!isExpertOrAdmin(user)) return Result.error("没有评审权限");
            Object achievementId = body.get("achievementId");
            Object score = body.get("score");
            if (achievementId == null || score == null) return Result.error("缺少参数");

            Long expertId = user.getId();
            if ("admin".equals(user.getUserType()) && body.get("expertId") != null) {
                expertId = Long.valueOf(String.valueOf(body.get("expertId")));
            }
            String comment = body.get("comment") == null ? "" : String.valueOf(body.get("comment"));
            String conclusion = body.get("conclusion") == null ? "pass" : String.valueOf(body.get("conclusion"));
            String dimensionScores = body.get("dimensionScores") == null ? "[]" : String.valueOf(body.get("dimensionScores"));
            String reviewType = body.get("reviewType") == null ? "achievement" : String.valueOf(body.get("reviewType"));

            jdbcTemplate.update(
                    "INSERT INTO expert_reviews (expert_id, achievement_id, score, comment, conclusion, dimension_scores, review_type) " +
                            "VALUES (?,?,?,?,?,?,?)",
                    expertId, achievementId, score, comment, conclusion, dimensionScores, reviewType);
            jdbcTemplate.update(
                    "UPDATE achievement SET expert_score = ?, expert_comment = ?, review_conclusion = ?, " +
                            "dimension_scores = ?, review_status = 2 WHERE id = ?",
                    score, comment, conclusion, dimensionScores, achievementId);
            return Result.success("评审提交成功", null);
        } catch (Exception e) {
            return Result.error("提交失败");
        }
    }

    @GetMapping("/statistics/{expertId}")
    public Result<?> statistics(@PathVariable Long expertId, @AuthenticationPrincipal JwtUser user) {
        try {
            if (!canAccessExpert(user, expertId)) return Result.error("只能访问本人的评审数据");
            Integer pending = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM achievement WHERE score > 0 AND review_status = 2", Integer.class);
            Integer total = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM expert_reviews WHERE expert_id = ?", Integer.class, expertId);
            Double avg = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(AVG(score),0) FROM expert_reviews WHERE expert_id = ?", Double.class, expertId);
            Integer excellent = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM expert_reviews WHERE expert_id = ? AND conclusion = 'excellent'",
                    Integer.class, expertId);

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("pendingCount", pending == null ? 0 : pending);
            data.put("totalReviews", total == null ? 0 : total);
            data.put("avgScore", String.format("%.1f", avg == null ? 0.0 : avg));
            data.put("excellentCount", excellent == null ? 0 : excellent);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("获取失败");
        }
    }

    @GetMapping("/reviews/{expertId}")
    public Result<?> reviews(@PathVariable Long expertId, @AuthenticationPrincipal JwtUser user) {
        try {
            if (!canAccessExpert(user, expertId)) return Result.error("只能访问本人的评审数据");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT er.id, er.achievement_id AS achievementId, a.title AS achievementTitle, " +
                            "a.type AS achievementType, er.score, er.comment, er.conclusion, er.dimension_scores, " +
                            "er.review_time, er.review_type AS reviewType " +
                            "FROM expert_reviews er LEFT JOIN achievement a ON er.achievement_id = a.id " +
                            "WHERE er.expert_id = ? ORDER BY er.review_time DESC", expertId);
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error("获取失败");
        }
    }

    @GetMapping("/notifications/{expertId}")
    public Result<?> notifications(@PathVariable Long expertId, @AuthenticationPrincipal JwtUser user) {
        try {
            if (!canAccessExpert(user, expertId)) return Result.error("只能访问本人的评审数据");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT * FROM expert_notifications WHERE expert_id = ? ORDER BY is_read ASC, create_time DESC",
                    expertId);
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error("获取通知失败");
        }
    }

    @PutMapping("/notifications/{id}/read")
    public Result<?> readNotification(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT expert_id FROM expert_notifications WHERE id = ?", id);
            if (rows.isEmpty()) return Result.error("通知不存在");
            Object owner = rows.get(0).get("expert_id");
            if (!"admin".equals(user.getUserType())
                    && (owner == null || ((Number) owner).longValue() != user.getId())) {
                return Result.error("只能操作自己的通知");
            }
            jdbcTemplate.update("UPDATE expert_notifications SET is_read = 1 WHERE id = ?", id);
            return Result.success("已读", null);
        } catch (Exception e) {
            return Result.error("标记已读失败");
        }
    }

    private boolean isExpertOrAdmin(JwtUser user) {
        return user != null && ("expert".equals(user.getUserType()) || "admin".equals(user.getUserType()));
    }

    private boolean canAccessExpert(JwtUser user, Long expertId) {
        return user != null && ("admin".equals(user.getUserType())
                || ("expert".equals(user.getUserType()) && user.getId() != null && user.getId().equals(expertId)));
    }

    private String basename(String path) {
        String normalized = path.replace('\\', '/');
        int slash = normalized.lastIndexOf('/');
        return slash >= 0 ? normalized.substring(slash + 1) : normalized;
    }

    private String sizeText(long size) {
        if (size <= 0) return "";
        if (size < 1024) return size + " B";
        if (size < 1048576) return String.format("%.1f KB", size / 1024.0);
        return String.format("%.1f MB", size / 1048576.0);
    }
}

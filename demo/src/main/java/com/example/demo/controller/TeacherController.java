package com.example.demo.controller;

import com.example.demo.config.JwtUser;
import com.example.demo.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 教师端扩展：我的评分记录、评分统计、孵化跟踪、评语模板
 */
@RestController
@RequestMapping("/api/teacher")
public class TeacherController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void initSchema() {
        try {
            jdbcTemplate.execute("ALTER TABLE achievement ADD COLUMN score_teacher_id BIGINT");
        } catch (Exception ignored) { }
        try {
            jdbcTemplate.execute("ALTER TABLE achievement ADD COLUMN score_time DATETIME");
        } catch (Exception ignored) { }
        try {
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS comment_template (" +
                    "id BIGINT PRIMARY KEY AUTO_INCREMENT, teacher_id BIGINT NOT NULL, " +
                    "content VARCHAR(500) NOT NULL, create_time DATETIME DEFAULT CURRENT_TIMESTAMP)");
        } catch (Exception ignored) { }
    }

    @GetMapping("/score-records")
    public Result<?> scoreRecords(@AuthenticationPrincipal JwtUser user) {
        if (!isTeacher(user)) return Result.error("没有教师权限");
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT a.id, a.title, a.type, a.score, a.score_time AS scoreTime, " +
                            "a.update_time AS updateTime, a.student_id AS studentId, s.real_name AS studentName " +
                            "FROM achievement a LEFT JOIN student_user s ON a.student_id = s.id " +
                            "WHERE a.score_teacher_id = ? ORDER BY a.score_time DESC", user.getId());
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error("获取评分记录失败");
        }
    }

    @GetMapping("/score-stats")
    public Result<?> scoreStats(@AuthenticationPrincipal JwtUser user) {
        if (!isTeacher(user)) return Result.error("没有教师权限");
        try {
            String college = user.getCollege() == null ? "" : user.getCollege();
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("total", count("SELECT COUNT(*) FROM achievement WHERE college = ?", college));
            data.put("scored", count("SELECT COUNT(*) FROM achievement WHERE college = ? AND score > 0", college));
            data.put("pending", count("SELECT COUNT(*) FROM achievement WHERE college = ? AND (score IS NULL OR score = 0)", college));
            Double avg = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(AVG(score),0) FROM achievement WHERE college = ? AND score > 0", Double.class, college);
            data.put("averageScore", avg == null ? 0 : Math.round(avg * 10.0) / 10.0);

            List<Map<String, Object>> distribution = jdbcTemplate.queryForList(
                    "SELECT CASE WHEN score IS NULL OR score = 0 THEN '未评分' " +
                            "WHEN score < 60 THEN '60分以下' WHEN score < 70 THEN '60-69分' " +
                            "WHEN score < 80 THEN '70-79分' WHEN score < 90 THEN '80-89分' " +
                            "ELSE '90分以上' END AS name, COUNT(*) AS value " +
                            "FROM achievement WHERE college = ? GROUP BY name", college);
            data.put("distribution", distribution);

            List<Map<String, Object>> monthly = jdbcTemplate.queryForList(
                    "SELECT DATE_FORMAT(create_time,'%Y-%m') AS month, COUNT(*) AS value, " +
                            "ROUND(AVG(NULLIF(score,0)),1) AS avgScore FROM achievement WHERE college = ? " +
                            "AND create_time >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH) GROUP BY month ORDER BY month", college);
            data.put("monthly", monthly);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("获取评分统计失败");
        }
    }

    @GetMapping("/incubation")
    public Result<?> incubation(@AuthenticationPrincipal JwtUser user) {
        if (!isTeacher(user)) return Result.error("没有教师权限");
        try {
            String college = user.getCollege() == null ? "" : user.getCollege();
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT a.id, a.title, a.type, a.score, a.incubation_score AS incubationScore, " +
                            "a.incubation_status AS incubationStatus, a.review_status AS reviewStatus, " +
                            "a.student_id AS studentId, s.real_name AS studentName, a.update_time AS updateTime " +
                            "FROM achievement a LEFT JOIN student_user s ON a.student_id = s.id " +
                            "WHERE a.college = ? AND a.incubation_status IN (1,2,3) ORDER BY a.update_time DESC", college);
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error("获取孵化项目失败");
        }
    }

    @GetMapping("/templates")
    public Result<?> templates(@AuthenticationPrincipal JwtUser user) {
        if (!isTeacher(user)) return Result.error("没有教师权限");
        try {
            return Result.success(jdbcTemplate.queryForList(
                    "SELECT id, content, create_time AS createTime FROM comment_template WHERE teacher_id = ? ORDER BY id DESC",
                    user.getId()));
        } catch (Exception e) {
            return Result.error("获取评语模板失败");
        }
    }

    @PostMapping("/templates")
    public Result<?> addTemplate(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        if (!isTeacher(user)) return Result.error("没有教师权限");
        Object content = body.get("content");
        if (content == null || String.valueOf(content).trim().isEmpty()) return Result.error("评语不能为空");
        try {
            jdbcTemplate.update("INSERT INTO comment_template (teacher_id, content) VALUES (?,?)",
                    user.getId(), String.valueOf(content).trim());
            return Result.success("添加成功", null);
        } catch (Exception e) {
            return Result.error("添加失败");
        }
    }

    @DeleteMapping("/templates/{id}")
    public Result<?> deleteTemplate(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        if (!isTeacher(user)) return Result.error("没有教师权限");
        try {
            jdbcTemplate.update("DELETE FROM comment_template WHERE id = ? AND teacher_id = ?", id, user.getId());
            return Result.success("删除成功", null);
        } catch (Exception e) {
            return Result.error("删除失败");
        }
    }

    private boolean isTeacher(JwtUser user) {
        return user != null && "teacher".equals(user.getUserType());
    }

    private int count(String sql, Object... params) {
        Integer value = jdbcTemplate.queryForObject(sql, Integer.class, params);
        return value == null ? 0 : value;
    }
}

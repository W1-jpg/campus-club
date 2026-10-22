package com.example.demo.controller;

import com.example.demo.config.JwtUser;
import com.example.demo.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 学生端：合作意向（企业发起，学生回复）
 */
@RestController
@RequestMapping("/api/student")
public class StudentController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/intents")
    public Result<?> intents(@AuthenticationPrincipal JwtUser user) {
        if (user == null || !"student".equals(user.getUserType())) return Result.error("没有学生权限");
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT ci.id, ci.achievement_id AS achievementId, a.title AS achievementTitle, " +
                            "ci.enterprise_id AS enterpriseId, e.company_name AS enterpriseName, " +
                            "ci.message, ci.status, ci.reply, ci.create_time AS createTime, ci.update_time AS updateTime " +
                            "FROM cooperation_intent ci LEFT JOIN achievement a ON ci.achievement_id = a.id " +
                            "LEFT JOIN enterprise_user e ON ci.enterprise_id = e.id " +
                            "WHERE ci.student_id = ? ORDER BY ci.create_time DESC", user.getId());
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error("获取合作意向失败");
        }
    }

    @PutMapping("/intents/{id}/reply")
    public Result<?> reply(@PathVariable Long id, @RequestBody Map<String, Object> body,
                           @AuthenticationPrincipal JwtUser user) {
        if (user == null || !"student".equals(user.getUserType())) return Result.error("没有学生权限");
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT student_id FROM cooperation_intent WHERE id = ?", id);
            if (rows.isEmpty()) return Result.error("合作意向不存在");
            Object owner = rows.get(0).get("student_id");
            if (owner == null || ((Number) owner).longValue() != user.getId()) {
                return Result.error("只能回复自己的合作意向");
            }
            Object status = body.get("status");
            Object reply = body.get("reply");
            if (status == null || (!"已接受".equals(String.valueOf(status)) && !"已拒绝".equals(String.valueOf(status)))) {
                return Result.error("状态不合法");
            }
            jdbcTemplate.update("UPDATE cooperation_intent SET status=?, reply=? WHERE id=?",
                    status, reply == null ? "" : reply, id);
            return Result.success("回复成功", null);
        } catch (Exception e) {
            return Result.error("回复失败");
        }
    }
}

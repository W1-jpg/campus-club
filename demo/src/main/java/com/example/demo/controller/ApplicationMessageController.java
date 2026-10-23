package com.example.demo.controller;

import com.example.demo.config.JwtUser;
import com.example.demo.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.annotation.PostConstruct;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 申请单内沟通：学生与企业围绕一条资源申请留言。
 */
@RestController
@RequestMapping("/api/application")
public class ApplicationMessageController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void initSchema() {
        try {
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS application_message (" +
                    "id BIGINT PRIMARY KEY AUTO_INCREMENT, application_id BIGINT NOT NULL, " +
                    "sender_id BIGINT NOT NULL, sender_type VARCHAR(20), content VARCHAR(1000), " +
                    "is_read TINYINT DEFAULT 0, create_time DATETIME DEFAULT CURRENT_TIMESTAMP, " +
                    "INDEX idx_application (application_id))");
        } catch (Exception ignored) { }
    }

    @GetMapping("/{id}/messages")
    public Result<?> messages(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        try {
            Map<String, Object> app = application(id);
            if (app == null) return Result.error("申请不存在");
            if (!canAccess(user, app)) return Result.error("只能查看自己申请的消息");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT id, application_id AS applicationId, sender_id AS senderId, sender_type AS senderType, " +
                            "content, is_read AS isRead, create_time AS createTime FROM application_message " +
                            "WHERE application_id = ? ORDER BY id ASC", id);
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error("获取消息失败");
        }
    }

    @PostMapping("/{id}/messages")
    public Result<?> send(@PathVariable Long id, @RequestBody Map<String, Object> body,
                          @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            Map<String, Object> app = application(id);
            if (app == null) return Result.error("申请不存在");
            if (!canAccess(user, app)) return Result.error("只能在自己申请中留言");
            Object content = body.get("content");
            if (content == null || String.valueOf(content).trim().isEmpty()) return Result.error("消息不能为空");
            String text = String.valueOf(content).trim();
            if (text.length() > 1000) return Result.error("消息不能超过 1000 字");
            jdbcTemplate.update(
                    "INSERT INTO application_message (application_id, sender_id, sender_type, content) VALUES (?,?,?,?)",
                    id, user.getId(), user.getUserType(), text);
            return Result.success("发送成功", null);
        } catch (Exception e) {
            return Result.error("发送失败");
        }
    }

    @PutMapping("/{id}/messages/read")
    public Result<?> markRead(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        try {
            Map<String, Object> app = application(id);
            if (app == null) return Result.error("申请不存在");
            if (!canAccess(user, app)) return Result.error("没有权限");
            jdbcTemplate.update(
                    "UPDATE application_message SET is_read = 1 WHERE application_id = ? AND sender_id <> ?",
                    id, user.getId());
            return Result.success("已读", null);
        } catch (Exception e) {
            return Result.error("标记已读失败");
        }
    }

    private Map<String, Object> application(Long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT ra.student_id AS studentId, r.enterprise_id AS enterpriseId " +
                        "FROM resource_application ra JOIN resource r ON ra.resource_id = r.id WHERE ra.id = ?", id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private boolean canAccess(JwtUser user, Map<String, Object> app) {
        if (user == null) return false;
        if ("admin".equals(user.getUserType())) return true;
        Object studentId = app.get("studentId");
        Object enterpriseId = app.get("enterpriseId");
        if ("student".equals(user.getUserType())) {
            return studentId instanceof Number && ((Number) studentId).longValue() == user.getId();
        }
        if ("enterprise".equals(user.getUserType())) {
            return enterpriseId instanceof Number && ((Number) enterpriseId).longValue() == user.getId();
        }
        return false;
    }
}

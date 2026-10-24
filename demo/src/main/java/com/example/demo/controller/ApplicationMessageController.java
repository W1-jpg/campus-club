package com.example.demo.controller;

import com.example.demo.config.JwtUser;
import com.example.demo.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.File;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 申请单内沟通：学生与企业围绕一条资源申请留言。
 */
@RestController
@RequestMapping("/api/application")
public class ApplicationMessageController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Value("${file.upload.path}")
    private String uploadPath;

    @PostConstruct
    public void initSchema() {
        try {
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS application_message (" +
                    "id BIGINT PRIMARY KEY AUTO_INCREMENT, application_id BIGINT NOT NULL, " +
                    "sender_id BIGINT NOT NULL, sender_type VARCHAR(20), content VARCHAR(1000), " +
                    "is_read TINYINT DEFAULT 0, create_time DATETIME DEFAULT CURRENT_TIMESTAMP, " +
                    "INDEX idx_application (application_id))");
        } catch (Exception ignored) { }
        try {
            jdbcTemplate.execute("ALTER TABLE application_message ADD COLUMN message_type VARCHAR(20) DEFAULT 'text'");
        } catch (Exception ignored) { }
        try {
            jdbcTemplate.execute("ALTER TABLE application_message ADD COLUMN audio_url VARCHAR(500)");
        } catch (Exception ignored) { }
        try {
            jdbcTemplate.execute("ALTER TABLE application_message ADD COLUMN duration INT");
        } catch (Exception ignored) { }
        try {
            jdbcTemplate.execute("ALTER TABLE application_message ADD COLUMN file_size BIGINT");
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
                            "content, message_type AS messageType, audio_url AS audioUrl, duration, file_size AS fileSize, " +
                            "is_read AS isRead, create_time AS createTime FROM application_message " +
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
                    "INSERT INTO application_message (application_id, sender_id, sender_type, content, message_type) VALUES (?,?,?,?, 'text')",
                    id, user.getId(), user.getUserType(), text);
            return Result.success("发送成功", null);
        } catch (Exception e) {
            return Result.error("发送失败");
        }
    }

    @PostMapping("/{id}/messages/voice")
    public Result<?> sendVoice(@PathVariable Long id,
                               @RequestParam("file") MultipartFile file,
                               @RequestParam(value = "duration", defaultValue = "0") Integer duration,
                               @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            Map<String, Object> app = application(id);
            if (app == null) return Result.error("申请不存在");
            if (!canAccess(user, app)) return Result.error("只能在自己申请中留言");
            if (file == null || file.isEmpty()) return Result.error("语音文件为空");
            if (file.getSize() > 2 * 1024 * 1024) return Result.error("语音不能超过 2MB");
            if (duration == null || duration < 1 || duration > 60) return Result.error("语音时长需在 1-60 秒之间");

            String original = file.getOriginalFilename() == null ? "voice.webm" : file.getOriginalFilename();
            int dot = original.lastIndexOf('.');
            String ext = dot < 0 ? ".webm" : original.substring(dot).toLowerCase();
            if (!".webm".equals(ext) && !".ogg".equals(ext) && !".mp4".equals(ext)
                    && !".mpeg".equals(ext) && !".mp3".equals(ext) && !".wav".equals(ext)) {
                return Result.error("不支持的语音格式");
            }
            File dir = new File(uploadPath, "voice");
            if (!dir.exists() && !dir.mkdirs()) return Result.error("语音目录创建失败");
            String savedName = UUID.randomUUID().toString().replace("-", "") + ext;
            file.transferTo(new File(dir, savedName));
            String audioUrl = "/uploads/voice/" + savedName;

            jdbcTemplate.update(
                    "INSERT INTO application_message " +
                            "(application_id, sender_id, sender_type, content, message_type, audio_url, duration, file_size) " +
                            "VALUES (?,?,?,?, 'voice', ?, ?, ?)",
                    id, user.getId(), user.getUserType(), "[语音消息]", audioUrl, duration, file.getSize());
            return Result.success("语音发送成功", null);
        } catch (Exception e) {
            return Result.error("语音发送失败");
        }
    }

    @GetMapping("/unread")
    public Result<?> unread(@AuthenticationPrincipal JwtUser user) {
        if (user == null) return Result.error("未登录或登录已过期");
        try {
            String roleCondition;
            Object[] params;
            if ("student".equals(user.getUserType())) {
                roleCondition = "ra.student_id = ?";
                params = new Object[]{user.getId(), user.getId()};
            } else if ("enterprise".equals(user.getUserType())) {
                roleCondition = "r.enterprise_id = ?";
                params = new Object[]{user.getId(), user.getId()};
            } else if ("admin".equals(user.getUserType())) {
                roleCondition = "1 = 1";
                params = new Object[]{user.getId()};
            } else {
                return Result.success(new java.util.ArrayList<>());
            }
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT m.application_id AS applicationId, COUNT(*) AS unreadCount " +
                            "FROM application_message m " +
                            "JOIN resource_application ra ON m.application_id = ra.id " +
                            "JOIN resource r ON ra.resource_id = r.id " +
                            "WHERE m.is_read = 0 AND m.sender_id <> ? AND " + roleCondition +
                            " GROUP BY m.application_id", params);
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error("获取未读消息失败");
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

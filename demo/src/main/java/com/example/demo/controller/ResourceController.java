package com.example.demo.controller;

import com.example.demo.config.JwtUser;
import com.example.demo.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 资源模块：发布、列表、详情、申请、审批
 */
@RestController
@RequestMapping("/api/resource")
public class ResourceController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // ==================== 列表 / 详情 ====================

    @GetMapping("/list")
    public Result<?> list(@AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT id, title, type, provider, description, publish_time AS publishTime, " +
                            "end_time AS endTime, status, view_count AS viewCount, apply_count AS applyCount, " +
                            "(SELECT COALESCE(SUM(re.amount),0) FROM resource_expense re WHERE re.resource_id = resource.id) AS receivedAmount " +
                            "FROM resource ORDER BY publish_time DESC, id DESC");
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error("获取资源列表失败");
        }
    }

    @GetMapping("/type/{type}")
    public Result<?> byType(@PathVariable String type, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT id, title, type, provider, description, publish_time AS publishTime, " +
                            "end_time AS endTime, status, view_count AS viewCount, apply_count AS applyCount " +
                            "FROM resource WHERE type = ? ORDER BY publish_time DESC, id DESC", type);
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error("获取资源列表失败");
        }
    }

    @GetMapping("/{id}")
    public Result<?> detail(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT id, title, type, provider, description, publish_time AS publishTime, " +
                            "end_time AS endTime, status, view_count AS viewCount, apply_count AS applyCount, " +
                            "(SELECT COALESCE(SUM(re.amount),0) FROM resource_expense re WHERE re.resource_id = resource.id) AS receivedAmount " +
                            "FROM resource WHERE id = ?", id);
            if (rows.isEmpty()) return Result.error("资源不存在");
            return Result.success(rows.get(0));
        } catch (Exception e) {
            return Result.error("获取资源详情失败");
        }
    }

    // ==================== 发布 / 删除 ====================

    @PostMapping
    public Result<?> create(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            if (!isStaff(user) && !"enterprise".equals(user.getUserType())) {
                return Result.error("没有发布资源的权限");
            }
            Object title = body.get("title");
            Object type = body.get("type");
            if (title == null || type == null) {
                return Result.error("缺少必要参数");
            }

            Long enterpriseId = "enterprise".equals(user.getUserType()) ? user.getId() : null;
            jdbcTemplate.update(
                    "INSERT INTO resource (title, type, provider, description, publish_time, end_time, status, enterprise_id) " +
                            "VALUES (?,?,?,?,?,?,?,?)",
                    title, type, body.get("provider"), body.get("description"),
                    parseDateTime(body.get("publishTime")), parseDateTime(body.get("endTime")),
                    body.get("status") == null ? "进行中" : body.get("status"), enterpriseId);
            return Result.success("资源发布成功", null);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "创建资源失败" : e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT enterprise_id FROM resource WHERE id = ?", id);
            if (rows.isEmpty()) return Result.error("资源不存在");
            Object owner = rows.get(0).get("enterprise_id");
            if ("enterprise".equals(user.getUserType())
                    && (owner == null || ((Number) owner).longValue() != user.getId())) {
                return Result.error("只能删除自己发布的资源");
            }
            if (!isStaff(user) && !"enterprise".equals(user.getUserType())) {
                return Result.error("没有删除资源的权限");
            }
            jdbcTemplate.update("DELETE FROM resource_application WHERE resource_id = ?", id);
            jdbcTemplate.update("DELETE FROM resource_expense WHERE resource_id = ?", id);
            jdbcTemplate.update("DELETE FROM resource WHERE id = ?", id);
            return Result.success("资源删除成功", null);
        } catch (Exception e) {
            return Result.error("删除资源失败");
        }
    }

    // ==================== 学生申请 ====================

    @PostMapping("/apply")
    public Result<?> apply(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            if (!"student".equals(user.getUserType())) {
                return Result.error("只有学生可以申请资源");
            }
            Object resourceIdRaw = body.get("resourceId");
            if (resourceIdRaw == null) return Result.error("缺少必要参数");
            Long resourceId = Long.valueOf(String.valueOf(resourceIdRaw));

            List<Map<String, Object>> qualified = jdbcTemplate.queryForList(
                    "SELECT id FROM achievement WHERE student_id = ? AND score > 0 AND review_status = 2 LIMIT 1",
                    user.getId());
            if (qualified.isEmpty()) {
                return Result.error("您的项目尚未通过教师评分和专家双审，请先上传成果并等待双审通过后再申请");
            }

            List<Map<String, Object>> exists = jdbcTemplate.queryForList(
                    "SELECT id FROM resource_application WHERE resource_id = ? AND student_id = ?",
                    resourceId, user.getId());
            if (!exists.isEmpty()) {
                return Result.error("您已申请过该资源，请勿重复申请");
            }

            String studentName = user.getUsername();
            List<Map<String, Object>> students = jdbcTemplate.queryForList(
                    "SELECT real_name FROM student_user WHERE id = ?", user.getId());
            if (!students.isEmpty() && students.get(0).get("real_name") != null) {
                studentName = String.valueOf(students.get(0).get("real_name"));
            }

            jdbcTemplate.update(
                    "INSERT INTO resource_application (resource_id, student_id, student_name, student_college) VALUES (?,?,?,?)",
                    resourceId, user.getId(), studentName, user.getCollege() == null ? "" : user.getCollege());
            jdbcTemplate.update("UPDATE resource SET apply_count = COALESCE(apply_count, 0) + 1 WHERE id = ?", resourceId);
            return Result.success("申请提交成功", null);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "申请资源失败" : e.getMessage());
        }
    }

    // ==================== 申请列表 ====================

    @GetMapping("/applications/student/{studentId}")
    public Result<?> studentApplications(@PathVariable Long studentId, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            if ("student".equals(user.getUserType()) && !studentId.equals(user.getId())) {
                return Result.error("只能查看自己的申请");
            }
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT id, resource_id AS resourceId, student_id AS studentId, student_name AS studentName, " +
                            "student_college AS studentCollege, status, application_time AS applicationTime " +
                            "FROM resource_application WHERE student_id = ? ORDER BY application_time DESC", studentId);
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error("获取学生申请列表失败");
        }
    }

    @GetMapping("/applications/resource/{resourceId}")
    public Result<?> resourceApplications(@PathVariable Long resourceId, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            if (!isStaff(user) && !"enterprise".equals(user.getUserType())) {
                return Result.error("没有查看申请列表的权限");
            }
            if ("enterprise".equals(user.getUserType()) && !ownsResource(resourceId, user.getId())) {
                return Result.error("只能查看自己资源的申请");
            }
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT id, resource_id AS resourceId, student_id AS studentId, student_name AS studentName, " +
                            "student_college AS studentCollege, status, application_time AS applicationTime " +
                            "FROM resource_application WHERE resource_id = ? ORDER BY application_time DESC", resourceId);
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error("获取资源申请列表失败");
        }
    }

    @PutMapping("/applications/{id}/status")
    public Result<?> updateApplicationStatus(@PathVariable Long id,
                                             @RequestParam String status,
                                             @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            if (!isStaff(user) && !"enterprise".equals(user.getUserType())) {
                return Result.error("没有审批权限");
            }
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT resource_id FROM resource_application WHERE id = ?", id);
            if (rows.isEmpty()) return Result.error("申请不存在");
            Object resourceId = rows.get(0).get("resource_id");
            if ("enterprise".equals(user.getUserType())
                    && (resourceId == null || !ownsResource(((Number) resourceId).longValue(), user.getId()))) {
                return Result.error("只能审批自己资源的申请");
            }
            jdbcTemplate.update("UPDATE resource_application SET status = ? WHERE id = ?", status, id);
            return Result.success("申请" + status + "成功", null);
        } catch (Exception e) {
            return Result.error("更新申请状态失败");
        }
    }

    // ==================== 工具方法 ====================

    private boolean isStaff(JwtUser user) {
        return "teacher".equals(user.getUserType()) || "admin".equals(user.getUserType());
    }

    private boolean ownsResource(Long resourceId, Long enterpriseId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT enterprise_id FROM resource WHERE id = ?", resourceId);
        if (rows.isEmpty()) return false;
        Object owner = rows.get(0).get("enterprise_id");
        return owner instanceof Number && ((Number) owner).longValue() == enterpriseId;
    }

    /** 前端 datetime-local / Date.toJSON 的字符串转 Timestamp */
    private Timestamp parseDateTime(Object value) {
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        if (text.isEmpty() || "null".equalsIgnoreCase(text)) return null;
        try {
            if (text.endsWith("Z") || text.contains("+")) {
                return Timestamp.from(Instant.parse(text));
            }
            if (text.contains("T")) {
                text = text.replace('T', ' ');
            }
            if (text.length() == 16) {
                text += ":00";
            }
            if (text.length() > 19) {
                text = text.substring(0, 19);
            }
            return Timestamp.valueOf(text);
        } catch (Exception e) {
            return null;
        }
    }
}

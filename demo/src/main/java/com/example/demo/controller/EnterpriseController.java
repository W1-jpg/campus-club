package com.example.demo.controller;

import com.example.demo.config.JwtUser;
import com.example.demo.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 企业端：统计、资源投递、申请审批、成果浏览、收藏
 */
@RestController
@RequestMapping("/api/enterprise")
public class EnterpriseController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // ==================== 统计 ====================

    @GetMapping("/stats/{enterpriseId}")
    public Result<?> stats(@PathVariable Long enterpriseId, @AuthenticationPrincipal JwtUser user) {
        try {
            if (!canAccess(user, enterpriseId)) return Result.error("只能访问本企业的数据");
            Integer resourceCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM resource WHERE enterprise_id = ?", Integer.class, enterpriseId);
            Integer applicationCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM resource_application ra JOIN resource r ON ra.resource_id = r.id WHERE r.enterprise_id = ?",
                    Integer.class, enterpriseId);
            Integer bookmarkCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM enterprise_bookmark WHERE enterprise_id = ?", Integer.class, enterpriseId);

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("resourceCount", resourceCount == null ? 0 : resourceCount);
            data.put("applicationCount", applicationCount == null ? 0 : applicationCount);
            data.put("bookmarkCount", bookmarkCount == null ? 0 : bookmarkCount);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("获取统计失败");
        }
    }

    // ==================== 企业资源 ====================

    @GetMapping("/resources/{enterpriseId}")
    public Result<?> resources(@PathVariable Long enterpriseId, @AuthenticationPrincipal JwtUser user) {
        try {
            if (!canAccess(user, enterpriseId)) return Result.error("只能访问本企业的数据");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT r.id, r.title, r.type, r.provider, r.description, r.publish_time AS publishTime, " +
                            "r.end_time AS endTime, r.status, r.view_count AS viewCount, " +
                            "COALESCE((SELECT COUNT(*) FROM resource_application ra WHERE ra.resource_id = r.id), 0) AS applyCount, " +
                            "COALESCE((SELECT SUM(re.amount) FROM resource_expense re WHERE re.resource_id = r.id), 0) AS receivedAmount " +
                            "FROM resource r WHERE r.enterprise_id = ? ORDER BY r.create_time DESC", enterpriseId);
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error("获取失败");
        }
    }

    @PostMapping("/resources")
    public Result<?> createResource(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null || (!"enterprise".equals(user.getUserType()) && !"admin".equals(user.getUserType()))) {
                return Result.error("没有投递资源的权限");
            }
            Object title = body.get("title");
            Object type = body.get("type");
            if (title == null || type == null) return Result.error("缺少必要参数");

            Object enterpriseIdRaw = body.get("enterpriseId");
            Long enterpriseId = "enterprise".equals(user.getUserType())
                    ? user.getId()
                    : (enterpriseIdRaw == null ? null : Long.valueOf(String.valueOf(enterpriseIdRaw)));
            if (enterpriseId == null) return Result.error("缺少企业标识");

            jdbcTemplate.update(
                    "INSERT INTO resource (title, type, provider, description, publish_time, end_time, status, enterprise_id) " +
                            "VALUES (?,?,?,?,?,?,?,?)",
                    title, type,
                    body.get("provider") == null ? "" : body.get("provider"),
                    body.get("description") == null ? "" : body.get("description"),
                    parseDateTime(body.get("publishTime")),
                    parseDateTime(body.get("endTime")),
                    "active", enterpriseId);
            return Result.success("资源投递成功", null);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "投递失败" : e.getMessage());
        }
    }

    @DeleteMapping("/resources/{id}")
    public Result<?> offlineResource(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT enterprise_id FROM resource WHERE id = ?", id);
            if (rows.isEmpty()) return Result.error("资源不存在");
            Object owner = rows.get(0).get("enterprise_id");
            if (!"admin".equals(user.getUserType())
                    && (owner == null || ((Number) owner).longValue() != user.getId())) {
                return Result.error("只能下架自己的资源");
            }
            jdbcTemplate.update("UPDATE resource SET status = 'inactive' WHERE id = ?", id);
            return Result.success("已下架", null);
        } catch (Exception e) {
            return Result.error("下架失败");
        }
    }

    // ==================== 申请审批 ====================

    @GetMapping("/applications/{enterpriseId}")
    public Result<?> applications(@PathVariable Long enterpriseId, @AuthenticationPrincipal JwtUser user) {
        try {
            if (!canAccess(user, enterpriseId)) return Result.error("只能访问本企业的数据");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT ra.id, ra.resource_id AS resourceId, r.title AS resourceTitle, " +
                            "ra.student_id AS studentId, ra.student_name AS studentName, " +
                            "ra.student_college AS studentCollege, ra.status, ra.application_time AS applicationTime, " +
                            "COALESCE((SELECT a.title FROM achievement a WHERE a.student_id = ra.student_id AND a.review_status = 2 LIMIT 1), '') AS achievementTitle " +
                            "FROM resource_application ra JOIN resource r ON ra.resource_id = r.id " +
                            "WHERE r.enterprise_id = ? ORDER BY ra.application_time DESC", enterpriseId);
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error("获取失败");
        }
    }

    @PutMapping("/applications/{id}/status")
    public Result<?> updateApplication(@PathVariable Long id,
                                       @RequestBody Map<String, Object> body,
                                       @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            Object status = body.get("status");
            if (status == null) return Result.error("缺少状态");

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT r.enterprise_id FROM resource_application ra JOIN resource r ON ra.resource_id = r.id WHERE ra.id = ?",
                    id);
            if (rows.isEmpty()) return Result.error("申请不存在");
            Object owner = rows.get(0).get("enterprise_id");
            if (!"admin".equals(user.getUserType())
                    && (owner == null || ((Number) owner).longValue() != user.getId())) {
                return Result.error("只能审批本企业资源的申请");
            }
            jdbcTemplate.update("UPDATE resource_application SET status = ? WHERE id = ?", status, id);
            return Result.success("审批成功", null);
        } catch (Exception e) {
            return Result.error("操作失败");
        }
    }

    // ==================== 成果浏览 / 收藏 ====================

    @GetMapping("/achievements")
    public Result<?> achievements(@RequestParam(required = false) Long enterpriseId,
                                  @RequestParam(defaultValue = "") String search,
                                  @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            Long eid = "admin".equals(user.getUserType())
                    ? (enterpriseId == null ? 0L : enterpriseId) : user.getId();

            StringBuilder where = new StringBuilder();
            List<Object> params = new ArrayList<>();
            if (!search.isEmpty()) {
                where.append(" WHERE (a.title LIKE ? OR a.type LIKE ?)");
                params.add("%" + search + "%");
                params.add("%" + search + "%");
            }

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT a.*, s.real_name AS studentName, " +
                            "(SELECT COUNT(*) FROM enterprise_bookmark b WHERE b.achievement_id = a.id AND b.enterprise_id = ?) AS isBookmarked " +
                            "FROM achievement a LEFT JOIN student_user s ON a.student_id = s.id" + where +
                            " ORDER BY a.create_time DESC", concat(eid, params));

            List<Map<String, Object>> list = new ArrayList<>();
            for (Map<String, Object> row : rows) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", row.get("id"));
                item.put("title", row.get("title"));
                item.put("type", row.get("type"));
                item.put("description", row.get("description"));
                item.put("college", row.get("college"));
                item.put("score", row.get("score"));
                item.put("studentId", row.get("student_id"));
                item.put("studentName", row.get("studentName"));
                item.put("reviewStatus", row.get("review_status"));
                item.put("incubationStatus", row.get("incubation_status"));
                item.put("incubationScore", row.get("incubation_score"));
                item.put("reviewConclusion", row.get("review_conclusion"));
                item.put("expertScore", row.get("expert_score"));
                item.put("teacherComment", row.get("teacher_comment"));
                item.put("expertComment", row.get("expert_comment"));
                item.put("dimensionScores", row.get("dimension_scores"));
                item.put("communityName", row.get("community_name"));
                item.put("createTime", row.get("create_time"));
                Object marked = row.get("isBookmarked");
                item.put("isBookmarked", marked instanceof Number && ((Number) marked).intValue() > 0);
                list.add(item);
            }

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("achievements", list);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("获取失败");
        }
    }

    @PostMapping("/bookmark")
    public Result<?> bookmark(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            Object achievementId = body.get("achievementId");
            if (achievementId == null) return Result.error("缺少参数");

            Long eid;
            if ("admin".equals(user.getUserType()) && body.get("enterpriseId") != null) {
                eid = Long.valueOf(String.valueOf(body.get("enterpriseId")));
            } else {
                eid = user.getId();
            }

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT id FROM enterprise_bookmark WHERE enterprise_id = ? AND achievement_id = ?",
                    eid, achievementId);
            Map<String, Object> data = new LinkedHashMap<>();
            if (!rows.isEmpty()) {
                jdbcTemplate.update("DELETE FROM enterprise_bookmark WHERE id = ?", rows.get(0).get("id"));
                data.put("bookmarked", false);
                return Result.success("已取消收藏", data);
            }
            jdbcTemplate.update("INSERT INTO enterprise_bookmark (enterprise_id, achievement_id) VALUES (?,?)",
                    eid, achievementId);
            data.put("bookmarked", true);
            return Result.success("收藏成功", data);
        } catch (Exception e) {
            return Result.error("操作失败");
        }
    }

    @GetMapping("/achievement/{id}/files")
    public Result<?> achievementFiles(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
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

    @GetMapping("/achievement/{id}/review-detail")
    public Result<?> reviewDetail(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT COALESCE(expert_comment, teacher_comment) AS comment, " +
                            "review_conclusion AS conclusion, dimension_scores AS dimensionScores, " +
                            "expert_score AS expertScore FROM achievement WHERE id = ?", id);
            return Result.success(rows.isEmpty() ? new LinkedHashMap<>() : rows.get(0));
        } catch (Exception e) {
            return Result.error("获取失败");
        }
    }

    // ==================== 工具方法 ====================

    private boolean canAccess(JwtUser user, Long enterpriseId) {
        return user != null && ("admin".equals(user.getUserType())
                || ("enterprise".equals(user.getUserType())
                && user.getId() != null && user.getId().equals(enterpriseId)));
    }

    private Object[] concat(Object first, List<Object> rest) {
        List<Object> all = new ArrayList<>();
        all.add(first);
        all.addAll(rest);
        return all.toArray();
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

    private Timestamp parseDateTime(Object value) {
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        if (text.isEmpty() || "null".equalsIgnoreCase(text)) return null;
        try {
            if (text.endsWith("Z") || text.contains("+")) {
                return Timestamp.from(Instant.parse(text));
            }
            if (text.contains("T")) text = text.replace('T', ' ');
            if (text.length() == 16) text += ":00";
            if (text.length() > 19) text = text.substring(0, 19);
            return Timestamp.valueOf(text);
        } catch (Exception e) {
            return null;
        }
    }
}

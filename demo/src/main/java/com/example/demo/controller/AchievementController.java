package com.example.demo.controller;

import com.example.demo.config.JwtUser;
import com.example.demo.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.*;

/**
 * 成果模块：上传、列表、详情、评论、点赞、评分、评审、孵化
 * 使用 JdbcTemplate 保持与 Express 完全一致的字段和返回结构。
 */
@RestController
@RequestMapping("/api/result")
public class AchievementController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Value("${file.upload.path}")
    private String uploadPath;

    // ==================== 上传 ====================

    @PostMapping("/upload")
    public Result<?> upload(@RequestParam String title,
                            @RequestParam String type,
                            @RequestParam(required = false) String description,
                            @RequestParam(value = "coverFile", required = false) MultipartFile coverFile,
                            @RequestParam(value = "clubFiles", required = false) MultipartFile[] clubFiles,
                            @RequestParam(value = "achievementFiles", required = false) MultipartFile[] achievementFiles,
                            @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) {
                return Result.error("未登录或登录已过期");
            }
            if (!"student".equals(user.getUserType())) {
                return Result.error("只有学生可以上传成果");
            }
            if (title == null || title.trim().isEmpty() || type == null || type.trim().isEmpty()) {
                return Result.error("缺少必要参数");
            }

            String coverPath = "";
            if (coverFile != null && !coverFile.isEmpty()) {
                String ext = extension(coverFile.getOriginalFilename());
                boolean allowed = Arrays.asList(".jpg", ".jpeg", ".png", ".webp", ".gif").contains(ext)
                        && coverFile.getContentType() != null
                        && coverFile.getContentType().startsWith("image/")
                        && coverFile.getSize() <= 5 * 1024 * 1024;
                if (!allowed) {
                    return Result.error("封面仅支持 jpg/png/webp/gif，且不超过 5MB");
                }
                coverPath = "/uploads/" + saveFile(coverFile);
            }

            final String finalCover = coverPath;
            final String finalDescription = description == null ? "" : description;
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(
                        "INSERT INTO achievement (title, description, type, student_id, college, cover) VALUES (?, ?, ?, ?, ?, ?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, title.trim());
                ps.setString(2, finalDescription);
                ps.setString(3, type.trim());
                ps.setLong(4, user.getId());
                ps.setString(5, user.getCollege() == null ? "" : user.getCollege());
                ps.setString(6, finalCover);
                return ps;
            }, keyHolder);

            Number key = keyHolder.getKey();
            if (key == null) {
                return Result.error("上传失败");
            }
            long achievementId = key.longValue();

            saveFiles(achievementId, clubFiles, "club");
            saveFiles(achievementId, achievementFiles, "achievement");

            return Result.success("上传成功", null);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "上传失败" : e.getMessage());
        }
    }

    private void saveFiles(long achievementId, MultipartFile[] files, String category) throws Exception {
        if (files == null) {
            return;
        }
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            String savedName = saveFile(file);
            jdbcTemplate.update(
                    "INSERT INTO file (achievement_id, file_name, file_path, file_size, file_type, file_category) VALUES (?,?,?,?,?,?)",
                    achievementId,
                    file.getOriginalFilename() == null ? savedName : file.getOriginalFilename(),
                    absolutePath(savedName),
                    file.getSize(),
                    file.getContentType(),
                    category);
        }
    }

    private String saveFile(MultipartFile file) throws Exception {
        File dir = new File(uploadPath);
        if (!dir.exists() && !dir.mkdirs()) {
            throw new RuntimeException("上传目录创建失败");
        }
        String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String ext = extension(original);
        String savedName = UUID.randomUUID().toString().replace("-", "") + ext;
        file.transferTo(new File(dir, savedName));
        return savedName;
    }

    private String absolutePath(String savedName) {
        File dir = new File(uploadPath);
        return new File(dir, savedName).getAbsolutePath();
    }

    private String extension(String name) {
        if (name == null) {
            return "";
        }
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot).toLowerCase();
    }

    // ==================== 列表 ====================

    @GetMapping("/list")
    public Result<?> list(@AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) {
                return Result.error("未登录或登录已过期");
            }
            String where = "";
            List<Object> params = new ArrayList<>();
            if ("student".equals(user.getUserType())) {
                where = " WHERE (review_status = 2 OR student_id = ?)";
                params.add(user.getId());
            } else if ("teacher".equals(user.getUserType())
                    && user.getCollege() != null && !user.getCollege().isEmpty()) {
                where = " WHERE (college = ? OR college IS NULL OR college = '')";
                params.add(user.getCollege());
            }

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT " + achievementColumns() + " FROM achievement" + where + " ORDER BY create_time DESC",
                    params.toArray());
            List<Map<String, Object>> list = new ArrayList<>();
            for (Map<String, Object> row : rows) {
                list.add(withFiles(row));
            }
            return Result.success(list);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "获取成果列表失败" : e.getMessage());
        }
    }

    @GetMapping("/browse")
    public Result<?> browse(@RequestParam(defaultValue = "") String type,
                            @RequestParam(defaultValue = "") String search,
                            @RequestParam(defaultValue = "1") int page,
                            @RequestParam(defaultValue = "9") int size,
                            @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) {
                return Result.error("未登录或登录已过期");
            }
            int pageNum = Math.max(page, 1);
            int pageSize = Math.max(size, 1);
            StringBuilder where = new StringBuilder(" WHERE a.review_status = 2");
            List<Object> params = new ArrayList<>();
            if ("teacher".equals(user.getUserType())
                    && user.getCollege() != null && !user.getCollege().isEmpty()) {
                where.append(" AND a.college = ?");
                params.add(user.getCollege());
            }
            if (!type.isEmpty()) {
                where.append(" AND a.type = ?");
                params.add(type);
            }
            if (!search.isEmpty()) {
                where.append(" AND (a.title LIKE ? OR a.type LIKE ?)");
                params.add("%" + search + "%");
                params.add("%" + search + "%");
            }

            Integer total = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM achievement a" + where, Integer.class, params.toArray());
            int offset = (pageNum - 1) * pageSize;

            List<Object> sqlParams = new ArrayList<>();
            String isLikedSelect = ", EXISTS(SELECT 1 FROM likes lk WHERE lk.achievement_id = a.id AND lk.user_id = ? AND lk.user_type = ?) AS isLiked";
            sqlParams.add(user.getId());
            sqlParams.add(user.getUserType());
            sqlParams.addAll(params);
            sqlParams.add(pageSize);
            sqlParams.add(offset);

            String sql = "SELECT a.id, a.title, a.type, a.description, a.student_id AS studentId, " +
                    "a.college, a.create_time AS createTime, a.update_time AS updateTime, a.status, " +
                    "a.score, a.incubation_status AS incubationStatus, a.review_status AS reviewStatus, " +
                    "a.view_count AS viewCount, a.cover, s.real_name AS studentName, " +
                    "(SELECT COUNT(*) FROM likes lk2 WHERE lk2.achievement_id = a.id) AS likeCount, " +
                    "(SELECT COUNT(*) FROM comment cm WHERE cm.achievement_id = a.id) AS commentCount" +
                    isLikedSelect +
                    " FROM achievement a LEFT JOIN student_user s ON a.student_id = s.id" + where +
                    " ORDER BY a.create_time DESC LIMIT ? OFFSET ?";

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, sqlParams.toArray());
            for (Map<String, Object> row : rows) {
                Object liked = row.get("isLiked");
                row.put("isLiked", liked instanceof Boolean ? liked : (liked instanceof Number && ((Number) liked).intValue() == 1));
            }

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("list", rows);
            data.put("total", total == null ? 0 : total);
            data.put("page", pageNum);
            data.put("size", pageSize);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "获取成果列表失败" : e.getMessage());
        }
    }

    @GetMapping("/my")
    public Result<?> my(@RequestParam(required = false) Long studentId,
                        @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) {
                return Result.error("未登录或登录已过期");
            }
            Long target = "student".equals(user.getUserType()) ? user.getId() : studentId;
            if (target == null) {
                return Result.error("缺少学生标识");
            }
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT " + achievementColumns() + " FROM achievement WHERE student_id = ? ORDER BY create_time DESC",
                    target);
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "获取成果失败" : e.getMessage());
        }
    }

    // ==================== 详情 ====================

    @GetMapping("/detail/{id}")
    public Result<?> detail(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) {
                return Result.error("未登录或登录已过期");
            }
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT " + achievementColumns() + " FROM achievement WHERE id = ?", id);
            if (rows.isEmpty()) {
                return Result.error("成果不存在");
            }
            Map<String, Object> data = new LinkedHashMap<>(rows.get(0));
            Object studentId = data.get("studentId");
            Object reviewStatus = data.get("reviewStatus");
            if ("student".equals(user.getUserType())
                    && (studentId == null || ((Number) studentId).longValue() != user.getId())
                    && (reviewStatus == null || ((Number) reviewStatus).intValue() != 2)) {
                return Result.error("无权查看该成果");
            }

            List<Map<String, Object>> files = jdbcTemplate.queryForList(
                    "SELECT * FROM file WHERE achievement_id = ?", id);
            List<Map<String, Object>> clubFiles = new ArrayList<>();
            List<Map<String, Object>> achievementFiles = new ArrayList<>();
            for (Map<String, Object> f : files) {
                Map<String, Object> info = fileInfo(f);
                if ("club".equals(String.valueOf(f.get("file_category")))) {
                    clubFiles.add(info);
                } else {
                    achievementFiles.add(info);
                }
            }

            String studentName = "";
            if (studentId instanceof Number) {
                List<Map<String, Object>> stu = jdbcTemplate.queryForList(
                        "SELECT real_name FROM student_user WHERE id = ?", studentId);
                if (!stu.isEmpty() && stu.get(0).get("real_name") != null) {
                    studentName = String.valueOf(stu.get(0).get("real_name"));
                }
            }

            Integer likeCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM likes WHERE achievement_id = ?", Integer.class, id);
            Integer commentCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM comment WHERE achievement_id = ?", Integer.class, id);
            Integer liked = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM likes WHERE achievement_id = ? AND user_id = ? AND user_type = ?",
                    Integer.class, id, user.getId(), user.getUserType());

            List<Map<String, Object>> comments = jdbcTemplate.queryForList(
                    "SELECT id, achievement_id AS achievementId, user_id AS userId, user_type AS userType, " +
                            "content, create_time AS createTime FROM comment WHERE achievement_id = ? ORDER BY create_time DESC",
                    id);

            data.put("studentName", studentName);
            data.put("likeCount", likeCount == null ? 0 : likeCount);
            data.put("commentCount", commentCount == null ? 0 : commentCount);
            data.put("isLiked", liked != null && liked > 0);
            data.put("comments", comments);
            data.put("clubFiles", clubFiles);
            data.put("achievementFiles", achievementFiles);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "获取成果详情失败" : e.getMessage());
        }
    }

    // ==================== 评论 / 点赞 / 浏览 ====================

    @PostMapping("/comment")
    public Result<?> comment(@RequestBody Map<String, Object> body,
                             @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            Object achievementId = body.get("achievementId");
            Object content = body.get("content");
            if (achievementId == null || content == null || String.valueOf(content).trim().isEmpty()) {
                return Result.error("缺少参数");
            }
            jdbcTemplate.update(
                    "INSERT INTO comment (achievement_id, user_id, user_type, content) VALUES (?,?,?,?)",
                    achievementId, user.getId(), user.getUserType(), String.valueOf(content).trim());
            return Result.success("评论成功", null);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "评论失败" : e.getMessage());
        }
    }

    @PostMapping("/like")
    public Result<?> like(@RequestParam Long achievementId, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            Integer exists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM likes WHERE achievement_id = ? AND user_id = ? AND user_type = ?",
                    Integer.class, achievementId, user.getId(), user.getUserType());
            if (exists != null && exists > 0) {
                return Result.success("已点赞", null);
            }
            jdbcTemplate.update("INSERT INTO likes (achievement_id, user_id, user_type) VALUES (?,?,?)",
                    achievementId, user.getId(), user.getUserType());
            return Result.success("点赞成功", null);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "操作失败" : e.getMessage());
        }
    }

    @PostMapping("/unlike")
    public Result<?> unlike(@RequestParam Long achievementId, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            jdbcTemplate.update("DELETE FROM likes WHERE achievement_id = ? AND user_id = ? AND user_type = ?",
                    achievementId, user.getId(), user.getUserType());
            return Result.success("已取消点赞", null);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "操作失败" : e.getMessage());
        }
    }

    @PostMapping("/view/{id}")
    public Result<?> view(@PathVariable Long id) {
        try {
            jdbcTemplate.update("UPDATE achievement SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?", id);
            return Result.success("浏览成功", null);
        } catch (Exception e) {
            return Result.error("操作失败");
        }
    }

    // ==================== 评分 / 评审 / 孵化 ====================

    @PostMapping("/score")
    public Result<?> score(@RequestParam Long achievementId, @RequestParam Integer score,
                           @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            if (!isStaff(user)) return Result.error("没有评分权限");
            if (score < 0 || score > 100) return Result.error("分数必须在 0-100 之间");
            int updated = jdbcTemplate.update(
                    "UPDATE achievement SET score = ?, score_teacher_id = ?, score_time = NOW() WHERE id = ?",
                    score, user.getId(), achievementId);
            if (updated == 0) return Result.error("成果不存在");
            return Result.success("第一阶段评分成功", null);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "评分失败" : e.getMessage());
        }
    }

    @PostMapping("/incubation-score")
    public Result<?> incubationScore(@RequestParam Long achievementId, @RequestParam Integer score,
                                     @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            if (!isStaff(user)) return Result.error("没有评分权限");
            if (score < 0 || score > 100) return Result.error("分数必须在 0-100 之间");
            int updated = jdbcTemplate.update("UPDATE achievement SET incubation_score = ? WHERE id = ?", score, achievementId);
            if (updated == 0) return Result.error("成果不存在");

            Map<String, Object> row = jdbcTemplate.queryForMap(
                    "SELECT score, incubation_score FROM achievement WHERE id = ?", achievementId);
            int first = row.get("score") == null ? 0 : ((Number) row.get("score")).intValue();
            int second = row.get("incubation_score") == null ? 0 : ((Number) row.get("incubation_score")).intValue();
            if (first > 80 && second > 80) {
                jdbcTemplate.update("UPDATE achievement SET expert_review = 1, review_status = 1 WHERE id = ?", achievementId);
                return Result.success("第二阶段评分成功，成果已推送到专家评审", null);
            }
            return Result.success("第二阶段评分成功", null);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "评分失败" : e.getMessage());
        }
    }

    @PostMapping("/complete-incubation")
    public Result<?> completeIncubation(@RequestParam Long achievementId, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            if (!isStaff(user)) return Result.error("没有操作权限");
            jdbcTemplate.update("UPDATE achievement SET incubation_status = 2 WHERE id = ?", achievementId);
            return Result.success("孵化完成", null);
        } catch (Exception e) {
            return Result.error("操作失败");
        }
    }

    @PostMapping("/incubation-reject")
    public Result<?> incubationReject(@RequestParam Long achievementId, @RequestParam String reason,
                                      @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            if (!isStaff(user)) return Result.error("没有操作权限");
            jdbcTemplate.update("UPDATE achievement SET incubation_status = 3, reject_reason = ? WHERE id = ?",
                    reason, achievementId);
            return Result.success("打回成功", null);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "打回失败" : e.getMessage());
        }
    }

    @PostMapping("/review-progress")
    public Result<?> reviewProgress(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            if (!isExpertOrAdmin(user)) return Result.error("没有评审权限");
            Object achievementId = body.get("achievementId");
            Object progress = body.get("progress");
            if (achievementId == null || progress == null) return Result.error("缺少必要参数");
            jdbcTemplate.update("UPDATE achievement SET review_progress = ? WHERE id = ?", progress, achievementId);
            return Result.success("更新评审进度成功", null);
        } catch (Exception e) {
            return Result.error("更新评审进度失败");
        }
    }

    @PostMapping("/review-pass")
    public Result<?> reviewPass(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            if (!isExpertOrAdmin(user)) return Result.error("没有评审权限");
            Object achievementId = body.get("achievementId");
            Object score = body.get("score");
            if (achievementId == null || score == null) return Result.error("缺少必要参数");
            jdbcTemplate.update("UPDATE achievement SET review_status = 2, expert_review = 1, score = ? WHERE id = ?",
                    score, achievementId);
            return Result.success("评审通过成功", null);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "评审通过失败" : e.getMessage());
        }
    }

    @PostMapping("/appeal")
    public Result<?> appeal(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            if (!"student".equals(user.getUserType())) return Result.error("只有学生可以申请复核");
            Object achievementId = body.get("achievementId");
            Object reason = body.get("reason");
            if (achievementId == null || reason == null || String.valueOf(reason).trim().isEmpty()) {
                return Result.error("缺少必要参数");
            }
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT student_id FROM achievement WHERE id = ?", achievementId);
            if (rows.isEmpty()) return Result.error("成果不存在");
            Object owner = rows.get(0).get("student_id");
            if (owner == null || ((Number) owner).longValue() != user.getId()) {
                return Result.error("只能对自己的成果申请复核");
            }
            Integer exists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM review_appeal WHERE achievement_id = ? AND status = '待处理'",
                    Integer.class, achievementId);
            if (exists != null && exists > 0) return Result.error("该成果已有待处理的复核申请");
            jdbcTemplate.update(
                    "INSERT INTO review_appeal (achievement_id, student_id, reason, status) VALUES (?,?,?,'待处理')",
                    achievementId, user.getId(), String.valueOf(reason).trim());
            return Result.success("复核申请已提交", null);
        } catch (Exception e) {
            return Result.error("提交复核申请失败");
        }
    }

    @PostMapping("/review-reject")
    public Result<?> reviewReject(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            if (!isExpertOrAdmin(user)) return Result.error("没有评审权限");
            Object achievementId = body.get("achievementId");
            Object reason = body.get("reason");
            if (achievementId == null || reason == null) return Result.error("缺少必要参数");
            jdbcTemplate.update("UPDATE achievement SET review_status = 3, reject_reason = ? WHERE id = ?",
                    reason, achievementId);
            return Result.success("评审打回成功", null);
        } catch (Exception e) {
            return Result.error("评审打回失败");
        }
    }

    @PostMapping("/reject")
    public Result<?> reject(@RequestParam Long achievementId,
                            @RequestParam String reason,
                            @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            if (!isStaff(user)) return Result.error("没有操作权限");
            jdbcTemplate.update("UPDATE achievement SET review_status = 3, reject_reason = ? WHERE id = ?",
                    reason, achievementId);
            return Result.success("打回成功", null);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "打回失败" : e.getMessage());
        }
    }

    // ==================== 修改 / 删除 ====================

    @PutMapping("/update")
    public Result<?> update(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            Object id = body.get("id");
            Object title = body.get("title");
            Object type = body.get("type");
            if (id == null || title == null || type == null) return Result.error("缺少必要参数");

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT student_id FROM achievement WHERE id = ?", id);
            if (rows.isEmpty()) return Result.error("成果不存在");
            Object owner = rows.get(0).get("student_id");
            if (!"admin".equals(user.getUserType())
                    && (owner == null || ((Number) owner).longValue() != user.getId())) {
                return Result.error("只能修改自己的成果");
            }
            jdbcTemplate.update("UPDATE achievement SET title = ?, type = ?, description = ?, update_time = NOW() WHERE id = ?",
                    title, type, body.get("description"), id);
            return Result.success("更新成功", null);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "更新失败" : e.getMessage());
        }
    }

    @DeleteMapping("/delete/{id}")
    public Result<?> delete(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT student_id FROM achievement WHERE id = ?", id);
            if (rows.isEmpty()) return Result.error("成果不存在");
            Object owner = rows.get(0).get("student_id");
            if (!"admin".equals(user.getUserType())
                    && (owner == null || ((Number) owner).longValue() != user.getId())) {
                return Result.error("只能删除自己的成果");
            }
            jdbcTemplate.update("DELETE FROM file WHERE achievement_id = ?", id);
            jdbcTemplate.update("DELETE FROM comment WHERE achievement_id = ?", id);
            jdbcTemplate.update("DELETE FROM likes WHERE achievement_id = ?", id);
            jdbcTemplate.update("DELETE FROM achievement WHERE id = ?", id);
            return Result.success("删除成功", null);
        } catch (Exception e) {
            return Result.error(e.getMessage() == null ? "删除失败" : e.getMessage());
        }
    }

    // ==================== 工具方法 ====================

    private boolean isStaff(JwtUser user) {
        return "teacher".equals(user.getUserType()) || "admin".equals(user.getUserType());
    }

    private boolean isExpertOrAdmin(JwtUser user) {
        return "expert".equals(user.getUserType()) || "admin".equals(user.getUserType());
    }

    private String achievementColumns() {
        return "id, title, type, description, student_id AS studentId, college, cover, " +
                "file_path AS filePath, file_name AS fileName, create_time AS createTime, update_time AS updateTime, " +
                "status, score, incubation_status AS incubationStatus, review_status AS reviewStatus, " +
                "review_progress AS reviewProgress, incubation_score AS incubationScore, " +
                "expert_review AS expertReview, reject_reason AS rejectReason, view_count AS viewCount";
    }

    private Map<String, Object> withFiles(Map<String, Object> row) {
        Map<String, Object> data = new LinkedHashMap<>(row);
        // 兼容部分前端页面读取 student_id 的写法
        if (data.containsKey("studentId")) {
            data.put("student_id", data.get("studentId"));
        }
        List<Map<String, Object>> files = jdbcTemplate.queryForList(
                "SELECT * FROM file WHERE achievement_id = ?", row.get("id"));
        List<Map<String, Object>> clubFiles = new ArrayList<>();
        List<Map<String, Object>> achievementFiles = new ArrayList<>();
        for (Map<String, Object> f : files) {
            Map<String, Object> info = fileInfo(f);
            if ("club".equals(String.valueOf(f.get("file_category")))) {
                clubFiles.add(info);
            } else {
                achievementFiles.add(info);
            }
        }
        data.put("clubFiles", clubFiles);
        data.put("achievementFiles", achievementFiles);
        return data;
    }

    private Map<String, Object> fileInfo(Map<String, Object> row) {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("id", row.get("id"));
        info.put("name", row.get("file_name"));
        info.put("url", "/uploads/" + basename(String.valueOf(row.get("file_path"))));
        info.put("size", row.get("file_size"));
        info.put("type", row.get("file_type"));
        info.put("createTime", row.get("create_time"));
        return info;
    }

    private String basename(String path) {
        String normalized = path.replace('\\', '/');
        int slash = normalized.lastIndexOf('/');
        return slash >= 0 ? normalized.substring(slash + 1) : normalized;
    }
}

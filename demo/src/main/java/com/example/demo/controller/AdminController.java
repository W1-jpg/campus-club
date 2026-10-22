package com.example.demo.controller;

import com.example.demo.config.JwtUser;
import com.example.demo.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.File;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 管理端：统计、学生/教师/专家/企业、成果、通知、资源、获奖、评审、申请
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Value("${file.upload.path}")
    private String uploadPath;

    /** 兼容旧版管理端资源附件字段 */
    @PostConstruct
    public void initSchema() {
        try {
            jdbcTemplate.execute("ALTER TABLE resource ADD COLUMN file_path VARCHAR(500)");
        } catch (Exception ignored) {
            // 列已存在
        }
    }

    // ==================== 统计 ====================

    @GetMapping("/stats")
    public Result<?> stats(@AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("studentCount", count("SELECT COUNT(*) FROM student_user"));
            data.put("teacherCount", count("SELECT COUNT(*) FROM teacher_user"));
            data.put("clubCount", countSafe("SELECT COUNT(*) FROM club"));
            data.put("resultCount", count("SELECT COUNT(*) FROM achievement"));
            data.put("awardCount", count("SELECT COUNT(*) FROM award"));
            data.put("resourceCount", count("SELECT COUNT(*) FROM resource"));
            data.put("applicationCount", count("SELECT COUNT(*) FROM resource_application"));
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("获取统计数据失败");
        }
    }

    // ==================== 学生 ====================

    @GetMapping("/students")
    public Result<?> students(@RequestParam(defaultValue = "1") int page,
                              @RequestParam(defaultValue = "10") int pageSize,
                              @RequestParam(defaultValue = "") String search,
                              @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            String where = "";
            List<Object> params = new ArrayList<>();
            if (!search.isEmpty()) {
                where = " WHERE username LIKE ? OR real_name LIKE ? OR college LIKE ?";
                for (int i = 0; i < 3; i++) params.add("%" + search + "%");
            }
            int total = count("SELECT COUNT(*) FROM student_user" + where, params.toArray());
            List<Object> listParams = new ArrayList<>(params);
            listParams.add(pageSize);
            listParams.add((Math.max(page, 1) - 1) * pageSize);
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT * FROM student_user" + where + " LIMIT ? OFFSET ?", listParams.toArray());
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("students", stripPasswords(rows));
            data.put("total", total);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("获取学生列表失败");
        }
    }

    @PostMapping("/students")
    public Result<?> addStudent(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            Object username = body.get("username");
            Object password = body.get("password");
            if (username == null || password == null) return Result.error("缺少必要参数");
            Object id = body.get("id");
            String encoded = passwordEncoder.encode(String.valueOf(password));
            if (id != null && !String.valueOf(id).isEmpty()) {
                jdbcTemplate.update("INSERT INTO student_user (id, username, password, real_name, phone, email, college) VALUES (?,?,?,?,?,?,?)",
                        id, username, encoded, body.get("real_name"), body.get("phone"), body.get("email"), body.get("college"));
            } else {
                jdbcTemplate.update("INSERT INTO student_user (username, password, real_name, phone, email, college) VALUES (?,?,?,?,?,?)",
                        username, encoded, body.get("real_name"), body.get("phone"), body.get("email"), body.get("college"));
            }
            return Result.success("添加学生成功", null);
        } catch (Exception e) {
            return Result.error("添加学生失败");
        }
    }

    @PutMapping("/students/{id}")
    public Result<?> updateStudent(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                   @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            jdbcTemplate.update("UPDATE student_user SET username=?, real_name=?, phone=?, email=?, college=? WHERE id=?",
                    body.get("username"), body.get("real_name"), body.get("phone"), body.get("email"), body.get("college"), id);
            if (body.get("password") != null && !String.valueOf(body.get("password")).isEmpty()) {
                jdbcTemplate.update("UPDATE student_user SET password=? WHERE id=?",
                        passwordEncoder.encode(String.valueOf(body.get("password"))), id);
            }
            return Result.success("编辑学生成功", null);
        } catch (Exception e) {
            return Result.error("编辑学生失败");
        }
    }

    @DeleteMapping("/students/{id}")
    public Result<?> deleteStudent(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            jdbcTemplate.update("DELETE FROM student_user WHERE id=?", id);
            return Result.success("删除学生成功", null);
        } catch (Exception e) {
            return Result.error("删除学生失败");
        }
    }

    // ==================== 教师 ====================

    @GetMapping("/teachers")
    public Result<?> teachers(@RequestParam(defaultValue = "1") int page,
                              @RequestParam(defaultValue = "10") int pageSize,
                              @RequestParam(defaultValue = "") String search,
                              @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            String where = "";
            List<Object> params = new ArrayList<>();
            if (!search.isEmpty()) {
                where = " WHERE username LIKE ? OR real_name LIKE ? OR college LIKE ?";
                for (int i = 0; i < 3; i++) params.add("%" + search + "%");
            }
            int total = count("SELECT COUNT(*) FROM teacher_user" + where, params.toArray());
            List<Object> listParams = new ArrayList<>(params);
            listParams.add(pageSize);
            listParams.add((Math.max(page, 1) - 1) * pageSize);
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT * FROM teacher_user" + where + " LIMIT ? OFFSET ?", listParams.toArray());
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("teachers", stripPasswords(rows));
            data.put("total", total);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("获取教师列表失败");
        }
    }

    @PostMapping("/teachers")
    public Result<?> addTeacher(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            Object username = body.get("username");
            Object password = body.get("password");
            if (username == null || password == null) return Result.error("缺少必要参数");
            Object id = body.get("id");
            String encoded = passwordEncoder.encode(String.valueOf(password));
            if (id != null && !String.valueOf(id).isEmpty()) {
                jdbcTemplate.update("INSERT INTO teacher_user (id, username, password, real_name, teacher_no, email, college) VALUES (?,?,?,?,?,?,?)",
                        id, username, encoded, body.get("real_name"), body.get("teacher_no"), body.get("email"), body.get("college"));
            } else {
                jdbcTemplate.update("INSERT INTO teacher_user (username, password, real_name, teacher_no, email, college) VALUES (?,?,?,?,?,?)",
                        username, encoded, body.get("real_name"), body.get("teacher_no"), body.get("email"), body.get("college"));
            }
            return Result.success("添加教师成功", null);
        } catch (Exception e) {
            return Result.error("添加教师失败");
        }
    }

    @PutMapping("/teachers/{id}")
    public Result<?> updateTeacher(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                   @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            jdbcTemplate.update("UPDATE teacher_user SET username=?, real_name=?, teacher_no=?, email=?, college=? WHERE id=?",
                    body.get("username"), body.get("real_name"), body.get("teacher_no"), body.get("email"), body.get("college"), id);
            if (body.get("password") != null && !String.valueOf(body.get("password")).isEmpty()) {
                jdbcTemplate.update("UPDATE teacher_user SET password=? WHERE id=?",
                        passwordEncoder.encode(String.valueOf(body.get("password"))), id);
            }
            return Result.success("编辑教师成功", null);
        } catch (Exception e) {
            return Result.error("编辑教师失败");
        }
    }

    @DeleteMapping("/teachers/{id}")
    public Result<?> deleteTeacher(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            jdbcTemplate.update("DELETE FROM teacher_user WHERE id=?", id);
            return Result.success("删除教师成功", null);
        } catch (Exception e) {
            return Result.error("删除教师失败");
        }
    }

    // ==================== 成果 ====================

    @GetMapping("/results")
    public Result<?> results(@RequestParam(defaultValue = "1") int page,
                             @RequestParam(defaultValue = "10") int pageSize,
                             @RequestParam(defaultValue = "") String search,
                             @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            String where = "";
            List<Object> params = new ArrayList<>();
            if (!search.isEmpty()) {
                where = " WHERE a.title LIKE ? OR s.username LIKE ?";
                params.add("%" + search + "%");
                params.add("%" + search + "%");
            }
            int total = count("SELECT COUNT(*) FROM achievement a LEFT JOIN student_user s ON a.student_id = s.id" + where, params.toArray());
            List<Object> listParams = new ArrayList<>(params);
            listParams.add(pageSize);
            listParams.add((Math.max(page, 1) - 1) * pageSize);
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT a.*, s.username AS student_name FROM achievement a LEFT JOIN student_user s ON a.student_id = s.id" +
                            where + " LIMIT ? OFFSET ?", listParams.toArray());
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("results", rows);
            data.put("total", total);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("获取成果列表失败");
        }
    }

    @GetMapping("/results/{id}")
    public Result<?> resultDetail(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT a.*, s.username AS student_name FROM achievement a LEFT JOIN student_user s ON a.student_id = s.id WHERE a.id = ?", id);
            if (rows.isEmpty()) return Result.error("成果不存在");
            Map<String, Object> data = new LinkedHashMap<>(rows.get(0));
            data.put("files", jdbcTemplate.queryForList("SELECT * FROM file WHERE achievement_id = ?", id));
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("获取成果详情失败");
        }
    }

    @DeleteMapping("/results/{id}")
    public Result<?> deleteResult(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            jdbcTemplate.update("DELETE FROM file WHERE achievement_id=?", id);
            jdbcTemplate.update("DELETE FROM comment WHERE achievement_id=?", id);
            jdbcTemplate.update("DELETE FROM likes WHERE achievement_id=?", id);
            jdbcTemplate.update("DELETE FROM achievement WHERE id=?", id);
            return Result.success("删除成果成功", null);
        } catch (Exception e) {
            return Result.error("删除成果失败");
        }
    }

    // ==================== 通知 ====================

    @GetMapping("/notices")
    public Result<?> notices(@RequestParam(defaultValue = "1") int page,
                             @RequestParam(defaultValue = "10") int pageSize,
                             @RequestParam(defaultValue = "") String search,
                             @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            String where = "";
            List<Object> params = new ArrayList<>();
            if (!search.isEmpty()) {
                where = " WHERE title LIKE ?";
                params.add("%" + search + "%");
            }
            int total = count("SELECT COUNT(*) FROM notification" + where, params.toArray());
            List<Object> listParams = new ArrayList<>(params);
            listParams.add(pageSize);
            listParams.add((Math.max(page, 1) - 1) * pageSize);
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT * FROM notification" + where + " ORDER BY create_time DESC LIMIT ? OFFSET ?", listParams.toArray());
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("notices", rows);
            data.put("total", total);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("获取通知列表失败");
        }
    }

    @PostMapping("/notices")
    public Result<?> addNotice(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            if (body.get("title") == null || body.get("content") == null) return Result.error("缺少必要参数");
            jdbcTemplate.update("INSERT INTO notification (title, content, type) VALUES (?,?,'system')",
                    body.get("title"), body.get("content"));
            return Result.success("添加通知成功", null);
        } catch (Exception e) {
            return Result.error("添加通知失败");
        }
    }

    @PutMapping("/notices/{id}")
    public Result<?> updateNotice(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                  @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            jdbcTemplate.update("UPDATE notification SET title=?, content=? WHERE id=?",
                    body.get("title"), body.get("content"), id);
            return Result.success("编辑通知成功", null);
        } catch (Exception e) {
            return Result.error("编辑通知失败");
        }
    }

    @DeleteMapping("/notices/{id}")
    public Result<?> deleteNotice(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            jdbcTemplate.update("DELETE FROM notification WHERE id=?", id);
            return Result.success("删除通知成功", null);
        } catch (Exception e) {
            return Result.error("删除通知失败");
        }
    }

    // ==================== 资源 ====================

    @GetMapping("/resources")
    public Result<?> resources(@RequestParam(defaultValue = "1") int page,
                               @RequestParam(defaultValue = "10") int pageSize,
                               @RequestParam(defaultValue = "") String search,
                               @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            String where = "";
            List<Object> params = new ArrayList<>();
            if (!search.isEmpty()) {
                where = " WHERE title LIKE ? OR type LIKE ?";
                params.add("%" + search + "%");
                params.add("%" + search + "%");
            }
            int total = count("SELECT COUNT(*) FROM resource" + where, params.toArray());
            List<Object> listParams = new ArrayList<>(params);
            listParams.add(pageSize);
            listParams.add((Math.max(page, 1) - 1) * pageSize);
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT * FROM resource" + where + " LIMIT ? OFFSET ?", listParams.toArray());
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("resources", rows);
            data.put("total", total);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("获取资源列表失败");
        }
    }

    @PostMapping("/resources")
    public Result<?> addResource(@RequestParam String title,
                                 @RequestParam String type,
                                 @RequestParam(required = false) String description,
                                 @RequestParam(required = false) String provider,
                                 @RequestParam(required = false) MultipartFile resourceFile,
                                 @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            String filePath = resourceFile != null && !resourceFile.isEmpty() ? saveFile(resourceFile) : "";
            jdbcTemplate.update("INSERT INTO resource (title, type, description, provider, file_path, publish_time, status) " +
                            "VALUES (?,?,?,?,?,NOW(),'active')",
                    title, type, description, provider, filePath);
            return Result.success("添加资源成功", null);
        } catch (Exception e) {
            return Result.error("添加资源失败");
        }
    }

    @PutMapping("/resources/{id}")
    public Result<?> updateResource(@PathVariable Long id,
                                    @RequestParam String title,
                                    @RequestParam String type,
                                    @RequestParam(required = false) String description,
                                    @RequestParam(required = false) String provider,
                                    @RequestParam(required = false) MultipartFile resourceFile,
                                    @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            if (resourceFile != null && !resourceFile.isEmpty()) {
                jdbcTemplate.update("UPDATE resource SET title=?, type=?, description=?, provider=?, file_path=? WHERE id=?",
                        title, type, description, provider, saveFile(resourceFile), id);
            } else {
                jdbcTemplate.update("UPDATE resource SET title=?, type=?, description=?, provider=? WHERE id=?",
                        title, type, description, provider, id);
            }
            return Result.success("编辑资源成功", null);
        } catch (Exception e) {
            return Result.error("编辑资源失败");
        }
    }

    @DeleteMapping("/resources/{id}")
    public Result<?> deleteResource(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            jdbcTemplate.update("DELETE FROM resource_application WHERE resource_id=?", id);
            jdbcTemplate.update("DELETE FROM resource_expense WHERE resource_id=?", id);
            jdbcTemplate.update("DELETE FROM resource WHERE id=?", id);
            return Result.success("删除资源成功", null);
        } catch (Exception e) {
            return Result.error("删除资源失败");
        }
    }

    // ==================== 获奖 ====================

    @GetMapping("/awards")
    public Result<?> awards(@RequestParam(defaultValue = "1") int page,
                            @RequestParam(defaultValue = "10") int pageSize,
                            @RequestParam(defaultValue = "") String search,
                            @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            String where = "";
            List<Object> params = new ArrayList<>();
            if (!search.isEmpty()) {
                where = " WHERE a.title LIKE ? OR s.username LIKE ?";
                params.add("%" + search + "%");
                params.add("%" + search + "%");
            }
            int total = count("SELECT COUNT(*) FROM award a LEFT JOIN student_user s ON a.student_id = s.id" + where, params.toArray());
            List<Object> listParams = new ArrayList<>(params);
            listParams.add(pageSize);
            listParams.add((Math.max(page, 1) - 1) * pageSize);
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT a.*, s.username AS student_name FROM award a LEFT JOIN student_user s ON a.student_id = s.id" +
                            where + " LIMIT ? OFFSET ?", listParams.toArray());
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("awards", rows);
            data.put("total", total);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("获取获奖列表失败");
        }
    }

    @GetMapping("/awards/{id}")
    public Result<?> awardDetail(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT a.*, s.username AS student_name FROM award a LEFT JOIN student_user s ON a.student_id = s.id WHERE a.id=?", id);
            if (rows.isEmpty()) return Result.error("获奖信息不存在");
            Map<String, Object> data = new LinkedHashMap<>(rows.get(0));
            try {
                data.put("files", jdbcTemplate.queryForList("SELECT * FROM award_file WHERE award_id=?", id));
            } catch (Exception e) {
                data.put("files", new ArrayList<>());
            }
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("获取获奖详情失败");
        }
    }

    @DeleteMapping("/awards/{id}")
    public Result<?> deleteAward(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            jdbcTemplate.update("DELETE FROM award_file WHERE award_id=?", id);
            jdbcTemplate.update("DELETE FROM award WHERE id=?", id);
            return Result.success("删除获奖记录成功", null);
        } catch (Exception e) {
            return Result.error("删除获奖记录失败");
        }
    }

    // ==================== 专家 / 企业 ====================

    @GetMapping("/experts")
    public Result<?> experts(@RequestParam(defaultValue = "1") int page,
                             @RequestParam(defaultValue = "10") int pageSize,
                             @RequestParam(defaultValue = "") String search,
                             @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            String where = "";
            List<Object> params = new ArrayList<>();
            if (!search.isEmpty()) {
                where = " WHERE username LIKE ? OR real_name LIKE ? OR field LIKE ? OR title LIKE ? OR organization LIKE ?";
                for (int i = 0; i < 5; i++) params.add("%" + search + "%");
            }
            int total = count("SELECT COUNT(*) FROM expert_user" + where, params.toArray());
            List<Object> listParams = new ArrayList<>(params);
            listParams.add(pageSize);
            listParams.add((Math.max(page, 1) - 1) * pageSize);
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT * FROM expert_user" + where + " ORDER BY create_time DESC LIMIT ? OFFSET ?", listParams.toArray());
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("experts", stripPasswords(rows));
            data.put("total", total);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("查询失败");
        }
    }

    @PostMapping("/experts")
    public Result<?> addExpert(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            Object username = body.get("username");
            Object password = body.get("password");
            if (username == null || password == null) return Result.error("缺少必要参数");
            if (count("SELECT COUNT(*) FROM expert_user WHERE username=?", username) > 0) return Result.error("用户名已存在");
            jdbcTemplate.update("INSERT INTO expert_user (username,password,real_name,email,phone,field,title,organization) VALUES (?,?,?,?,?,?,?,?)",
                    username, passwordEncoder.encode(String.valueOf(password)), body.get("real_name"), body.get("email"),
                    body.get("phone"), body.get("field"), body.get("title"), body.get("organization"));
            return Result.success("添加成功", null);
        } catch (Exception e) {
            return Result.error("添加失败");
        }
    }

    @PutMapping("/experts/{id}")
    public Result<?> updateExpert(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                  @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            jdbcTemplate.update("UPDATE expert_user SET real_name=?,email=?,phone=?,field=?,title=?,organization=? WHERE id=?",
                    body.get("real_name"), body.get("email"), body.get("phone"), body.get("field"),
                    body.get("title"), body.get("organization"), id);
            if (body.get("password") != null && !String.valueOf(body.get("password")).isEmpty()) {
                jdbcTemplate.update("UPDATE expert_user SET password=? WHERE id=?",
                        passwordEncoder.encode(String.valueOf(body.get("password"))), id);
            }
            return Result.success("更新成功", null);
        } catch (Exception e) {
            return Result.error("更新失败");
        }
    }

    @DeleteMapping("/experts/{id}")
    public Result<?> deleteExpert(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            jdbcTemplate.update("DELETE FROM expert_user WHERE id=?", id);
            return Result.success("删除成功", null);
        } catch (Exception e) {
            return Result.error("删除失败");
        }
    }

    @GetMapping("/enterprises")
    public Result<?> enterprises(@RequestParam(defaultValue = "1") int page,
                                 @RequestParam(defaultValue = "10") int pageSize,
                                 @RequestParam(defaultValue = "") String search,
                                 @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            String where = "";
            List<Object> params = new ArrayList<>();
            if (!search.isEmpty()) {
                where = " WHERE company_name LIKE ? OR username LIKE ? OR industry LIKE ?";
                for (int i = 0; i < 3; i++) params.add("%" + search + "%");
            }
            int total = count("SELECT COUNT(*) FROM enterprise_user" + where, params.toArray());
            List<Object> listParams = new ArrayList<>(params);
            listParams.add(pageSize);
            listParams.add((Math.max(page, 1) - 1) * pageSize);
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT * FROM enterprise_user" + where + " ORDER BY create_time DESC LIMIT ? OFFSET ?", listParams.toArray());
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("enterprises", stripPasswords(rows));
            data.put("total", total);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("查询失败");
        }
    }

    @PostMapping("/enterprises")
    public Result<?> addEnterprise(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            Object username = body.get("username");
            Object password = body.get("password");
            Object companyName = body.get("company_name");
            if (username == null || password == null || companyName == null) return Result.error("缺少必要参数");
            if (count("SELECT COUNT(*) FROM enterprise_user WHERE username=?", username) > 0) return Result.error("用户名已存在");
            jdbcTemplate.update("INSERT INTO enterprise_user (username,password,real_name,email,company_name,industry,address) VALUES (?,?,?,?,?,?,?)",
                    username, passwordEncoder.encode(String.valueOf(password)), body.get("real_name"),
                    body.get("email"), companyName, body.get("industry"), body.get("address"));
            return Result.success("添加成功", null);
        } catch (Exception e) {
            return Result.error("添加失败");
        }
    }

    @PutMapping("/enterprises/{id}")
    public Result<?> updateEnterprise(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                      @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            jdbcTemplate.update("UPDATE enterprise_user SET real_name=?,email=?,company_name=?,industry=?,address=? WHERE id=?",
                    body.get("real_name"), body.get("email"), body.get("company_name"),
                    body.get("industry"), body.get("address"), id);
            if (body.get("password") != null && !String.valueOf(body.get("password")).isEmpty()) {
                jdbcTemplate.update("UPDATE enterprise_user SET password=? WHERE id=?",
                        passwordEncoder.encode(String.valueOf(body.get("password"))), id);
            }
            return Result.success("更新成功", null);
        } catch (Exception e) {
            return Result.error("更新失败");
        }
    }

    @DeleteMapping("/enterprises/{id}")
    public Result<?> deleteEnterprise(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            jdbcTemplate.update("DELETE FROM enterprise_user WHERE id=?", id);
            return Result.success("删除成功", null);
        } catch (Exception e) {
            return Result.error("删除失败");
        }
    }

    // ==================== 评审 / 申请 ====================

    @GetMapping("/reviews")
    public Result<?> reviews(@AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT er.id, er.achievement_id AS achievementId, a.title AS achievementTitle, " +
                            "er.score, er.comment, er.conclusion, er.review_type AS reviewType, er.review_time " +
                            "FROM expert_reviews er LEFT JOIN achievement a ON er.achievement_id = a.id ORDER BY er.review_time DESC");
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error("获取失败");
        }
    }

    @GetMapping("/applications")
    public Result<?> applications(@AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT ra.id, r.title AS resourceTitle, ra.student_name AS studentName, " +
                            "ra.student_college AS studentCollege, ra.status, ra.application_time AS applicationTime " +
                            "FROM resource_application ra LEFT JOIN resource r ON ra.resource_id = r.id " +
                            "ORDER BY ra.application_time DESC");
            return Result.success(rows);
        } catch (Exception e) {
            return Result.error("获取失败");
        }
    }

    // ==================== 设置 / 注销 ====================

    @GetMapping("/system-settings")
    public Result<?> systemSettings(@AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("systemName", "校园社团成果展示与孵化系统");
        data.put("systemVersion", "1.0.0");
        data.put("systemDescription", "用于展示和孵化校园社团成果的系统");
        data.put("contactEmail", "admin@example.com");
        data.put("contactPhone", "1234567890");
        return Result.success(data);
    }

    @PutMapping("/system-settings")
    public Result<?> saveSystemSettings(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        return Result.success("保存系统设置成功", null);
    }

    @GetMapping("/database-settings")
    public Result<?> databaseSettings(@AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("host", "localhost");
        data.put("port", "3306");
        data.put("database", "23db");
        data.put("username", "root");
        data.put("password", "root");
        return Result.success(data);
    }

    @PutMapping("/database-settings")
    public Result<?> saveDatabaseSettings(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        return Result.success("保存数据库设置成功", null);
    }

    @GetMapping("/file-settings")
    public Result<?> fileSettings(@AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("uploadDir", "./uploads");
        data.put("maxFileSize", "50");
        data.put("allowedFileTypes", "pdf,doc,docx,zip,rar,jpg,png,jpeg");
        return Result.success(data);
    }

    @PutMapping("/file-settings")
    public Result<?> saveFileSettings(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        return Result.success("保存文件上传设置成功", null);
    }

    @DeleteMapping("/delete-account")
    public Result<?> deleteAccount(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        if (!isAdmin(user)) return Result.error("没有管理权限");
        try {
            Object adminId = body.get("adminId");
            if (adminId == null) return Result.error("缺少必要参数");
            jdbcTemplate.update("DELETE FROM admin_user WHERE id=?", adminId);
            return Result.success("账号注销成功", null);
        } catch (Exception e) {
            return Result.error("注销账号失败");
        }
    }

    // ==================== 工具 ====================

    private boolean isAdmin(JwtUser user) {
        return user != null && "admin".equals(user.getUserType());
    }

    /** 列表不返回密码哈希 */
    private List<Map<String, Object>> stripPasswords(List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            row.remove("password");
        }
        return rows;
    }

    private int count(String sql, Object... params) {
        Integer value = jdbcTemplate.queryForObject(sql, Integer.class, params);
        return value == null ? 0 : value;
    }

    private int countSafe(String sql) {
        try {
            Integer value = jdbcTemplate.queryForObject(sql, Integer.class);
            return value == null ? 0 : value;
        } catch (Exception e) {
            return 0;
        }
    }

    private String saveFile(MultipartFile file) throws Exception {
        File dir = new File(uploadPath);
        if (!dir.exists() && !dir.mkdirs()) throw new RuntimeException("上传目录创建失败");
        String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        int dot = original.lastIndexOf('.');
        String ext = dot < 0 ? "" : original.substring(dot).toLowerCase();
        String savedName = UUID.randomUUID().toString().replace("-", "") + ext;
        file.transferTo(new File(dir, savedName));
        return new File(dir, savedName).getAbsolutePath();
    }
}

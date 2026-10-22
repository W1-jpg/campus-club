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
 * 通知模块：列表、详情、发布、修改、删除、学生通知
 */
@RestController
@RequestMapping("/api/notice")
public class SystemNoticeController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/list")
    public Result<?> list(@AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT * FROM notification ORDER BY create_time DESC");
            return Result.success(mapRows(rows));
        } catch (Exception e) {
            return Result.error("获取通知列表失败");
        }
    }

    @GetMapping("/detail/{id}")
    public Result<?> detail(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT * FROM notification WHERE id = ?", id);
            if (rows.isEmpty()) return Result.error("通知不存在");
            return Result.success(mapRows(rows).get(0));
        } catch (Exception e) {
            return Result.error("获取通知失败");
        }
    }

    @PostMapping("/create")
    public Result<?> create(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        try {
            if (!isTeacherOrAdmin(user)) return Result.error("没有发布通知的权限");
            Object title = body.get("title");
            Object content = body.get("content");
            if (title == null || content == null) return Result.error("缺少必要参数");
            String type = body.get("noticeType") == null ? "system" : String.valueOf(body.get("noticeType"));
            boolean isRead = "1".equals(String.valueOf(body.get("status"))) || Boolean.TRUE.equals(body.get("status"));
            jdbcTemplate.update(
                    "INSERT INTO notification (title, content, type, is_read) VALUES (?,?,?,?)",
                    title, content, type, isRead ? 1 : 0);
            return Result.success("发布成功", null);
        } catch (Exception e) {
            return Result.error("创建通知失败");
        }
    }

    @PutMapping("/update")
    public Result<?> update(@RequestBody Map<String, Object> body, @AuthenticationPrincipal JwtUser user) {
        try {
            if (!isTeacherOrAdmin(user)) return Result.error("没有修改通知的权限");
            Object id = body.get("id");
            Object title = body.get("title");
            Object content = body.get("content");
            if (id == null || title == null || content == null) return Result.error("缺少必要参数");
            jdbcTemplate.update("UPDATE notification SET title = ?, content = ? WHERE id = ?", title, content, id);
            return Result.success("更新成功", null);
        } catch (Exception e) {
            return Result.error("更新通知失败");
        }
    }

    @DeleteMapping("/delete/{id}")
    public Result<?> delete(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        try {
            if (!isTeacherOrAdmin(user)) return Result.error("没有删除通知的权限");
            jdbcTemplate.update("DELETE FROM notification WHERE id = ?", id);
            return Result.success("删除成功", null);
        } catch (Exception e) {
            return Result.error("删除通知失败");
        }
    }

    @GetMapping("/student/{id}")
    public Result<?> studentNotices(@PathVariable Long id, @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            if ("student".equals(user.getUserType()) && !id.equals(user.getId())) {
                return Result.error("只能查看自己的通知");
            }
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT * FROM notification WHERE type IN ('student','personal') ORDER BY create_time DESC");
            return Result.success(mapRows(rows));
        } catch (Exception e) {
            return Result.error("获取个人通知失败");
        }
    }

    private boolean isTeacherOrAdmin(JwtUser user) {
        return user != null && ("teacher".equals(user.getUserType()) || "admin".equals(user.getUserType()));
    }

    private List<Map<String, Object>> mapRows(List<Map<String, Object>> rows) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", row.get("id"));
            item.put("title", row.get("title"));
            item.put("content", row.get("content"));
            item.put("createTime", row.get("create_time"));
            Object read = row.get("is_read");
            item.put("status", read instanceof Boolean ? (((Boolean) read) ? 1 : 0)
                    : (read instanceof Number ? ((Number) read).intValue() : 0));
            item.put("type", row.get("type"));
            list.add(item);
        }
        return list;
    }
}

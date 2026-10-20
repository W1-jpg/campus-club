package com.example.demo.controller;

import com.example.demo.entity.SystemNotice;
import com.example.demo.service.SystemNoticeService;
import com.example.demo.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notice")
public class SystemNoticeController {

    @Autowired
    private SystemNoticeService systemNoticeService;

    /**
     * 创建通知
     */
    @PostMapping("/create")
    public Result<?> createNotice(@RequestBody SystemNotice notice) {
        try {
            SystemNotice created = systemNoticeService.createNotice(notice);
            return Result.success(created);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 更新通知
     */
    @PutMapping("/update")
    public Result<?> updateNotice(@RequestBody SystemNotice notice) {
        try {
            SystemNotice updated = systemNoticeService.updateNotice(notice);
            return Result.success(updated);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 删除通知
     */
    @DeleteMapping("/delete/{id}")
    public Result<?> deleteNotice(@PathVariable Long id) {
        try {
            systemNoticeService.deleteNotice(id);
            return Result.success("删除成功");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取通知详情
     */
    @GetMapping("/detail/{id}")
    public Result<?> getNoticeDetail(@PathVariable Long id) {
        try {
            SystemNotice notice = systemNoticeService.getNoticeById(id);
            if (notice == null) {
                return Result.error("通知不存在");
            }
            return Result.success(notice);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取所有通知
     */
    @GetMapping("/list")
    public Result<?> getAllNotices() {
        try {
            List<SystemNotice> notices = systemNoticeService.getAllNotices();
            return Result.success(notices);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取学生个人通知
     */
    @GetMapping("/student/{studentId}")
    public Result<?> getNoticesByStudentId(@PathVariable Long studentId) {
        try {
            List<SystemNotice> notices = systemNoticeService.getNoticesByStudentId(studentId);
            return Result.success(notices);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

}
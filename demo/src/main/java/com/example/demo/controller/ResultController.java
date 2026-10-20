package com.example.demo.controller;

import com.example.demo.entity.Result1; // 成果实体类
import com.example.demo.service.ResultService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 成果上传/查询控制器（方案1：@RequestParam接收studentId）
 */
@RestController
@RequestMapping("/api/old-result")
public class ResultController {

    private final ResultService resultService;

    public ResultController(ResultService resultService) {
        this.resultService = resultService;
    }

    /**
     * 成果上传接口
     * @param title 成果名称
     * @param description 成果描述
     * @param type 成果类型
     * @param file 附件文件（可选）
     * @param studentId 上传学生ID（前端传递）
     * @return 统一返回结果
     */
    @PostMapping("/upload")
    public com.example.demo.util.Result<?> uploadResult(
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam String type,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam Long studentId // 核心修改：改为@RequestParam接收前端参数
    ) {
        try {
            Result1 resultEntity = new Result1();
            resultEntity.setTitle(title);
            resultEntity.setDescription(description);
            resultEntity.setType(type);

            Result1 savedResult = resultService.uploadResult(resultEntity, file, studentId);
            return com.example.demo.util.Result.success(savedResult);
        } catch (Exception e) {
            return com.example.demo.util.Result.error("成果上传失败：" + e.getMessage());
        }
    }

    /**
     * 查询当前学生的所有成果
     * @param studentId 学生ID（前端传递）
     * @return 成果列表
     */
    @GetMapping("/my")
    public com.example.demo.util.Result<?> getMyResults(
            @RequestParam Long studentId // 核心修改：改为@RequestParam
    ) {
        try {
            return com.example.demo.util.Result.success(resultService.getMyResults(studentId));
        } catch (Exception e) {
            return com.example.demo.util.Result.error("查询成果失败：" + e.getMessage());
        }
    }
}
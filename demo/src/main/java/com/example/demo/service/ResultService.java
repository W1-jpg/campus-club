package com.example.demo.service;

import com.example.demo.entity.Result1;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface ResultService {
    // 上传成果
    Result1 uploadResult(Result1 result, MultipartFile file, Long studentId);
    // 查询我的成果
    List<Result1> getMyResults(Long studentId);
}
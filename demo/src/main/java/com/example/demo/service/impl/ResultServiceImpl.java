package com.example.demo.service.impl;

import com.example.demo.entity.Result1;
import com.example.demo.repository.ResultRepository;
import com.example.demo.service.ResultService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
public class ResultServiceImpl implements ResultService {

    @Autowired
    private ResultRepository resultRepository;

    @Value("${file.upload.path}")
    private String uploadPath;

    @Override
    public Result1 uploadResult(Result1 result, MultipartFile file, Long studentId) {
        // 处理文件上传
        if (file != null && !file.isEmpty()) {
            String originalFilename = file.getOriginalFilename();
            String suffix = originalFilename.substring(originalFilename.lastIndexOf("."));
            String fileName = UUID.randomUUID() + suffix;
            File dest = new File(uploadPath + File.separator + fileName);
            if (!dest.getParentFile().exists()) {
                dest.getParentFile().mkdirs();
            }
            try {
                file.transferTo(dest);
                result.setFileUrl("/files/" + fileName);
            } catch (IOException e) {
                throw new RuntimeException("文件上传失败");
            }
        }
        result.setStudentId(studentId);
        result.setStatus(0); // 待审核
        return resultRepository.save(result);
    }

    @Override
    public List<Result1> getMyResults(Long studentId) {
        return resultRepository.findByStudentId(studentId);
    }
}
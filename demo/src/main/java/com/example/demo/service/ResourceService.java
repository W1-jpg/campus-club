package com.example.demo.service;

import com.example.demo.entity.Resource;
import com.example.demo.entity.ResourceApplication;

import java.util.List;

public interface ResourceService {
    // 资源相关
    Resource createResource(Resource resource);
    Resource updateResource(Resource resource);
    void deleteResource(Long id);
    Resource getResourceById(Long id);
    List<Resource> getAllResources();
    List<Resource> getResourcesByType(String type);
    List<Resource> getResourcesByStatus(String status);
    List<Resource> getResourcesByTypeAndStatus(String type, String status);
    void incrementViewCount(Long id);

    // 资源申请相关
    ResourceApplication applyResource(ResourceApplication application);
    List<ResourceApplication> getApplicationsByResourceId(Long resourceId);
    List<ResourceApplication> getApplicationsByStudentId(Long studentId);
    void updateApplicationStatus(Long id, String status);
}
package com.example.demo.service.impl;

import com.example.demo.entity.Resource;
import com.example.demo.entity.ResourceApplication;
import com.example.demo.repository.ResourceRepository;
import com.example.demo.repository.ResourceApplicationRepository;
import com.example.demo.service.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class ResourceServiceImpl implements ResourceService {

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ResourceApplicationRepository resourceApplicationRepository;

    @Override
    public Resource createResource(Resource resource) {
        resource.setCreateTime(new Date());
        resource.setUpdateTime(new Date());
        resource.setViewCount(0);
        resource.setApplyCount(0);
        return resourceRepository.save(resource);
    }

    @Override
    public Resource updateResource(Resource resource) {
        resource.setUpdateTime(new Date());
        return resourceRepository.save(resource);
    }

    @Override
    public void deleteResource(Long id) {
        resourceRepository.deleteById(id);
    }

    @Override
    public Resource getResourceById(Long id) {
        return resourceRepository.findById(id).orElse(null);
    }

    @Override
    public List<Resource> getAllResources() {
        return resourceRepository.findAll();
    }

    @Override
    public List<Resource> getResourcesByType(String type) {
        return resourceRepository.findByType(type);
    }

    @Override
    public List<Resource> getResourcesByStatus(String status) {
        return resourceRepository.findByStatus(status);
    }

    @Override
    public List<Resource> getResourcesByTypeAndStatus(String type, String status) {
        return resourceRepository.findByTypeAndStatus(type, status);
    }

    @Override
    public void incrementViewCount(Long id) {
        Resource resource = resourceRepository.findById(id).orElse(null);
        if (resource != null) {
            resource.setViewCount(resource.getViewCount() + 1);
            resource.setUpdateTime(new Date());
            resourceRepository.save(resource);
        }
    }

    @Override
    public ResourceApplication applyResource(ResourceApplication application) {
        application.setApplicationTime(new Date());
        application.setStatus("待审核");
        ResourceApplication saved = resourceApplicationRepository.save(application);
        
        // 更新资源的申请数
        Resource resource = resourceRepository.findById(application.getResourceId()).orElse(null);
        if (resource != null) {
            resource.setApplyCount(resource.getApplyCount() + 1);
            resource.setUpdateTime(new Date());
            resourceRepository.save(resource);
        }
        
        return saved;
    }

    @Override
    public List<ResourceApplication> getApplicationsByResourceId(Long resourceId) {
        return resourceApplicationRepository.findByResourceId(resourceId);
    }

    @Override
    public List<ResourceApplication> getApplicationsByStudentId(Long studentId) {
        return resourceApplicationRepository.findByStudentId(studentId);
    }

    @Override
    public void updateApplicationStatus(Long id, String status) {
        ResourceApplication application = resourceApplicationRepository.findById(id).orElse(null);
        if (application != null) {
            application.setStatus(status);
            resourceApplicationRepository.save(application);
        }
    }
}
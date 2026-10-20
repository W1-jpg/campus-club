package com.example.demo.controller;

import com.example.demo.entity.Resource;
import com.example.demo.entity.ResourceApplication;
import com.example.demo.service.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resource")
public class ResourceController {

    @Autowired
    private ResourceService resourceService;

    // 资源相关接口
    @PostMapping
    public Resource createResource(@RequestBody Resource resource) {
        return resourceService.createResource(resource);
    }

    @PutMapping("/{id}")
    public Resource updateResource(@PathVariable Long id, @RequestBody Resource resource) {
        resource.setId(id);
        return resourceService.updateResource(resource);
    }

    @DeleteMapping("/{id}")
    public void deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
    }

    @GetMapping("/{id}")
    public Resource getResourceById(@PathVariable Long id) {
        resourceService.incrementViewCount(id);
        return resourceService.getResourceById(id);
    }

    @GetMapping("/list")
    public List<Resource> getAllResources() {
        return resourceService.getAllResources();
    }

    @GetMapping("/type/{type}")
    public List<Resource> getResourcesByType(@PathVariable String type) {
        return resourceService.getResourcesByType(type);
    }

    @GetMapping("/status/{status}")
    public List<Resource> getResourcesByStatus(@PathVariable String status) {
        return resourceService.getResourcesByStatus(status);
    }

    @GetMapping("/type/{type}/status/{status}")
    public List<Resource> getResourcesByTypeAndStatus(@PathVariable String type, @PathVariable String status) {
        return resourceService.getResourcesByTypeAndStatus(type, status);
    }

    // 资源申请相关接口
    @PostMapping("/apply")
    public ResourceApplication applyResource(@RequestBody ResourceApplication application) {
        return resourceService.applyResource(application);
    }

    @GetMapping("/applications/resource/{resourceId}")
    public List<ResourceApplication> getApplicationsByResourceId(@PathVariable Long resourceId) {
        return resourceService.getApplicationsByResourceId(resourceId);
    }

    @GetMapping("/applications/student/{studentId}")
    public List<ResourceApplication> getApplicationsByStudentId(@PathVariable Long studentId) {
        return resourceService.getApplicationsByStudentId(studentId);
    }

    @PutMapping("/applications/{id}/status")
    public void updateApplicationStatus(@PathVariable Long id, @RequestParam String status) {
        resourceService.updateApplicationStatus(id, status);
    }
}
package com.example.demo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 让 Spring 也能访问 /uploads/**，与 Express 共用同一个上传目录
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload.path}")
    private String uploadPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String path = uploadPath.endsWith("/") || uploadPath.endsWith("\\")
                ? uploadPath : uploadPath + "/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + path);
    }
}

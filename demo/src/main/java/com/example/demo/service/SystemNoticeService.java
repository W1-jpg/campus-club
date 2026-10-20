package com.example.demo.service;

import com.example.demo.entity.SystemNotice;

import java.util.List;

public interface SystemNoticeService {
    SystemNotice createNotice(SystemNotice notice);
    SystemNotice updateNotice(SystemNotice notice);
    void deleteNotice(Long id);
    SystemNotice getNoticeById(Long id);
    List<SystemNotice> getAllNotices();
    List<SystemNotice> getNoticesByStudentId(Long studentId);
}
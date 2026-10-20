package com.example.demo.service.impl;

import com.example.demo.entity.SystemNotice;
import com.example.demo.repository.SystemNoticeRepository;
import com.example.demo.service.SystemNoticeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class SystemNoticeServiceImpl implements SystemNoticeService {

    @Autowired
    private SystemNoticeRepository systemNoticeRepository;

    @Override
    public SystemNotice createNotice(SystemNotice notice) {
        notice.setCreateTime(new Date());
        notice.setUpdateTime(new Date());
        notice.setStatus(1);
        return systemNoticeRepository.save(notice);
    }

    @Override
    public SystemNotice updateNotice(SystemNotice notice) {
        notice.setUpdateTime(new Date());
        return systemNoticeRepository.save(notice);
    }

    @Override
    public void deleteNotice(Long id) {
        SystemNotice notice = systemNoticeRepository.findById(id).orElse(null);
        if (notice != null) {
            notice.setStatus(0);
            notice.setUpdateTime(new Date());
            systemNoticeRepository.save(notice);
        }
    }

    @Override
    public SystemNotice getNoticeById(Long id) {
        return systemNoticeRepository.findById(id).orElse(null);
    }

    @Override
    public List<SystemNotice> getAllNotices() {
        return systemNoticeRepository.findByStatusOrderByCreateTimeDesc(1);
    }

    @Override
    public List<SystemNotice> getNoticesByStudentId(Long studentId) {
        return systemNoticeRepository.findByStudentIdAndStatusOrderByCreateTimeDesc(studentId, 1);
    }
}
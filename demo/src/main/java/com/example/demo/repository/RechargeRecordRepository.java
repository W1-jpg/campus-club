package com.example.demo.repository;

import com.example.demo.entity.RechargeRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RechargeRecordRepository extends JpaRepository<RechargeRecord, Long> {
    RechargeRecord findByOutTradeNo(String outTradeNo);

    List<RechargeRecord> findByEnterpriseIdOrderByCreateTimeDesc(Long enterpriseId);

    Page<RechargeRecord> findByEnterpriseId(Long enterpriseId, Pageable pageable);

    Page<RechargeRecord> findByEnterpriseIdAndStatusNot(Long enterpriseId, String status, Pageable pageable);

    int countByEnterpriseIdAndStatus(Long enterpriseId, String status);
}

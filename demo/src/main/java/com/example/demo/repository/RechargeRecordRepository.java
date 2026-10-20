package com.example.demo.repository;

import com.example.demo.entity.RechargeRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

public interface RechargeRecordRepository extends JpaRepository<RechargeRecord, Long> {
    RechargeRecord findByOutTradeNo(String outTradeNo);

    List<RechargeRecord> findByEnterpriseIdOrderByCreateTimeDesc(Long enterpriseId);

    Page<RechargeRecord> findByEnterpriseId(Long enterpriseId, Pageable pageable);

    Page<RechargeRecord> findByEnterpriseIdAndStatusNot(Long enterpriseId, String status, Pageable pageable);

    /** 充值记录：pay_method 不是 balance 的记录 */
    Page<RechargeRecord> findByEnterpriseIdAndPayMethodNot(Long enterpriseId, String payMethod, Pageable pageable);

    /** 消费记录：pay_method 为 balance 的记录 */
    Page<RechargeRecord> findByEnterpriseIdAndPayMethod(Long enterpriseId, String payMethod, Pageable pageable);

    int countByEnterpriseIdAndStatus(Long enterpriseId, String status);

    int countByEnterpriseIdAndStatusAndPayMethodNot(Long enterpriseId, String status, String payMethod);

    /** 幂等地把订单标记为成功，只有从非 SUCCESS 状态更新时才返回 1 */
    @Modifying
    @Query("update RechargeRecord r set r.status = 'SUCCESS', r.tradeNo = :tradeNo, r.payTime = :payTime " +
           "where r.id = :id and r.status <> 'SUCCESS'")
    int markPaid(@Param("id") Long id,
                 @Param("tradeNo") String tradeNo,
                 @Param("payTime") Date payTime);

    /** 累计消费金额 */
    @Query("select sum(r.amount) from RechargeRecord r " +
           "where r.enterpriseId = :enterpriseId and r.payMethod = 'balance' and r.status = 'SUCCESS'")
    BigDecimal sumConsumed(@Param("enterpriseId") Long enterpriseId);
}

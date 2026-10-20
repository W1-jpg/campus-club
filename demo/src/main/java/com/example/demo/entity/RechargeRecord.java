package com.example.demo.entity;

import javax.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.Date;

@Data
@Entity
@Table(name = "recharge_record")
public class RechargeRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "enterprise_id")
    private Long enterpriseId;

    @Column(name = "out_trade_no", length = 64, unique = true)
    private String outTradeNo;

    @Column(name = "trade_no", length = 64)
    private String tradeNo;

    @Column(name = "amount", precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "status", length = 20)
    private String status; // PENDING / SUCCESS / FAILED

    @Column(name = "pay_method", length = 20)
    private String payMethod;

    @Column(name = "remark", length = 255)
    private String remark;

    @Column(name = "create_time")
    private Date createTime = new Date();

    @Column(name = "pay_time")
    private Date payTime;
}

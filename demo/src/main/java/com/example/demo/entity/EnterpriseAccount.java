package com.example.demo.entity;

import javax.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.Date;

@Data
@Entity
@Table(name = "enterprise_account")
public class EnterpriseAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "enterprise_id")
    private Long enterpriseId;

    @Column(name = "username")
    private String username;

    @Column(name = "balance", precision = 10, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "frozen_amount", precision = 10, scale = 2)
    private BigDecimal frozenAmount = BigDecimal.ZERO;

    @Column(name = "total_recharge", precision = 12, scale = 2)
    private BigDecimal totalRecharge = BigDecimal.ZERO;

    @Column(name = "create_time")
    private Date createTime = new Date();

    @Column(name = "update_time")
    private Date updateTime = new Date();
}

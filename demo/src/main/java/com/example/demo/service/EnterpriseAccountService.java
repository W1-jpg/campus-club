package com.example.demo.service;

import com.example.demo.entity.EnterpriseAccount;
import com.example.demo.entity.RechargeRecord;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface EnterpriseAccountService {

    /** 获取或创建企业账户 */
    EnterpriseAccount getOrCreateAccount(Long enterpriseId, String username);

    /** 获取账户余额 */
    EnterpriseAccount getAccount(Long enterpriseId);

    /** 创建充值订单并返回支付宝支付表单HTML */
    String createRechargeOrder(Long enterpriseId, BigDecimal amount, String payMethod, String remark) throws Exception;

    /** 处理支付宝异步通知 */
    String handleAlipayNotify(Map<String, String> params);

    /** 查询充值成功次数 */
    int countSuccessRecharges(Long enterpriseId);

    /** 查询累计消费金额 */
    BigDecimal getTotalSpent(Long enterpriseId);

    /** 分页查询交易记录 */
    Map<String, Object> getRecordsPage(Long enterpriseId, String type, Integer page, Integer size);

    /** 扣款（企业付款给孵化项目等场景） */
    void deductBalance(Long enterpriseId, BigDecimal amount, String description);
}

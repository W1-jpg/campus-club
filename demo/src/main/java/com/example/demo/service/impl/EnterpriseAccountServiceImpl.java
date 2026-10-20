package com.example.demo.service.impl;

import com.alibaba.fastjson.JSONObject;
import com.alipay.api.AlipayClient;
import com.alipay.api.internal.util.AlipaySignature;
import com.alipay.api.request.AlipayTradePagePayRequest;
import com.alipay.api.request.AlipayTradeQueryRequest;
import com.alipay.api.response.AlipayTradePagePayResponse;
import com.alipay.api.response.AlipayTradeQueryResponse;
import com.example.demo.entity.EnterpriseAccount;
import com.example.demo.entity.RechargeRecord;
import com.example.demo.repository.EnterpriseAccountRepository;
import com.example.demo.repository.RechargeRecordRepository;
import com.example.demo.service.EnterpriseAccountService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class EnterpriseAccountServiceImpl implements EnterpriseAccountService {

    private static final Logger log = LoggerFactory.getLogger(EnterpriseAccountServiceImpl.class);

    private static final BigDecimal MIN_AMOUNT = new BigDecimal("0.01");
    private static final BigDecimal MAX_AMOUNT = new BigDecimal("500000");
    /** 余额支付的标识：pay_method = balance 的记录视为消费 */
    private static final String BALANCE_PAY = "balance";

    @Autowired
    private EnterpriseAccountRepository accountRepository;

    @Autowired
    private RechargeRecordRepository rechargeRecordRepository;

    @Autowired
    private AlipayClient alipayClient;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Value("${alipay.notify-url}")
    private String notifyUrl;

    @Value("${alipay.return-url}")
    private String returnUrl;

    @Value("${alipay.alipay-public-key}")
    private String alipayPublicKey;

    @Value("${alipay.app-id}")
    private String alipayAppId;

    /** 可选：支付宝账号 PID，配置后通知会校验 seller_id */
    @Value("${alipay.seller-id:}")
    private String alipaySellerId;

    @Override
    public EnterpriseAccount getOrCreateAccount(Long enterpriseId, String username) {
        EnterpriseAccount account = accountRepository.findByEnterpriseId(enterpriseId);
        if (account == null) {
            account = new EnterpriseAccount();
            account.setEnterpriseId(enterpriseId);
            account.setUsername(username);
            account.setBalance(BigDecimal.ZERO);
            account.setFrozenAmount(BigDecimal.ZERO);
            account.setTotalRecharge(BigDecimal.ZERO);
            account.setCreateTime(new Date());
            account.setUpdateTime(new Date());
            account = accountRepository.save(account);
        }
        return account;
    }

    @Override
    public EnterpriseAccount getAccount(Long enterpriseId) {
        return getOrCreateAccount(enterpriseId, null);
    }

    @Override
    @Transactional
    public String createRechargeOrder(Long enterpriseId, BigDecimal amount, String payMethod, String remark) throws Exception {
        if (enterpriseId == null || enterpriseId <= 0) {
            throw new IllegalArgumentException("企业ID不合法");
        }
        BigDecimal normalized = validateAmount(amount);
        getOrCreateAccount(enterpriseId, null);

        // 商户订单号：企业ID + 毫秒时间 + 4 位随机数，降低并发碰撞概率
        String outTradeNo = "CZ" + enterpriseId
                + new SimpleDateFormat("yyyyMMddHHmmssSSS").format(new Date())
                + String.format("%04d", ThreadLocalRandom.current().nextInt(10000));

        RechargeRecord record = new RechargeRecord();
        record.setEnterpriseId(enterpriseId);
        record.setOutTradeNo(outTradeNo);
        record.setAmount(normalized);
        record.setStatus("PENDING");
        record.setPayMethod(payMethod != null && !payMethod.isEmpty() ? payMethod : "alipay");
        record.setRemark(remark);
        record.setCreateTime(new Date());
        rechargeRecordRepository.save(record);

        AlipayTradePagePayRequest request = new AlipayTradePagePayRequest();
        request.setNotifyUrl(notifyUrl);
        request.setReturnUrl(returnUrl);

        JSONObject biz = new JSONObject();
        biz.put("out_trade_no", outTradeNo);
        biz.put("total_amount", normalized.toPlainString());
        biz.put("subject", "企业账户充值");
        biz.put("body", "企业ID:" + enterpriseId + " 账户充值" + normalized.toPlainString() + "元");
        biz.put("product_code", "FAST_INSTANT_TRADE_PAY");
        biz.put("timeout_express", "10m");
        request.setBizContent(biz.toJSONString());

        AlipayTradePagePayResponse response = alipayClient.pageExecute(request);
        if (!response.isSuccess()) {
            record.setStatus("FAILED");
            rechargeRecordRepository.save(record);
            log.error("支付宝下单失败 outTradeNo={}, code={}, msg={}", outTradeNo, response.getCode(), response.getMsg());
            throw new RuntimeException("创建支付订单失败，请稍后重试");
        }

        return response.getBody();
    }

    @Override
    @Transactional
    public String handleAlipayNotify(Map<String, String> params) {
        try {
            if (params == null || params.isEmpty()) {
                return "fail";
            }

            // 1. 验签
            boolean verified = AlipaySignature.rsaCheckV1(params, alipayPublicKey, "UTF-8", "RSA2");
            if (!verified) {
                log.warn("支付宝回调验签失败 outTradeNo={}", params.get("out_trade_no"));
                return "fail";
            }

            // 2. 校验 app_id，避免其他应用的回调打到本系统
            String notifyAppId = params.get("app_id");
            if (notifyAppId == null || !notifyAppId.equals(alipayAppId)) {
                log.warn("支付宝回调 app_id 不匹配: {}", notifyAppId);
                return "fail";
            }

            // 3. 可选校验 seller_id
            if (alipaySellerId != null && !alipaySellerId.isEmpty()) {
                String sellerId = params.get("seller_id");
                if (sellerId == null || !sellerId.equals(alipaySellerId)) {
                    log.warn("支付宝回调 seller_id 不匹配: {}", sellerId);
                    return "fail";
                }
            }

            String outTradeNo = params.get("out_trade_no");
            String tradeNo = params.get("trade_no");
            String tradeStatus = params.get("trade_status");
            String totalAmount = params.get("total_amount");
            if (outTradeNo == null || tradeStatus == null || totalAmount == null) {
                log.warn("支付宝回调缺少必要参数");
                return "fail";
            }

            RechargeRecord record = rechargeRecordRepository.findByOutTradeNo(outTradeNo);
            if (record == null) {
                log.warn("支付宝回调订单不存在 outTradeNo={}", outTradeNo);
                return "fail";
            }

            // 4. 校验回调金额与订单金额一致，避免金额篡改
            BigDecimal paidAmount;
            try {
                paidAmount = new BigDecimal(totalAmount);
            } catch (NumberFormatException e) {
                log.warn("支付宝回调金额格式非法: {}", totalAmount);
                return "fail";
            }
            if (record.getAmount() == null || paidAmount.compareTo(record.getAmount()) != 0) {
                log.warn("支付宝回调金额不一致 outTradeNo={}, order={}, paid={}",
                        outTradeNo, record.getAmount(), paidAmount);
                return "fail";
            }

            if (!"TRADE_SUCCESS".equals(tradeStatus) && !"TRADE_FINISHED".equals(tradeStatus)) {
                // 交易未成功：确认收到通知但不入账
                return "success";
            }

            // 5. 幂等：只有从非 SUCCESS 状态更新成功才入账，防止重复回调重复加钱
            int updated = rechargeRecordRepository.markPaid(record.getId(), tradeNo, new Date());
            if (updated == 0) {
                return "success";
            }

            EnterpriseAccount account = accountRepository.findByEnterpriseId(record.getEnterpriseId());
            if (account == null) {
                throw new IllegalStateException("企业账户不存在: " + record.getEnterpriseId());
            }
            account.setBalance(account.getBalance().add(paidAmount));
            account.setTotalRecharge(account.getTotalRecharge().add(paidAmount));
            account.setUpdateTime(new Date());
            accountRepository.save(account);

            log.info("充值到账 outTradeNo={}, amount={}", outTradeNo, paidAmount);
            return "success";
        } catch (Exception e) {
            log.error("处理支付宝回调失败", e);
            return "fail";
        }
    }

    @Override
    public int countSuccessRecharges(Long enterpriseId) {
        return rechargeRecordRepository.countByEnterpriseIdAndStatusAndPayMethodNot(enterpriseId, "SUCCESS", BALANCE_PAY);
    }

    @Override
    public BigDecimal getTotalSpent(Long enterpriseId) {
        BigDecimal total = rechargeRecordRepository.sumConsumed(enterpriseId);
        return total == null ? BigDecimal.ZERO : total;
    }

    @Override
    public Map<String, Object> getRecordsPage(Long enterpriseId, String type, Integer page, Integer size) {
        int pageNum = page == null || page < 1 ? 1 : page;
        int pageSize = size == null ? 10 : Math.min(Math.max(size, 1), 50);

        PageRequest pageRequest = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));
        boolean spend = "spend".equalsIgnoreCase(type) || "consume".equalsIgnoreCase(type);

        Page<RechargeRecord> recordPage = spend
                ? rechargeRecordRepository.findByEnterpriseIdAndPayMethod(enterpriseId, BALANCE_PAY, pageRequest)
                : rechargeRecordRepository.findByEnterpriseIdAndPayMethodNot(enterpriseId, BALANCE_PAY, pageRequest);

        List<Map<String, Object>> records = new ArrayList<>();
        for (RechargeRecord r : recordPage.getContent()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", r.getId());
            item.put("orderNo", r.getOutTradeNo());
            item.put("type", spend ? "spend" : "recharge");
            item.put("amount", r.getAmount());
            item.put("payMethod", r.getPayMethod());
            item.put("status", "SUCCESS".equals(r.getStatus()) ? "成功"
                    : "PENDING".equals(r.getStatus()) ? "处理中" : "失败");
            item.put("remark", r.getRemark());
            item.put("createTime", r.getCreateTime());
            records.add(item);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("records", records);
        result.put("total", recordPage.getTotalElements());
        result.put("page", pageNum);
        result.put("size", pageSize);
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> syncPendingOrders(Long enterpriseId) {
        List<RechargeRecord> pending = rechargeRecordRepository
                .findTop20ByEnterpriseIdAndStatusOrderByCreateTimeDesc(enterpriseId, "PENDING");
        int checked = 0;
        int paid = 0;

        for (RechargeRecord record : pending) {
            checked++;
            try {
                AlipayTradeQueryRequest request = new AlipayTradeQueryRequest();
                JSONObject biz = new JSONObject();
                biz.put("out_trade_no", record.getOutTradeNo());
                request.setBizContent(biz.toJSONString());

                AlipayTradeQueryResponse response = alipayClient.execute(request);
                if (response == null || !response.isSuccess()) {
                    continue;
                }
                String tradeStatus = response.getTradeStatus();
                if (!"TRADE_SUCCESS".equals(tradeStatus) && !"TRADE_FINISHED".equals(tradeStatus)) {
                    continue;
                }
                if (response.getTotalAmount() == null) {
                    continue;
                }
                BigDecimal paidAmount = new BigDecimal(response.getTotalAmount());
                if (record.getAmount() == null || paidAmount.compareTo(record.getAmount()) != 0) {
                    log.warn("主动查询金额不一致 outTradeNo={}, order={}, paid={}",
                            record.getOutTradeNo(), record.getAmount(), paidAmount);
                    continue;
                }

                int updated = rechargeRecordRepository.markPaid(record.getId(), response.getTradeNo(), new Date());
                if (updated == 0) {
                    continue;
                }

                EnterpriseAccount account = accountRepository.findByEnterpriseId(record.getEnterpriseId());
                if (account == null) {
                    account = getOrCreateAccount(record.getEnterpriseId(), null);
                }
                account.setBalance(account.getBalance().add(paidAmount));
                account.setTotalRecharge(account.getTotalRecharge().add(paidAmount));
                account.setUpdateTime(new Date());
                accountRepository.save(account);
                paid++;
            } catch (Exception e) {
                log.warn("主动查询支付宝订单失败 outTradeNo={}", record.getOutTradeNo(), e);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("checked", checked);
        result.put("paid", paid);
        result.put("pending", checked - paid);
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> payForResource(Long enterpriseId, Long resourceId, BigDecimal amount, String remark) {
        // 扣款并写消费流水（deductBalance 会加入当前事务）
        deductBalance(enterpriseId, amount, remark);

        // 记录资源收到的资助，供资源发布方查看
        jdbcTemplate.update(
                "INSERT INTO resource_expense (resource_id, enterprise_id, amount, remark, create_time) VALUES (?, ?, ?, ?, NOW())",
                resourceId, enterpriseId, amount, remark);

        EnterpriseAccount account = accountRepository.findByEnterpriseId(enterpriseId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("balance", account == null ? BigDecimal.ZERO : account.getBalance());
        result.put("amount", amount);
        result.put("resourceId", resourceId);
        return result;
    }

    @Override
    @Transactional
    public void deductBalance(Long enterpriseId, BigDecimal amount, String description) {
        BigDecimal normalized = validateAmount(amount);
        EnterpriseAccount account = accountRepository.findByEnterpriseId(enterpriseId);
        if (account == null) {
            throw new RuntimeException("企业账户不存在");
        }
        if (account.getBalance().compareTo(normalized) < 0) {
            throw new RuntimeException("账户余额不足，当前余额: " + account.getBalance() + "元");
        }

        account.setBalance(account.getBalance().subtract(normalized));
        account.setUpdateTime(new Date());
        accountRepository.save(account);

        // 写入消费流水，保证“交易记录”和“累计支出”可追溯
        RechargeRecord record = new RechargeRecord();
        record.setEnterpriseId(enterpriseId);
        record.setOutTradeNo("CS" + enterpriseId + System.currentTimeMillis()
                + String.format("%04d", ThreadLocalRandom.current().nextInt(10000)));
        record.setAmount(normalized);
        record.setStatus("SUCCESS");
        record.setPayMethod(BALANCE_PAY);
        record.setRemark(description);
        record.setCreateTime(new Date());
        record.setPayTime(new Date());
        rechargeRecordRepository.save(record);
    }

    /** 金额统一校验：正数、两位小数、单笔上限 */
    private BigDecimal validateAmount(BigDecimal amount) {
        if (amount == null) {
            throw new IllegalArgumentException("金额不能为空");
        }
        if (amount.compareTo(MIN_AMOUNT) < 0) {
            throw new IllegalArgumentException("金额必须大于 0");
        }
        if (amount.compareTo(MAX_AMOUNT) > 0) {
            throw new IllegalArgumentException("单笔金额不能超过 " + MAX_AMOUNT.toPlainString() + " 元");
        }
        if (amount.scale() > 2) {
            throw new IllegalArgumentException("金额最多保留两位小数");
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }
}

package com.example.demo.service.impl;

import com.alibaba.fastjson.JSONObject;
import com.alipay.api.AlipayClient;
import com.alipay.api.internal.util.AlipaySignature;
import com.alipay.api.request.AlipayTradePagePayRequest;
import com.alipay.api.response.AlipayTradePagePayResponse;
import com.example.demo.entity.EnterpriseAccount;
import com.example.demo.entity.RechargeRecord;
import com.example.demo.repository.EnterpriseAccountRepository;
import com.example.demo.repository.RechargeRecordRepository;
import com.example.demo.service.EnterpriseAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class EnterpriseAccountServiceImpl implements EnterpriseAccountService {

    @Autowired
    private EnterpriseAccountRepository accountRepository;

    @Autowired
    private RechargeRecordRepository rechargeRecordRepository;

    @Autowired
    private AlipayClient alipayClient;

    @Value("${alipay.notify-url}")
    private String notifyUrl;

    @Value("${alipay.return-url}")
    private String returnUrl;

    @Value("${alipay.alipay-public-key}")
    private String alipayPublicKey;

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
        getOrCreateAccount(enterpriseId, null);

        // 生成商户订单号
        String outTradeNo = "CZ" + enterpriseId + new SimpleDateFormat("yyyyMMddHHmmssSSS").format(new Date());

        // 保存充值记录
        RechargeRecord record = new RechargeRecord();
        record.setEnterpriseId(enterpriseId);
        record.setOutTradeNo(outTradeNo);
        record.setAmount(amount);
        record.setStatus("PENDING");
        record.setPayMethod(payMethod != null ? payMethod : "alipay");
        record.setRemark(remark);
        record.setCreateTime(new Date());
        rechargeRecordRepository.save(record);

        // 构造支付宝请求
        AlipayTradePagePayRequest request = new AlipayTradePagePayRequest();
        request.setNotifyUrl(notifyUrl);
        request.setReturnUrl(returnUrl);

        JSONObject biz = new JSONObject();
        biz.put("out_trade_no", outTradeNo);
        biz.put("total_amount", amount.toString());
        biz.put("subject", "企业账户充值");
        biz.put("body", "企业ID:" + enterpriseId + " 账户充值" + amount + "元");
        biz.put("product_code", "FAST_INSTANT_TRADE_PAY");
        biz.put("timeout_express", "10m");
        request.setBizContent(biz.toJSONString());

        AlipayTradePagePayResponse response = alipayClient.pageExecute(request);
        if (!response.isSuccess()) {
            record.setStatus("FAILED");
            rechargeRecordRepository.save(record);
            throw new RuntimeException("创建支付订单失败: " + response.getMsg());
        }

        return response.getBody();
    }

    @Override
    @Transactional
    public String handleAlipayNotify(Map<String, String> params) {
        try {
            // 验签
            boolean verified = AlipaySignature.rsaCheckV1(
                    params, alipayPublicKey, "UTF-8", "RSA2");

            if (!verified) {
                return "fail";
            }

            String outTradeNo = params.get("out_trade_no");
            String tradeNo = params.get("trade_no");
            String tradeStatus = params.get("trade_status");
            String totalAmount = params.get("total_amount");

            RechargeRecord record = rechargeRecordRepository.findByOutTradeNo(outTradeNo);
            if (record == null) {
                return "fail";
            }

            // 避免重复处理
            if ("SUCCESS".equals(record.getStatus())) {
                return "success";
            }

            if ("TRADE_SUCCESS".equals(tradeStatus) || "TRADE_FINISHED".equals(tradeStatus)) {
                // 更新充值记录
                record.setStatus("SUCCESS");
                record.setTradeNo(tradeNo);
                record.setPayTime(new Date());
                rechargeRecordRepository.save(record);

                // 增加账户余额
                EnterpriseAccount account = accountRepository.findByEnterpriseId(record.getEnterpriseId());
                if (account != null) {
                    BigDecimal amount = new BigDecimal(totalAmount);
                    account.setBalance(account.getBalance().add(amount));
                    account.setTotalRecharge(account.getTotalRecharge().add(amount));
                    account.setUpdateTime(new Date());
                    accountRepository.save(account);
                }
            }

            return "success";
        } catch (Exception e) {
            return "fail";
        }
    }

    @Override
    public int countSuccessRecharges(Long enterpriseId) {
        return rechargeRecordRepository.countByEnterpriseIdAndStatus(enterpriseId, "SUCCESS");
    }

    @Override
    public Map<String, Object> getRecordsPage(Long enterpriseId, String type, Integer page, Integer size) {
        PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createTime"));

        Page<RechargeRecord> recordPage;
        if ("recharge".equals(type)) {
            recordPage = rechargeRecordRepository.findByEnterpriseId(enterpriseId, pageRequest);
        } else {
            // 消费记录：目前用非 recharge 的全部记录（后续可扩展消费类型）
            recordPage = rechargeRecordRepository.findByEnterpriseIdAndStatusNot(
                    enterpriseId, "PENDING", pageRequest);
        }

        List<Map<String, Object>> records = new ArrayList<>();
        for (RechargeRecord r : recordPage.getContent()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", r.getId());
            item.put("orderNo", r.getOutTradeNo());
            item.put("type", "recharge");
            item.put("amount", r.getAmount());
            item.put("payMethod", r.getPayMethod());
            item.put("status", "SUCCESS".equals(r.getStatus()) ? "成功" :
                    "PENDING".equals(r.getStatus()) ? "处理中" : "失败");
            item.put("remark", r.getRemark());
            item.put("createTime", r.getCreateTime());
            records.add(item);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("records", records);
        result.put("total", recordPage.getTotalElements());
        result.put("page", page);
        result.put("size", size);
        return result;
    }

    @Override
    @Transactional
    public void deductBalance(Long enterpriseId, BigDecimal amount, String description) {
        EnterpriseAccount account = accountRepository.findByEnterpriseId(enterpriseId);
        if (account == null) {
            throw new RuntimeException("企业账户不存在");
        }
        if (account.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("账户余额不足，当前余额: " + account.getBalance() + "元");
        }
        account.setBalance(account.getBalance().subtract(amount));
        account.setUpdateTime(new Date());
        accountRepository.save(account);
    }
}

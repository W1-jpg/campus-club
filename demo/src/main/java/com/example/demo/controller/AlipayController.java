package com.example.demo.controller;

import com.example.demo.entity.EnterpriseAccount;
import com.example.demo.entity.RechargeRecord;
import com.example.demo.service.EnterpriseAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alipay")
public class AlipayController {

    @Autowired
    private EnterpriseAccountService accountService;

    /**
     * 创建充值订单 → 返回支付表单HTML（前端自动提交跳转支付宝收银台）
     */
    @PostMapping("/recharge")
    public Map<String, Object> recharge(@RequestBody Map<String, Object> req) throws Exception {
        Long enterpriseId = Long.valueOf(req.get("enterpriseId").toString());
        BigDecimal amount = new BigDecimal(req.get("amount").toString());
        String remark = req.containsKey("remark") ? req.get("remark").toString() : null;
        String payMethod = req.containsKey("payMethod") ? req.get("payMethod").toString() : "alipay";

        String payForm = accountService.createRechargeOrder(enterpriseId, amount, payMethod, remark);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("data", payForm);
        result.put("msg", "success");
        return result;
    }

    /**
     * 支付宝异步通知（支付成功回调 — 需要 natapp 让支付宝访问到你）
     */
    @PostMapping("/notify")
    @ResponseBody
    public String notify(@RequestParam Map<String, String> params) {
        return accountService.handleAlipayNotify(params);
    }

    /**
     * 获取企业账户 + 统计信息（前端钱包页面展示用）
     */
    @GetMapping("/account/{enterpriseId}/stats")
    public Map<String, Object> getAccountStats(@PathVariable Long enterpriseId) {
        EnterpriseAccount account = accountService.getAccount(enterpriseId);

        Map<String, Object> walletData = new HashMap<>();
        walletData.put("balance", account.getBalance());
        walletData.put("updateTime", account.getUpdateTime());

        Map<String, Object> statsData = new HashMap<>();
        statsData.put("totalRecharge", account.getTotalRecharge());
        statsData.put("totalSpend", BigDecimal.ZERO);
        statsData.put("rechargeCount", accountService.countSuccessRecharges(enterpriseId));

        Map<String, Object> result = new HashMap<>();
        Map<String, Object> data = new HashMap<>();
        data.put("wallet", walletData);
        data.put("stats", statsData);

        result.put("code", 200);
        result.put("data", data);
        result.put("msg", "success");
        return result;
    }

    /**
     * 获取充值/消费记录（分页）
     * 前端表格展示：编号、订单号、类型、金额、支付方式、状态、备注、时间
     */
    @GetMapping("/records/{enterpriseId}")
    public Map<String, Object> getRecords(
            @PathVariable Long enterpriseId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "recharge") String type) {

        Map<String, Object> pageResult = accountService.getRecordsPage(enterpriseId, type, page, size);

        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("data", pageResult);
        result.put("msg", "success");
        return result;
    }
}

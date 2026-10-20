package com.example.demo.controller;

import com.example.demo.config.JwtUser;
import com.example.demo.entity.EnterpriseAccount;
import com.example.demo.service.EnterpriseAccountService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/alipay")
public class AlipayController {

    private static final Logger log = LoggerFactory.getLogger(AlipayController.class);

    @Autowired
    private EnterpriseAccountService accountService;

    /**
     * 创建充值订单 → 返回支付宝支付表单 HTML
     */
    @PostMapping("/recharge")
    public Map<String, Object> recharge(@RequestBody Map<String, Object> req,
                                        @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null || !user.isEnterprise()) {
                return result(403, "只有企业账号可以充值", null);
            }

            Object amountRaw = req.get("amount");
            if (amountRaw == null) {
                return result(400, "缺少充值金额", null);
            }

            // 企业身份只取令牌，忽略请求体里的 enterpriseId
            Long enterpriseId = user.getId();
            BigDecimal amount;
            try {
                amount = new BigDecimal(String.valueOf(amountRaw).trim());
            } catch (NumberFormatException e) {
                return result(400, "金额格式不正确", null);
            }
            if (enterpriseId == null || enterpriseId <= 0) {
                return result(400, "企业ID不合法", null);
            }

            String remark = req.get("remark") == null ? null : String.valueOf(req.get("remark"));
            String payMethod = req.get("payMethod") == null ? "alipay" : String.valueOf(req.get("payMethod"));

            String payForm = accountService.createRechargeOrder(enterpriseId, amount, payMethod, remark);
            return result(200, "success", payForm);
        } catch (IllegalArgumentException e) {
            return result(400, e.getMessage(), null);
        } catch (Exception e) {
            log.error("创建充值订单失败", e);
            return result(500, "创建支付订单失败，请稍后重试", null);
        }
    }

    /**
     * 支付宝异步通知（需要公网可访问的 notify_url）
     */
    @PostMapping("/notify")
    @ResponseBody
    public String notify(@RequestParam Map<String, String> params) {
        return accountService.handleAlipayNotify(params);
    }

    /**
     * 主动同步待支付订单：不依赖异步回调，解决了 notify_url 不可达时余额不到账的问题
     */
    @PostMapping("/sync/{enterpriseId}")
    public Map<String, Object> syncPending(@PathVariable Long enterpriseId,
                                           @AuthenticationPrincipal JwtUser user) {
        if (!canAccess(user, enterpriseId)) {
            return result(403, "只能同步本企业的支付订单", null);
        }
        return result(200, "success", accountService.syncPendingOrders(enterpriseId));
    }

    /**
     * 获取企业账户 + 统计信息
     */
    @GetMapping("/account/{enterpriseId}/stats")
    public Map<String, Object> getAccountStats(@PathVariable Long enterpriseId,
                                               @AuthenticationPrincipal JwtUser user) {
        if (!canAccess(user, enterpriseId)) {
            return result(403, "只能查看本企业账户", null);
        }
        EnterpriseAccount account = accountService.getAccount(enterpriseId);

        Map<String, Object> walletData = new HashMap<>();
        walletData.put("balance", account.getBalance());
        walletData.put("updateTime", account.getUpdateTime());

        Map<String, Object> statsData = new HashMap<>();
        statsData.put("totalRecharge", account.getTotalRecharge());
        statsData.put("totalSpend", accountService.getTotalSpent(enterpriseId));
        statsData.put("rechargeCount", accountService.countSuccessRecharges(enterpriseId));

        Map<String, Object> data = new HashMap<>();
        data.put("wallet", walletData);
        data.put("stats", statsData);
        return result(200, "success", data);
    }

    /**
     * 获取充值/消费记录（分页）
     */
    @GetMapping("/records/{enterpriseId}")
    public Map<String, Object> getRecords(
            @PathVariable Long enterpriseId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "recharge") String type,
            @AuthenticationPrincipal JwtUser user) {

        if (!canAccess(user, enterpriseId)) {
            return result(403, "只能查看本企业交易记录", null);
        }

        Map<String, Object> pageResult = accountService.getRecordsPage(enterpriseId, type, page, size);
        return result(200, "success", pageResult);
    }

    private boolean canAccess(JwtUser user, Long enterpriseId) {
        return user != null && (user.isAdmin()
                || (user.isEnterprise() && user.getId() != null && user.getId().equals(enterpriseId)));
    }

    private Map<String, Object> result(int code, String msg, Object data) {
        Map<String, Object> result = new HashMap<>();
        result.put("code", code);
        result.put("msg", msg);
        result.put("data", data);
        return result;
    }
}

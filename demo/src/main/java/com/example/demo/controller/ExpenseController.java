package com.example.demo.controller;

import com.example.demo.entity.EnterpriseAccount;
import com.example.demo.entity.Resource;
import com.example.demo.repository.ResourceRepository;
import com.example.demo.service.EnterpriseAccountService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 企业钱包支出：选择平台资源 → 输入金额 → 余额扣款 → 生成消费流水
 */
@RestController
@RequestMapping("/api/expense")
public class ExpenseController {

    private static final Logger log = LoggerFactory.getLogger(ExpenseController.class);

    @Autowired
    private EnterpriseAccountService accountService;

    @Autowired
    private ResourceRepository resourceRepository;

    /** 可采购的资源列表（未结束） */
    @GetMapping("/resources")
    public Map<String, Object> resources() {
        List<Resource> all = resourceRepository.findAll();
        List<Map<String, Object>> list = new ArrayList<>();
        for (Resource resource : all) {
            if (resource.getStatus() != null && !resource.getStatus().isEmpty()
                    && !"进行中".equals(resource.getStatus())
                    && !"active".equalsIgnoreCase(resource.getStatus())) {
                continue;
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", resource.getId());
            item.put("title", resource.getTitle());
            item.put("type", resource.getType());
            item.put("provider", resource.getProvider());
            item.put("status", resource.getStatus());
            list.add(item);
        }
        return result(200, "success", list);
    }

    /** 确认支出 */
    @PostMapping("/pay")
    public Map<String, Object> pay(@RequestBody Map<String, Object> req) {
        try {
            Object enterpriseIdRaw = req.get("enterpriseId");
            Object resourceIdRaw = req.get("resourceId");
            Object amountRaw = req.get("amount");
            if (enterpriseIdRaw == null || resourceIdRaw == null || amountRaw == null) {
                return result(400, "缺少企业、资源或金额", null);
            }

            Long enterpriseId;
            Long resourceId;
            BigDecimal amount;
            try {
                enterpriseId = Long.valueOf(String.valueOf(enterpriseIdRaw).trim());
                resourceId = Long.valueOf(String.valueOf(resourceIdRaw).trim());
                amount = new BigDecimal(String.valueOf(amountRaw).trim());
            } catch (NumberFormatException e) {
                return result(400, "参数格式不正确", null);
            }
            if (enterpriseId <= 0 || resourceId <= 0) {
                return result(400, "参数不合法", null);
            }

            Resource resource = resourceRepository.findById(resourceId).orElse(null);
            if (resource == null) {
                return result(404, "资源不存在", null);
            }
            if (resource.getStatus() != null && !resource.getStatus().isEmpty()
                    && !"进行中".equals(resource.getStatus())
                    && !"active".equalsIgnoreCase(resource.getStatus())) {
                return result(400, "该资源已结束，无法采购", null);
            }

            String remark = req.get("remark") == null ? "" : String.valueOf(req.get("remark")).trim();
            String description = "资源采购：" + resource.getTitle()
                    + (remark.isEmpty() ? "" : "（" + remark + "）");

            accountService.deductBalance(enterpriseId, amount, description);

            EnterpriseAccount account = accountService.getAccount(enterpriseId);
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("balance", account.getBalance());
            data.put("amount", amount);
            data.put("resourceId", resource.getId());
            data.put("resourceTitle", resource.getTitle());
            return result(200, "支出成功", data);
        } catch (IllegalArgumentException e) {
            return result(400, e.getMessage(), null);
        } catch (RuntimeException e) {
            // 余额不足、账户不存在等业务异常
            return result(400, e.getMessage(), null);
        } catch (Exception e) {
            log.error("企业支出失败", e);
            return result(500, "支出失败，请稍后重试", null);
        }
    }

    private Map<String, Object> result(int code, String msg, Object data) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("code", code);
        result.put("msg", msg);
        result.put("data", data);
        return result;
    }
}

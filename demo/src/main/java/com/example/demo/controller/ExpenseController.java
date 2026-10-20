package com.example.demo.controller;

import com.example.demo.config.JwtUser;
import com.example.demo.entity.Resource;
import com.example.demo.repository.ResourceRepository;
import com.example.demo.service.EnterpriseAccountService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import javax.annotation.PostConstruct;
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

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /** 资源资助明细表：记录每笔支出由哪个企业付给了哪个资源 */
    @PostConstruct
    public void initSchema() {
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS resource_expense (" +
                "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                "resource_id BIGINT NOT NULL, " +
                "enterprise_id BIGINT NOT NULL, " +
                "amount DECIMAL(12,2) NOT NULL, " +
                "remark VARCHAR(255), " +
                "create_time DATETIME DEFAULT CURRENT_TIMESTAMP, " +
                "INDEX idx_resource (resource_id), " +
                "INDEX idx_enterprise (enterprise_id)" +
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    }

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
            BigDecimal received = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(amount), 0) FROM resource_expense WHERE resource_id = ?",
                    BigDecimal.class, resource.getId());
            item.put("receivedAmount", received);
            list.add(item);
        }
        return result(200, "success", list);
    }

    /** 确认支出 */
    @PostMapping("/pay")
    public Map<String, Object> pay(@RequestBody Map<String, Object> req,
                                   @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null || !user.isEnterprise()) {
                return result(403, "只有企业账号可以支出", null);
            }

            Object resourceIdRaw = req.get("resourceId");
            Object amountRaw = req.get("amount");
            if (resourceIdRaw == null || amountRaw == null) {
                return result(400, "缺少资源或金额", null);
            }

            // 企业身份只取令牌，忽略请求体里的 enterpriseId，避免越权扣款
            Long enterpriseId = user.getId();
            Long resourceId;
            BigDecimal amount;
            try {
                resourceId = Long.valueOf(String.valueOf(resourceIdRaw).trim());
                amount = new BigDecimal(String.valueOf(amountRaw).trim());
            } catch (NumberFormatException e) {
                return result(400, "参数格式不正确", null);
            }
            if (enterpriseId == null || enterpriseId <= 0 || resourceId <= 0) {
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

            Map<String, Object> payResult = accountService.payForResource(enterpriseId, resourceId, amount, description);

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("balance", payResult.get("balance"));
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

    /** 某个资源收到的资助明细（资源发布方查看） */
    @GetMapping("/resource/{resourceId}")
    public Map<String, Object> resourceExpenses(@PathVariable Long resourceId,
                                                @AuthenticationPrincipal JwtUser user) {
        Resource resource = resourceRepository.findById(resourceId).orElse(null);
        if (resource == null) {
            return result(404, "资源不存在", null);
        }
        // 企业只能查看自己发布的资源资助明细
        if (user != null && user.isEnterprise() && resource.getEnterpriseId() != null
                && !resource.getEnterpriseId().equals(user.getId())) {
            return result(403, "只能查看自己资源的资助明细", null);
        }

        List<Map<String, Object>> records = jdbcTemplate.queryForList(
                "SELECT e.id, e.enterprise_id AS enterpriseId, e.amount, e.remark, e.create_time AS createTime, " +
                "COALESCE(NULLIF(u.company_name, ''), u.username, CONCAT('企业', e.enterprise_id)) AS enterpriseName " +
                "FROM resource_expense e LEFT JOIN enterprise_user u ON e.enterprise_id = u.id " +
                "WHERE e.resource_id = ? ORDER BY e.create_time DESC", resourceId);
        BigDecimal total = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(amount), 0) FROM resource_expense WHERE resource_id = ?",
                BigDecimal.class, resourceId);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("total", total);
        data.put("records", records);
        return result(200, "success", data);
    }

    private Map<String, Object> result(int code, String msg, Object data) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("code", code);
        result.put("msg", msg);
        result.put("data", data);
        return result;
    }
}

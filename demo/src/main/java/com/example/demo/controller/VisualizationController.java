package com.example.demo.controller;

import com.example.demo.config.JwtUser;
import com.example.demo.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 数据可视化：KPI + 成果/获奖/资源/申请分布
 */
@RestController
@RequestMapping("/api/visualization")
public class VisualizationController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/dashboard")
    public Result<?> dashboard(@RequestParam(defaultValue = "global") String scope,
                               @AuthenticationPrincipal JwtUser user) {
        try {
            if (user == null) return Result.error("未登录或登录已过期");
            boolean personal = "personal".equals(scope) && "student".equals(user.getUserType());
            Long uid = user.getId();

            Map<String, Object> kpis = new LinkedHashMap<>();
            kpis.put("achievementCount", count("SELECT COUNT(*) FROM achievement" + achWhere(personal), p(personal, uid)));
            kpis.put("studentCount", count("SELECT COUNT(*) FROM student_user"));
            kpis.put("teacherCount", count("SELECT COUNT(*) FROM teacher_user"));
            kpis.put("clubCount", countSafe("SELECT COUNT(*) FROM club"));
            kpis.put("awardCount", count("SELECT COUNT(*) FROM award" + achWhere(personal), p(personal, uid)));
            kpis.put("resourceCount", count("SELECT COUNT(*) FROM resource"));
            kpis.put("applicationCount", count("SELECT COUNT(*) FROM resource_application" + appWhere(personal), p(personal, uid)));
            kpis.put("enterpriseCount", count("SELECT COUNT(*) FROM enterprise_user"));
            kpis.put("expertCount", count("SELECT COUNT(*) FROM expert_user"));
            kpis.put("viewTotal", count("SELECT COALESCE(SUM(view_count),0) FROM achievement" + achWhere(personal), p(personal, uid)));
            kpis.put("reviewPending", count("SELECT COUNT(*) FROM achievement WHERE review_status = 0" + (personal ? " AND student_id = ?" : ""), p(personal, uid)));
            kpis.put("incubationOngoing", count("SELECT COUNT(*) FROM achievement WHERE incubation_status = 1" + (personal ? " AND student_id = ?" : ""), p(personal, uid)));
            kpis.put("incubationDone", count("SELECT COUNT(*) FROM achievement WHERE incubation_status = 2" + (personal ? " AND student_id = ?" : ""), p(personal, uid)));
            kpis.put("applicationPending", count(
                    "SELECT COUNT(*) FROM resource_application WHERE status <> '已通过' AND status <> '已拒绝'" + (personal ? " AND student_id = ?" : ""),
                    p(personal, uid)));
            kpis.put("likeCount", count(personal
                    ? "SELECT COUNT(*) FROM likes l JOIN achievement a ON l.achievement_id = a.id WHERE a.student_id = ?"
                    : "SELECT COUNT(*) FROM likes", p(personal, uid)));
            kpis.put("commentCount", count(personal
                    ? "SELECT COUNT(*) FROM comment c JOIN achievement a ON c.achievement_id = a.id WHERE a.student_id = ?"
                    : "SELECT COUNT(*) FROM comment", p(personal, uid)));

            List<Map<String, Object>> typeDist = list(
                    "SELECT COALESCE(NULLIF(type,''),'未分类') AS name, COUNT(*) AS value FROM achievement" +
                            achWhere(personal) + " GROUP BY name ORDER BY value DESC", p(personal, uid));
            List<Map<String, Object>> orgDist = list(
                    "SELECT COALESCE(NULLIF(a.community_name,''), NULLIF(a.college,''), NULLIF(s.college,''), '未标注') AS name, " +
                            "COUNT(*) AS value FROM achievement a LEFT JOIN student_user s ON a.student_id = s.id" +
                            (personal ? " WHERE a.student_id = ?" : "") + " GROUP BY name ORDER BY value DESC", p(personal, uid));
            List<Map<String, Object>> collegeDist = list(
                    "SELECT COALESCE(NULLIF(a.college,''), NULLIF(s.college,''), '未标注') AS name, COUNT(*) AS value " +
                            "FROM achievement a LEFT JOIN student_user s ON a.student_id = s.id" +
                            (personal ? " WHERE a.student_id = ?" : "") + " GROUP BY name ORDER BY value DESC", p(personal, uid));
            List<Map<String, Object>> reviewDist = list(
                    "SELECT CASE review_status WHEN 0 THEN '待审核' WHEN 1 THEN '评审中' WHEN 2 THEN '已通过' " +
                            "WHEN 3 THEN '已打回' ELSE '未提交' END AS name, COUNT(*) AS value FROM achievement" +
                            achWhere(personal) + " GROUP BY name", p(personal, uid));
            List<Map<String, Object>> incubationDist = list(
                    "SELECT CASE incubation_status WHEN 0 THEN '未开始' WHEN 1 THEN '孵化中' WHEN 2 THEN '已完成' " +
                            "WHEN 3 THEN '已打回' ELSE '未开始' END AS name, COUNT(*) AS value FROM achievement" +
                            achWhere(personal) + " GROUP BY name", p(personal, uid));
            List<Map<String, Object>> scoreDist = list(
                    "SELECT CASE WHEN score IS NULL THEN '未评分' WHEN score < 60 THEN '60分以下' " +
                            "WHEN score < 70 THEN '60-69分' WHEN score < 80 THEN '70-79分' " +
                            "WHEN score < 90 THEN '80-89分' ELSE '90分以上' END AS name, COUNT(*) AS value " +
                            "FROM achievement" + achWhere(personal) + " GROUP BY name", p(personal, uid));

            List<String> months = recentMonths(12);
            List<Map<String, Object>> achMonthly = list(
                    "SELECT DATE_FORMAT(create_time,'%Y-%m') AS ym, COUNT(*) AS value FROM achievement " +
                            "WHERE create_time >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)" +
                            (personal ? " AND student_id = ?" : "") + " GROUP BY ym", p(personal, uid));

            List<Map<String, Object>> awardLevel = list(
                    "SELECT COALESCE(NULLIF(level,''),'未定级') AS name, COUNT(*) AS value FROM award" +
                            achWhere(personal) + " GROUP BY name ORDER BY value DESC", p(personal, uid));
            List<Map<String, Object>> awardYearly = list(
                    "SELECT YEAR(award_time) AS ym, COUNT(*) AS value FROM award WHERE award_time IS NOT NULL" +
                            (personal ? " AND student_id = ?" : "") + " GROUP BY ym ORDER BY ym", p(personal, uid));
            List<Map<String, Object>> awardOrg = list(
                    "SELECT COALESCE(NULLIF(college,''),'未标注') AS name, COUNT(*) AS value FROM award" +
                            achWhere(personal) + " GROUP BY name ORDER BY value DESC", p(personal, uid));

            List<Map<String, Object>> resType = list(
                    "SELECT COALESCE(NULLIF(type,''),'未分类') AS name, COUNT(*) AS value FROM resource GROUP BY name ORDER BY value DESC");
            List<Map<String, Object>> resStatus = list(
                    "SELECT COALESCE(NULLIF(status,''),'未知') AS name, COUNT(*) AS value FROM resource GROUP BY name");
            List<Map<String, Object>> resTop = list(
                    "SELECT title, COALESCE(apply_count,0) AS applyCount, COALESCE(view_count,0) AS viewCount " +
                            "FROM resource ORDER BY apply_count DESC, view_count DESC LIMIT 10");
            Map<String, Object> resTotals = list(
                    "SELECT COALESCE(SUM(view_count),0) AS totalViews, COALESCE(SUM(apply_count),0) AS totalApplies FROM resource")
                    .stream().findFirst().orElse(new LinkedHashMap<>());

            List<Map<String, Object>> appStatus = list(
                    "SELECT COALESCE(NULLIF(status,''),'待审核') AS name, COUNT(*) AS value FROM resource_application" +
                            appWhere(personal) + " GROUP BY name", p(personal, uid));
            List<Map<String, Object>> appMonthly = list(
                    "SELECT DATE_FORMAT(application_time,'%Y-%m') AS ym, COUNT(*) AS value FROM resource_application " +
                            "WHERE application_time >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)" +
                            (personal ? " AND student_id = ?" : "") + " GROUP BY ym", p(personal, uid));

            Map<String, Object> achievement = new LinkedHashMap<>();
            achievement.put("typeDist", typeDist);
            achievement.put("orgDist", orgDist);
            achievement.put("collegeDist", collegeDist);
            achievement.put("reviewStatusDist", sortByOrder(reviewDist, new String[]{"待审核", "评审中", "已通过", "已打回", "未提交"}));
            achievement.put("incubationStatusDist", sortByOrder(incubationDist, new String[]{"未开始", "孵化中", "已完成", "已打回"}));
            achievement.put("scoreDist", sortByOrder(scoreDist, new String[]{"90分以上", "80-89分", "70-79分", "60-69分", "60分以下", "未评分"}));
            Map<String, Object> achMonthlyObj = new LinkedHashMap<>();
            achMonthlyObj.put("labels", months);
            achMonthlyObj.put("values", fillMonths(achMonthly, months));
            achievement.put("monthly", achMonthlyObj);

            Map<String, Object> award = new LinkedHashMap<>();
            award.put("levelDist", awardLevel);
            Map<String, Object> awardYearlyObj = new LinkedHashMap<>();
            List<String> yearLabels = new ArrayList<>();
            List<Object> yearValues = new ArrayList<>();
            for (Map<String, Object> row : awardYearly) {
                yearLabels.add(String.valueOf(row.get("ym")));
                yearValues.add(row.get("value"));
            }
            awardYearlyObj.put("labels", yearLabels);
            awardYearlyObj.put("values", yearValues);
            award.put("yearly", awardYearlyObj);
            award.put("orgDist", awardOrg);

            Map<String, Object> resource = new LinkedHashMap<>();
            resource.put("typeDist", resType);
            resource.put("statusDist", resStatus);
            resource.put("topApplied", resTop);
            resource.put("totalViews", number(resTotals.get("totalViews")));
            resource.put("totalApplies", number(resTotals.get("totalApplies")));

            Map<String, Object> application = new LinkedHashMap<>();
            application.put("statusDist", appStatus);
            Map<String, Object> appMonthlyObj = new LinkedHashMap<>();
            appMonthlyObj.put("labels", months);
            appMonthlyObj.put("values", fillMonths(appMonthly, months));
            application.put("monthly", appMonthlyObj);

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("role", user.getUserType());
            data.put("scope", personal ? "personal" : "global");
            data.put("generatedAt", OffsetDateTime.now().toString());
            data.put("kpis", kpis);
            data.put("achievement", achievement);
            data.put("award", award);
            data.put("resource", resource);
            data.put("application", application);
            return Result.success(data);
        } catch (Exception e) {
            return Result.error("获取可视化数据失败");
        }
    }

    private String achWhere(boolean personal) {
        return personal ? " WHERE student_id = ?" : "";
    }

    private String appWhere(boolean personal) {
        return personal ? " WHERE student_id = ?" : "";
    }

    private Object[] p(boolean personal, Long uid) {
        return personal ? new Object[]{uid} : new Object[]{};
    }

    private int count(String sql, Object... params) {
        Integer value = jdbcTemplate.queryForObject(sql, Integer.class, params);
        return value == null ? 0 : value;
    }

    private int countSafe(String sql) {
        try {
            Integer value = jdbcTemplate.queryForObject(sql, Integer.class);
            return value == null ? 0 : value;
        } catch (Exception e) {
            return 0;
        }
    }

    private List<Map<String, Object>> list(String sql, Object... params) {
        return jdbcTemplate.queryForList(sql, params);
    }

    private int number(Object value) {
        return value instanceof Number ? ((Number) value).intValue() : 0;
    }

    private List<String> recentMonths(int count) {
        List<String> labels = new ArrayList<>();
        YearMonth now = YearMonth.now();
        for (int i = count - 1; i >= 0; i--) {
            labels.add(now.minusMonths(i).toString());
        }
        return labels;
    }

    private List<Integer> fillMonths(List<Map<String, Object>> rows, List<String> months) {
        Map<String, Integer> map = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            map.put(String.valueOf(row.get("ym")), number(row.get("value")));
        }
        List<Integer> values = new ArrayList<>();
        for (String month : months) {
            values.add(map.getOrDefault(month, 0));
        }
        return values;
    }

    private List<Map<String, Object>> sortByOrder(List<Map<String, Object>> rows, String[] order) {
        List<String> orders = java.util.Arrays.asList(order);
        rows.sort((a, b) -> Integer.compare(
                orders.indexOf(String.valueOf(a.get("name"))),
                orders.indexOf(String.valueOf(b.get("name")))));
        return rows;
    }
}

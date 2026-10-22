package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import javax.mail.internet.MimeMessage;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 邮箱验证码：注册 / 重置密码
 */
@Service
public class EmailCodeService {

    private static final long TTL = 5 * 60 * 1000L;
    private static final long COOLDOWN = 60 * 1000L;
    private static final int MAX_TRIES = 5;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    @Value("${mail.to:}")
    private String fixedTo;

    /** 仅本地联调时打开，生产环境保持 false，避免验证码进日志 */
    @Value("${mail.debug:false}")
    private boolean debug;

    private final Map<String, Code> codes = new ConcurrentHashMap<>();
    private final Map<String, Long> sentAt = new ConcurrentHashMap<>();

    private static class Code {
        final String code;
        final long expireAt;
        int tries;

        Code(String code, long expireAt) {
            this.code = code;
            this.expireAt = expireAt;
        }
    }

    public void sendRegisterCode(String email, String username) {
        if (email == null || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new RuntimeException("邮箱格式不正确");
        }
        send("register:" + email.toLowerCase(), email, "注册", username);
    }

    public void sendResetCode(String userType, String username) {
        String to = fixedTo == null || fixedTo.isEmpty() ? from : fixedTo;
        send("reset:" + userType + ":" + username, to, "重置密码", username);
    }

    private void send(String key, String to, String action, String username) {
        long now = System.currentTimeMillis();
        Long last = sentAt.get(key);
        if (last != null && now - last < COOLDOWN) {
            throw new RuntimeException("验证码已发送，请 60 秒后再试");
        }

        String code = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
        codes.put(key, new Code(code, now + TTL));
        sentAt.put(key, now);
        if (debug) {
            System.out.println("[mail-debug] " + key + " code=" + code);
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject("【校园社团平台】" + action + "验证码");
            helper.setText("您正在" + action + "（账号：" + username + "）。\n\n验证码：" + code
                    + "\n\n验证码 5 分钟内有效。如非本人操作，请忽略本邮件。", false);
            mailSender.send(message);
        } catch (Exception e) {
            codes.remove(key);
            sentAt.remove(key);
            throw new RuntimeException("验证码发送失败，请稍后重试");
        }
    }

    public void verifyRegisterCode(String email, String code) {
        verify("register:" + (email == null ? "" : email.toLowerCase()), code);
    }

    public void verifyResetCode(String userType, String username, String code) {
        verify("reset:" + userType + ":" + username, code);
    }

    private void verify(String key, String code) {
        Code record = codes.get(key);
        if (record == null) {
            throw new RuntimeException("请先获取邮箱验证码");
        }
        if (System.currentTimeMillis() > record.expireAt) {
            codes.remove(key);
            throw new RuntimeException("验证码已过期，请重新获取");
        }
        record.tries++;
        if (record.tries > MAX_TRIES) {
            codes.remove(key);
            throw new RuntimeException("验证码错误次数过多，请重新获取");
        }
        if (!record.code.equals(code)) {
            throw new RuntimeException("验证码不正确");
        }
        codes.remove(key);
    }
}

package com.example.demo.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

/**
 * 校验 Express 端签发的 JWT。
 * 两端使用同一个 JWT_SECRET，并以 UTF-8 原始字节作为 HMAC 密钥。
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Value("${jwt.secret}")
    private String secret;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            String token = header.substring(7).trim();
            try {
                Claims claims = Jwts.parser()
                        .setSigningKey(secret.getBytes(StandardCharsets.UTF_8))
                        .parseClaimsJws(token)
                        .getBody();

                Object idValue = claims.get("id");
                Long id = idValue instanceof Number
                        ? ((Number) idValue).longValue()
                        : Long.valueOf(String.valueOf(idValue));
                String username = claims.get("username", String.class);
                if (username == null || username.isEmpty()) {
                    // Spring 自己签发的令牌把用户名放在 subject
                    username = claims.getSubject();
                }
                String userType = claims.get("userType", String.class);
                String college = claims.get("college", String.class);

                JwtUser user = new JwtUser(id, username, userType, college);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                user, null,
                                Collections.singletonList(new SimpleGrantedAuthority(
                                        "ROLE_" + (userType == null ? "USER" : userType.toUpperCase()))));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception e) {
                // 令牌无效/过期：不设置认证，由 Security 返回 401
                SecurityContextHolder.clearContext();
            }
        }

        chain.doFilter(request, response);
    }
}

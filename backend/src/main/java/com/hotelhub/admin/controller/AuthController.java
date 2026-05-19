package com.hotelhub.admin.controller;

import com.hotelhub.admin.config.AuthProperties;
import com.hotelhub.admin.dto.auth.AuthResponse;
import com.hotelhub.admin.dto.auth.LoginRequest;
import com.hotelhub.admin.service.AuthService;
import com.hotelhub.admin.service.AuthTokens;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthProperties authProperties;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest,
        HttpServletResponse httpResponse
    ) {
        AuthTokens tokens = authService.login(request, clientIp(httpRequest), httpRequest.getHeader(HttpHeaders.USER_AGENT));
        writeRefreshCookie(httpResponse, tokens.refreshToken());
        return ResponseEntity.ok(toResponse(tokens));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
        AuthTokens tokens = authService.refresh(readRefreshToken(request), clientIp(request), request.getHeader(HttpHeaders.USER_AGENT));
        writeRefreshCookie(response, tokens.refreshToken());
        return ResponseEntity.ok(toResponse(tokens));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(readRefreshToken(request));
        clearRefreshCookie(response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        return ResponseEntity.ok(authService.currentUser(authentication.getName()));
    }

    private AuthResponse toResponse(AuthTokens tokens) {
        return new AuthResponse(tokens.accessToken(), "Bearer", tokens.expiresInSeconds(), tokens.user());
    }

    private void writeRefreshCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from(AuthService.REFRESH_COOKIE_NAME, refreshToken)
            .httpOnly(true)
            .secure(authProperties.isSecureCookies())
            .sameSite(authProperties.getSameSite())
            .path("/api/v1/auth")
            .maxAge(authProperties.getRefreshTokenDays() * 24 * 60 * 60)
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(AuthService.REFRESH_COOKIE_NAME, "")
            .httpOnly(true)
            .secure(authProperties.isSecureCookies())
            .sameSite(authProperties.getSameSite())
            .path("/api/v1/auth")
            .maxAge(0)
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String readRefreshToken(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (AuthService.REFRESH_COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

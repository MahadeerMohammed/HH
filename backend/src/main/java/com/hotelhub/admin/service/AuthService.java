package com.hotelhub.admin.service;

import com.hotelhub.admin.config.AuthProperties;
import com.hotelhub.admin.domain.AdminUser;
import com.hotelhub.admin.domain.RefreshToken;
import com.hotelhub.admin.dto.auth.LoginRequest;
import com.hotelhub.admin.dto.auth.UserProfileResponse;
import com.hotelhub.admin.exception.UnauthorizedException;
import com.hotelhub.admin.repository.AdminUserRepository;
import com.hotelhub.admin.repository.RefreshTokenRepository;
import com.hotelhub.admin.security.JwtService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    public static final String REFRESH_COOKIE_NAME = "hotelhub_refresh_token";

    private final AdminUserRepository adminUserRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthProperties authProperties;
    private final LoginAttemptService loginAttemptService;

    @Transactional
    public AuthTokens login(LoginRequest request, String ipAddress, String userAgent) {
        String normalizedEmail = normalizeEmail(request.email());
        String throttleKey = normalizedEmail + "|" + normalizeIp(ipAddress);

        loginAttemptService.assertAllowed(throttleKey);

        AdminUser adminUser = adminUserRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseThrow(() -> invalidCredentials(throttleKey));

        if (!adminUser.isActive() || !passwordEncoder.matches(request.password(), adminUser.getPasswordHash())) {
            throw invalidCredentials(throttleKey);
        }

        loginAttemptService.recordSuccess(throttleKey);
        adminUser.setLastLoginAt(Instant.now());
        return issueTokens(adminUser, ipAddress, userAgent, null);
    }

    @Transactional
    public AuthTokens refresh(String rawRefreshToken, String ipAddress, String userAgent) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new UnauthorizedException("Refresh token is missing.");
        }

        RefreshToken existingToken = refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(hashToken(rawRefreshToken))
            .orElseThrow(() -> new UnauthorizedException("Refresh token is invalid."));

        if (existingToken.getExpiresAt().isBefore(Instant.now())) {
            existingToken.setRevokedAt(Instant.now());
            throw new UnauthorizedException("Refresh token has expired.");
        }

        AdminUser adminUser = existingToken.getAdminUser();
        if (!adminUser.isActive()) {
            throw new UnauthorizedException("Admin account is inactive.");
        }

        return issueTokens(adminUser, ipAddress, userAgent, existingToken);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }

        refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(hashToken(rawRefreshToken))
            .ifPresent(token -> token.setRevokedAt(Instant.now()));
    }

    public UserProfileResponse currentUser(String email) {
        AdminUser adminUser = adminUserRepository.findByEmailIgnoreCase(normalizeEmail(email))
            .orElseThrow(() -> new UnauthorizedException("Admin account not found."));
        return toProfile(adminUser);
    }

    private AuthTokens issueTokens(AdminUser adminUser, String ipAddress, String userAgent, RefreshToken rotatedToken) {
        if (rotatedToken != null) {
            rotatedToken.setRevokedAt(Instant.now());
        } else {
            refreshTokenRepository.findByAdminUserAndRevokedAtIsNull(adminUser)
                .forEach(token -> token.setRevokedAt(Instant.now()));
        }

        cleanupExpiredTokens();

        String rawRefreshToken = SecurityTokenUtils.generateSecureToken();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setAdminUser(adminUser);
        refreshToken.setTokenHash(hashToken(rawRefreshToken));
        refreshToken.setExpiresAt(Instant.now().plus(authProperties.getRefreshTokenDays(), ChronoUnit.DAYS));
        refreshToken.setIpAddress(normalizeIp(ipAddress));
        refreshToken.setUserAgent(userAgent == null ? "unknown" : userAgent.substring(0, Math.min(userAgent.length(), 512)));
        refreshTokenRepository.save(refreshToken);

        return new AuthTokens(
            jwtService.generateAccessToken(adminUser),
            rawRefreshToken,
            authProperties.getAccessTokenMinutes() * 60,
            toProfile(adminUser)
        );
    }

    private void cleanupExpiredTokens() {
        refreshTokenRepository.deleteByExpiresAtBefore(Instant.now());
    }

    private UnauthorizedException invalidCredentials(String throttleKey) {
        loginAttemptService.recordFailure(throttleKey);
        return new UnauthorizedException("Invalid email or password.");
    }

    private UserProfileResponse toProfile(AdminUser adminUser) {
        return new UserProfileResponse(
            adminUser.getId(),
            adminUser.getEmail(),
            adminUser.getFullName(),
            adminUser.getRole().name()
        );
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable.", ex);
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeIp(String ipAddress) {
        return ipAddress == null || ipAddress.isBlank() ? "unknown" : ipAddress;
    }
}

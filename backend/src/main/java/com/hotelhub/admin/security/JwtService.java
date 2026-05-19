package com.hotelhub.admin.security;

import com.hotelhub.admin.config.AuthProperties;
import com.hotelhub.admin.domain.AdminUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final AuthProperties authProperties;

    private SecretKey signingKey;

    @PostConstruct
    void initialize() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(authProperties.getJwtSecret());
        } catch (IllegalArgumentException ex) {
            keyBytes = authProperties.getJwtSecret().getBytes(StandardCharsets.UTF_8);
        }

        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 bytes long.");
        }

        signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(AdminUser adminUser) {
        Instant now = Instant.now();
        Instant expiry = now.plus(authProperties.getAccessTokenMinutes(), ChronoUnit.MINUTES);

        return Jwts.builder()
            .subject(adminUser.getEmail())
            .issuer(authProperties.getIssuer())
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .claim("role", adminUser.getRole().name())
            .claim("fullName", adminUser.getFullName())
            .signWith(signingKey)
            .compact();
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        Claims claims = extractAllClaims(token);
        String username = claims.getSubject();
        Date expiration = claims.getExpiration();
        return username.equalsIgnoreCase(userDetails.getUsername()) && expiration.after(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}

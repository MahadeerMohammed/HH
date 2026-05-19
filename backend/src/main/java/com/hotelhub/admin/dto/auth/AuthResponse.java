package com.hotelhub.admin.dto.auth;

public record AuthResponse(
    String accessToken,
    String tokenType,
    long expiresInSeconds,
    UserProfileResponse user
) {
}

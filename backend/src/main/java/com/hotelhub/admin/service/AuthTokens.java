package com.hotelhub.admin.service;

import com.hotelhub.admin.dto.auth.UserProfileResponse;

public record AuthTokens(
    String accessToken,
    String refreshToken,
    long expiresInSeconds,
    UserProfileResponse user
) {
}

package com.hotelhub.admin.dto.auth;

import java.util.UUID;

public record UserProfileResponse(
    UUID id,
    String email,
    String fullName,
    String role
) {
}

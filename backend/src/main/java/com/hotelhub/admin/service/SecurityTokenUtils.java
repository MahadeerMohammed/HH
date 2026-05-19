package com.hotelhub.admin.service;

import java.security.SecureRandom;
import java.util.Base64;

public final class SecurityTokenUtils {

    private static final SecureRandom RANDOM = new SecureRandom();

    private SecurityTokenUtils() {
    }

    public static String generateSecureToken() {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}

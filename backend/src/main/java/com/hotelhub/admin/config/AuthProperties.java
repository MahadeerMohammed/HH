package com.hotelhub.admin.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Data
@Validated
@ConfigurationProperties(prefix = "app.auth")
public class AuthProperties {

    @NotBlank
    private String jwtSecret;

    @Min(5)
    private long accessTokenMinutes = 15;

    @Min(1)
    private long refreshTokenDays = 14;

    @NotBlank
    private String issuer = "hotelhub-admin";

    private boolean secureCookies = false;

    @NotBlank
    private String sameSite = "Strict";
}

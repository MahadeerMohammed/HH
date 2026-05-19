package com.hotelhub.admin.config;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Data
@Validated
@ConfigurationProperties(prefix = "app.bootstrap")
public class BootstrapProperties {

    @NotBlank
    private String adminEmail = "admin@hotelhub.local";

    @NotBlank
    private String adminPassword = "ChangeMe123!";

    @NotBlank
    private String adminFullName = "Hotel Admin";

    private boolean seedSampleData = true;
}

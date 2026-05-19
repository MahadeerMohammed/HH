package com.hotelhub.admin;

import com.hotelhub.admin.config.AuthProperties;
import com.hotelhub.admin.config.BootstrapProperties;
import com.hotelhub.admin.config.CorsProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({
    AuthProperties.class,
    CorsProperties.class,
    BootstrapProperties.class
})
public class HotelHubAdminApplication {

    public static void main(String[] args) {
        SpringApplication.run(HotelHubAdminApplication.class, args);
    }
}

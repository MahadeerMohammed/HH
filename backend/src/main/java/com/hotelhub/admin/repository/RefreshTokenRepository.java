package com.hotelhub.admin.repository;

import com.hotelhub.admin.domain.AdminUser;
import com.hotelhub.admin.domain.RefreshToken;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHashAndRevokedAtIsNull(String tokenHash);

    List<RefreshToken> findByAdminUserAndRevokedAtIsNull(AdminUser adminUser);

    long deleteByExpiresAtBefore(Instant cutoff);
}

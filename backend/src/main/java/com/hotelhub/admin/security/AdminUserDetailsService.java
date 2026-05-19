package com.hotelhub.admin.security;

import com.hotelhub.admin.domain.AdminUser;
import com.hotelhub.admin.exception.UnauthorizedException;
import com.hotelhub.admin.repository.AdminUserRepository;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminUserDetailsService implements UserDetailsService {

    private final AdminUserRepository adminUserRepository;

    @Override
    public UserDetails loadUserByUsername(String username) {
        AdminUser adminUser = loadAdmin(username);
        return User.builder()
            .username(adminUser.getEmail())
            .password(adminUser.getPasswordHash())
            .disabled(!adminUser.isActive())
            .authorities(new SimpleGrantedAuthority("ROLE_" + adminUser.getRole().name()))
            .build();
    }

    public AdminUser loadAdmin(String email) {
        return adminUserRepository.findByEmailIgnoreCase(email.trim().toLowerCase(Locale.ROOT))
            .orElseThrow(() -> new UnauthorizedException("Admin account not found."));
    }
}

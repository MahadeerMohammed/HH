package com.hotelhub.admin.service;

import com.hotelhub.admin.exception.RateLimitException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

    public void assertAllowed(String key) {
        AttemptState state = attempts.get(key);
        if (state == null) {
            return;
        }

        synchronized (state) {
            Instant now = Instant.now();
            if (state.lockedUntil != null && state.lockedUntil.isAfter(now)) {
                throw new RateLimitException("Too many failed logins. Try again later.");
            }
            if (state.lastFailureAt != null && state.lastFailureAt.plus(LOCK_DURATION).isBefore(now)) {
                attempts.remove(key);
            }
        }
    }

    public void recordFailure(String key) {
        AttemptState state = attempts.computeIfAbsent(key, ignored -> new AttemptState());
        synchronized (state) {
            Instant now = Instant.now();
            if (state.lastFailureAt != null && state.lastFailureAt.plus(LOCK_DURATION).isBefore(now)) {
                state.failures = 0;
            }
            state.failures++;
            state.lastFailureAt = now;
            if (state.failures >= MAX_ATTEMPTS) {
                state.lockedUntil = now.plus(LOCK_DURATION);
            }
        }
    }

    public void recordSuccess(String key) {
        attempts.remove(key);
    }

    private static final class AttemptState {
        private int failures;
        private Instant lastFailureAt;
        private Instant lockedUntil;
    }
}

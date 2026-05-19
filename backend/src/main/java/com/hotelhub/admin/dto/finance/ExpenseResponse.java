package com.hotelhub.admin.dto.finance;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ExpenseResponse(
    UUID id,
    UUID roomId,
    String roomNumber,
    LocalDate expenseDate,
    String category,
    String vendorName,
    BigDecimal amount,
    String notes,
    Instant createdAt
) {
}

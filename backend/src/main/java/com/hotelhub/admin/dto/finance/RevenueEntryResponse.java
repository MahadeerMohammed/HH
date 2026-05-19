package com.hotelhub.admin.dto.finance;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RevenueEntryResponse(
    UUID id,
    UUID roomId,
    String roomNumber,
    LocalDate stayDate,
    String guestName,
    String bookingChannel,
    Integer nights,
    BigDecimal grossRevenue,
    BigDecimal platformFee,
    BigDecimal taxAmount,
    BigDecimal variableCost,
    BigDecimal netRevenue,
    String notes,
    Instant createdAt
) {
}

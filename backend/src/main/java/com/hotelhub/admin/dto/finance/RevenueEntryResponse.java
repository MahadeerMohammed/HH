package com.hotelhub.admin.dto.finance;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record RevenueEntryResponse(
    UUID id,
    UUID bookingGroupId,
    UUID roomId,
    String roomNumber,
    LocalDate checkInDate,
    LocalTime checkInTime,
    LocalDate chargeFromDate,
    LocalDate rentUntilDate,
    LocalDate checkoutDate,
    LocalTime checkoutTime,
    String guestName,
    String mobileNumber,
    String address,
    String aadharNumber,
    String purposeOfStay,
    Integer rentDays,
    BigDecimal roomRent,
    BigDecimal grossRevenue,
    String rentEditReason,
    boolean checkingOut,
    Instant createdAt
) {
}

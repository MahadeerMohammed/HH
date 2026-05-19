package com.hotelhub.admin.dto.finance;

import java.math.BigDecimal;
import java.util.UUID;

public record RoomPerformanceResponse(
    UUID roomId,
    String roomNumber,
    String roomType,
    BigDecimal revenue,
    BigDecimal expenses,
    BigDecimal profit
) {
}

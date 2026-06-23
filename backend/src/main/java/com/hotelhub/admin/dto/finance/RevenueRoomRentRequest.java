package com.hotelhub.admin.dto.finance;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.UUID;

public record RevenueRoomRentRequest(
    @NotNull UUID roomId,
    @NotNull @DecimalMin("0.0") BigDecimal roomRent,
    @Size(max = 500) String rentEditReason
) {
}

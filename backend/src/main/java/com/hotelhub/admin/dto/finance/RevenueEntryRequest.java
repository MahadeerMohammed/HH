package com.hotelhub.admin.dto.finance;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record RevenueEntryRequest(
    @NotNull UUID roomId,
    @NotNull LocalDate stayDate,
    @NotBlank @Size(max = 120) String guestName,
    @NotBlank @Size(max = 80) String bookingChannel,
    @NotNull @Min(1) Integer nights,
    @NotNull @DecimalMin("0.0") BigDecimal grossRevenue,
    @NotNull @DecimalMin("0.0") BigDecimal platformFee,
    @NotNull @DecimalMin("0.0") BigDecimal taxAmount,
    @NotNull @DecimalMin("0.0") BigDecimal variableCost,
    @Size(max = 1200) String notes
) {
}

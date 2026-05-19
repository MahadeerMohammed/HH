package com.hotelhub.admin.dto.finance;

import com.hotelhub.admin.domain.ExpenseCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ExpenseRequest(
    UUID roomId,
    @NotNull LocalDate expenseDate,
    @NotNull ExpenseCategory category,
    @NotBlank @Size(max = 120) String vendorName,
    @NotNull @DecimalMin("0.0") BigDecimal amount,
    @Size(max = 1200) String notes
) {
}

package com.hotelhub.admin.dto.finance;

import java.math.BigDecimal;

public record MonthlyTrendPointResponse(
    String label,
    BigDecimal revenue,
    BigDecimal expenses,
    BigDecimal profit
) {
}
